import { Command } from "../deps/cliffy.ts";
import * as streams from "https://deno.land/std@0.192.0/streams/read_all.ts";
import * as log from "https://deno.land/std@0.192.0/log/mod.ts";

import { Configuration, Output, parseConfigYaml } from "../config.ts";
import {
  processConfiguration,
  ProcessOptions,
  writeOutput,
} from "../process.ts";

export const command = new Command()
  .arguments("[...configuration:string[]]")
  .description("Run Apexlang generators from a given configuration.")
  .option(
    "-s, --scaffold",
    "generate scaffolded files",
  )
  .option(
    "-r, --reload",
    "reload files from cache",
  )
  .action(async (options: ProcessOptions, configFiles: string[]) => {
    configFiles ||= [];
    if (!configFiles.length) {
      configFiles = ["apex.yaml"];
    }
    await fromFiles(configFiles, options || {});
  });

export async function fromFiles(
  configFiles: string[],
  options: ProcessOptions,
) {
  for (const configFile of configFiles) {
    let configContents = "";
    try {
      configContents = await Deno.readTextFile(configFile);
    } catch (e) {
      log.error(`Could not read config ${configFile}`);
      throw e;
    }
    const configs = parseConfigYaml(configContents);
    await fromConfigs(configs, options);
  }
}

export async function fromStdin(options: ProcessOptions = {}) {
  const stdinContent = await streams.readAll(Deno.stdin);
  const content = new TextDecoder().decode(stdinContent);
  const configs = parseConfigYaml(content);
  await fromConfigs(configs, options);
}

export async function fromConfigs(
  configs: Configuration[],
  options: ProcessOptions,
) {
  const outputs: Output[] = [];
  for (const config of configs) {
    const o = await processConfiguration(config, options);
    outputs.push(...o);
  }

  for (const generated of outputs) {
    await writeOutput(generated);
  }
}
