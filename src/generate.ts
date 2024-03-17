import * as ast from "@apexlang/core/ast";
import * as model from "@apexlang/core/model";
import * as log from "@std/log";

import {
  Config,
  Configuration,
  FSStructure,
  Output,
  ProcessTemplateArgs,
  Template,
} from "./config.ts";
import {
  existsSync,
  makeRelativeUrl,
  mergeConfigurations,
  readSpec,
} from "./utils.ts";

export async function processPlugins(
  config: Configuration,
): Promise<Configuration> {
  const doc = await readSpec(config.spec);

  return await processPlugin(doc, config);
}

export async function processConfig(
  config: Configuration,
  scaffold = false,
): Promise<Output[]> {
  const doc = await readSpec(config.spec);

  config = await processPlugin(doc, config);

  const output: Output[] = [];
  for (const file in config.generates) {
    const generatorConfig = config.generates[file];

    if (generatorConfig.scaffold == true && !scaffold) {
      // TODO: denote skipped files.
      //log.info(`Skipping ${file}`);
      continue;
    }

    if (generatorConfig.ifNotExists == true && existsSync(file)) {
      // TODO: denote skipped files.
      //log.info(`Skipping ${file}`);
      continue;
    }

    const visitorConfig: Config = {};
    if (config.config) {
      for (const k in config.config) {
        visitorConfig[k] = config.config[k];
      }
    }
    if (generatorConfig.config) {
      for (const k in generatorConfig.config) {
        visitorConfig[k] = generatorConfig.config[k];
      }
    }
    visitorConfig["$filename"] = file;

    const url = makeRelativeUrl(generatorConfig.module);
    log.debug(
      `Generating source for '${file}' with generator from ${url} with config\n${
        JSON.stringify(
          visitorConfig,
          null,
          2,
        )
      }`,
    );
    const generator = await import(url.toString());
    const writer = new model.Writer();
    const visitor = (generatorConfig.visitorClass
      ? new generator[generatorConfig.visitorClass](writer)
      : new generator.default(writer)) as model.Visitor;
    const context = new model.Context(visitorConfig, doc);

    if (visitor.writeHead) {
      visitor.writeHead(context);
    }

    context.accept(context, visitor);

    // Appends optional visitor output
    for (const v of generatorConfig.append || []) {
      const url = makeRelativeUrl(v.module);
      log.debug(`Appending source from ${url}`);
      const generator = await import(url.toString());
      const visitor = (v.visitorClass
        ? new generator[v.visitorClass](writer)
        : new generator.default(writer)) as model.Visitor;
      context.accept(context, visitor);
    }

    if (visitor.writeTail) {
      visitor.writeTail(context);
    }

    const imports = visitor.renderImports ? visitor.renderImports(context) : "";
    const content = writer.string().replace("[[IMPORTS SECTION]]", imports);

    output.push({
      path: file,
      contents: new TextEncoder().encode(content),
      executable: generatorConfig.executable || false,
      runAfter: generatorConfig.runAfter,
    });
  }

  return output;
}

export async function processPlugin(
  doc: ast.Document,
  config: Configuration,
): Promise<Configuration> {
  // make a copy of our original config to protect against mutation
  const originalConfig = JSON.parse(JSON.stringify(config)) as Configuration;

  for (const file of config.plugins || []) {
    const url = makeRelativeUrl(file);

    log.debug(`Generating configuration with plugin from ${url}`);

    const plugin = await import(url.toString());
    const generatedConfig = plugin.default(doc, config);
    // Update the generated config with values manually entered by the user
    config = mergeConfigurations(originalConfig, generatedConfig);
  }

  return config;
}

export async function processTemplateArgs(
  args: ProcessTemplateArgs,
): Promise<FSStructure | undefined> {
  const temp = await importTemplate(args.module);
  if (!temp.process) {
    return undefined;
  }

  return await temp.process(args.variables);
}

export async function importTemplate(
  module: string,
): Promise<Template> {
  const url = makeRelativeUrl(module);

  log.debug(`Importing template from ${url}`);

  const imported = await import(url.toString());
  return imported.default;
}
