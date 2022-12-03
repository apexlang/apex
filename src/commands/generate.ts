import { Command } from "https://deno.land/x/cliffy@v0.25.4/command/mod.ts";
import { load } from "https://deno.land/x/js_yaml_port@3.14.0/js-yaml.js";
import * as log from "https://deno.land/std@0.167.0/log/mod.ts";

import { process } from "../config.ts";
import { Configuration } from "../config.ts";

export const command = new Command()
  .arguments("<configuration:string>")
  .description("Run apex generators from a given configuration.")
  .action(async (_options, configFile: string) => {
    const text = await Deno.readTextFile(configFile);

    // TODO: need to validate yaml for a TS interface rather than assume it's OK.
    const config: Configuration = load(text);

    const output = await process(config);
    for (const generated of output) {
      log.info(`Writing file ${generated.file}`);
      await Deno.writeTextFile(generated.file, generated.generated);
    }
  });
