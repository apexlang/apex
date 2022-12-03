import { Command } from "https://deno.land/x/cliffy@v0.25.5/command/mod.ts";
import * as yaml from "https://deno.land/std@0.167.0/encoding/yaml.ts";
import * as streams from "https://deno.land/std@0.167.0/streams/read_all.ts";

import { Configuration } from "../config.ts";
import { process, writeOutput } from "../process.ts";

export const command = new Command()
  .arguments("[...configuration:string[]]")
  .description("Run apex generators from a given configuration.")
  .action(async (_options: unknown, configFiles: string[]) => {
    configFiles = configFiles || [];
    if (!configFiles.length) {
      configFiles = ["apex.yaml"];
    }
    await fromFiles(...configFiles);
  });

export async function fromFiles(...configFiles: string[]) {
  for (const configFile of configFiles) {
    const configContents = await Deno.readTextFile(configFile);
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
    .map((v) => yaml.parse(v) as Configuration)
    .map(async (v) => await process(v))
    .flatMap((v) => v);

  const outputs = (await Promise.all(configs)).flatMap((v) => v);

  outputs.forEach(async (generated) => await writeOutput(generated));
}
