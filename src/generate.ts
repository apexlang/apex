import * as apex from "https://raw.githubusercontent.com/apexlang/apex-js/deno-wip/src/index.ts";
import * as model from "https://raw.githubusercontent.com/apexlang/apex-js/deno-wip/src/model/index.ts";
import * as log from "https://deno.land/std@0.167.0/log/mod.ts";
import * as path from "https://deno.land/std@0.167.0/path/mod.ts";
import * as streams from "https://deno.land/std@0.167.0/streams/read_all.ts";

import { Config, Configuration, Output } from "./config.ts";
import { existsSync } from "./utils.ts";

async function processConfig(config: Configuration): Promise<Output[]> {
  const apexSource = await Deno.readTextFile(config.spec);
  // TODO: implement resolver callback
  const doc = apex.parse(apexSource);

  const output: Output[] = [];
  for (const file in config.generates) {
    const generatorConfig = config.generates[file];

    if (generatorConfig.ifNotExists == true && existsSync(file)) {
      // TODO: denote skipped files.
      //log.info(`Skipping ${file}`);
      continue;
    }

    const url =
      generatorConfig.module.startsWith(".") ||
      generatorConfig.module.startsWith("/")
        ? new URL("file:///" + path.join(Deno.cwd(), generatorConfig.module))
        : new URL(generatorConfig.module);

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

    log.debug(
      `Generating source for '${file}' with generator from ${url} with config\n${JSON.stringify(
        visitorConfig,
        null,
        2
      )}`
    );

    const generator = await import(url.toString());
    const writer = new model.Writer();
    const visitor = generatorConfig.visitorClass
      ? new generator[generatorConfig.visitorClass](writer)
      : new generator.default(writer);
    const context = new model.Context(visitorConfig, doc);
    context.accept(context, visitor);
    output.push({
      file,
      source: writer.string(),
      executable: generatorConfig.executable || false,
      runAfter: generatorConfig.runAfter,
    });
  }

  return output;
}

// Detect piped input
if (!Deno.isatty(Deno.stdin.rid) && import.meta.main) {
  const stdinContent = await streams.readAll(Deno.stdin);
  const content = new TextDecoder().decode(stdinContent);
  try {
    const config = JSON.parse(content) as Configuration;
    console.log(JSON.stringify(await processConfig(config)));
  } catch (e) {
    console.error(e);
    throw e;
  }
}
