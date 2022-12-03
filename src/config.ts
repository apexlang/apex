import * as apex from "https://raw.githubusercontent.com/apexlang/apex-js/deno-wip/src/index.ts";
import * as model from "https://raw.githubusercontent.com/apexlang/apex-js/deno-wip/src/model/index.ts";
import * as log from "https://deno.land/std@0.167.0/log/mod.ts";

import * as path from "https://deno.land/std@0.167.0/path/mod.ts";

export interface Configuration {
  spec: string;
  generates: Record<string, DestinationConfiguration>;
}

export interface DestinationConfiguration {
  module: string;
  visitorClass?: string;
}

export interface Output {
  file: string;
  generated: string;
}

export async function process(config: Configuration): Promise<Output[]> {
  const apexSource = await Deno.readTextFile(config.spec);
  const doc = apex.parse(apexSource);

  const output: Output[] = [];
  for (const file in config.generates) {
    const generatorConfig = config.generates[file];
    let url;
    if (
      generatorConfig.module.startsWith(".") ||
      generatorConfig.module.startsWith("/")
    ) {
      url = new URL("file:///" + path.join(Deno.cwd(), generatorConfig.module));
    } else {
      url = new URL(generatorConfig.module);
    }

    log.debug(`Generating source for '${file}' with generator from ${url}`);

    const generator = await import(url.toString());
    const writer = new model.Writer();
    let visitor;
    if (generatorConfig.visitorClass) {
      visitor = new generator[generatorConfig.visitorClass](writer);
    } else {
      visitor = new generator.default(writer);
    }
    const context = new model.Context({}, doc);
    context.accept(context, visitor);
    output.push({ file, generated: writer.string() });
  }
  return output;
}
