import { Command } from "https://deno.land/x/cliffy@v0.25.5/command/mod.ts";
import * as yaml from "https://deno.land/std@0.171.0/encoding/yaml.ts";
import * as streams from "https://deno.land/std@0.171.0/streams/read_all.ts";
import * as log from "https://deno.land/std@0.171.0/log/mod.ts";

import { Configuration, Output } from "../config.ts";
import { processConfiguration, writeOutput } from "../process.ts";

export const command = new Command()
  .arguments("[...configuration:string[]]")
  .description("Run apex generators from a given configuration.")
  .action(async (_options: unknown, configFiles: string[]) => {
    configFiles ||= [];
    if (!configFiles.length) {
      configFiles = ["apex.yaml"];
    }
    await fromFiles(...configFiles);
  });

export async function fromFiles(...configFiles: string[]) {
  for (const configFile of configFiles) {
    let configContents = "";
    try {
      configContents = await Deno.readTextFile(configFile);
    } catch (e) {
      log.error(`Could not read config ${configFile}`);
      throw e;
    }
    await fromConfig(configContents);
  }
}

export async function fromStdin() {
  const stdinContent = await streams.readAll(Deno.stdin);
  const content = new TextDecoder().decode(stdinContent);
  await fromConfig(content);
}

export async function fromConfig(configContents: string) {
  // TODO: need to validate yaml for a TS interface rather than assume it's OK.
  const configs = configContents
    .split("---")
    .map((v) => v.trim())
    .map((v) => yaml.parse(v) as Configuration);

  const outputs: Output[] = [];
  for (const config of configs) {
    const o = await processConfiguration(config);
    outputs.push(...o);
  }

  for (const generated of outputs) {
    await writeOutput(generated);
  }
}
