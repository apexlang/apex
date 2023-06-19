import * as apex from "https://deno.land/x/apex_core@v0.1.3/mod.ts";
import * as model from "https://deno.land/x/apex_core@v0.1.3/model/mod.ts";
import * as log from "https://deno.land/std@0.192.0/log/mod.ts";
import * as streams from "https://deno.land/std@0.192.0/streams/read_all.ts";
import * as base64 from "https://deno.land/std@0.192.0/encoding/base64.ts";

import {
  Config,
  Configuration,
  Output,
  Template,
  TemplateConfig,
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
  doc: apex.ast.Document,
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

export async function importTemplate(
  module: string,
): Promise<Template> {
  const url = makeRelativeUrl(module);

  log.debug(`Importing template from ${url}`);

  const template = await import(url.toString());
  return template.default as TemplateConfig;
}

// Detect piped input
if (!Deno.isatty(Deno.stdin.rid) && import.meta.main) {
  const stdinContent = await streams.readAll(Deno.stdin);
  const content = new TextDecoder().decode(stdinContent);
  const scaffold = Deno.args.indexOf("--scaffold") != -1;
  try {
    const config = JSON.parse(content) as Configuration;
    console.log(
      JSON.stringify(
        await processConfig(config, scaffold),
        (_, v) => v instanceof Uint8Array ? base64.encode(v) : v,
      ),
    );
  } catch (e) {
    console.error(e);
    throw e;
  }
}
