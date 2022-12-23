// deno-lint-ignore-file no-explicit-any
import * as log from "https://deno.land/std@0.171.0/log/mod.ts";
import * as path from "https://deno.land/std@0.171.0/path/mod.ts";
import { fileExtension } from "https://deno.land/x/file_extension@v2.1.0/mod.ts";
import * as base64 from "https://deno.land/std@0.171.0/encoding/base64.ts";

import {
  Configuration,
  FSStructure,
  JsonOutput,
  Output,
  ProcessTemplateArgs,
  Template,
  TemplateConfig,
  Variables,
} from "./config.ts";
import { cliFormatters, sourceFormatters } from "./formatters.ts";
import { asBytes, asString } from "./utils.ts";

export async function process(config: Configuration): Promise<Output[]> {
  log.debug(`Configuration is: ${JSON.stringify(config, null, 2)}`);

  // Run the generation process with restricted permissions.
  const href = new URL("./generate.ts", import.meta.url).href;
  const p = await Deno.run({
    cmd: [
      Deno.execPath(),
      "run",
      "--allow-read",
      "--allow-net=deno.land,raw.githubusercontent.com",
      href,
    ],
    stdout: "piped",
    stderr: "piped",
    stdin: "piped",
  });

  const input = JSON.stringify(config);
  await p.stdin.write(new TextEncoder().encode(input));
  p.stdin.close();

  // Reading the outputs and closes their pipes
  const rawOutput = await p.output();
  const rawError = await p.stderrOutput();

  const { code } = await p.status();
  p.close();

  if (code !== 0) {
    const errorString = new TextDecoder().decode(rawError);
    throw new Error(errorString);
  }

  const output = new TextDecoder().decode(rawOutput);
  log.debug(`Generator output: ${output}`);
  const fromJson = JSON.parse(output) as JsonOutput[];
  return fromJson.map((o: any) => {
    o.contents = base64.decode(o.contents);
    return o as Output;
  });
}

export async function processPlugins(
  config: Configuration,
): Promise<Configuration> {
  return await processGeneric<Configuration, Configuration>(
    "./run_plugins.ts",
    config,
  );
}

export async function processConfiguration(
  config: Configuration,
): Promise<Output[]> {
  const fromJson = await processGeneric<Configuration, JsonOutput[]>(
    "./run_config.ts",
    config,
  );
  return fromJson.map((o: any) => {
    o.contents = base64.decode(o.contents);
    return o as Output;
  });
}

export async function writeOutput(generated: Output): Promise<void> {
  let source = generated.contents;
  const ext = fileExtension(generated.path).toLowerCase();

  // Source formatting
  const sourceFormatter = sourceFormatters[ext];
  if (sourceFormatter) {
    source = asBytes(await sourceFormatter(asString(source)));
  }

  const mode = generated.mode || parseInt("644", 8);
  log.info(
    `Writing file ${generated.path} (mode:${mode.toString(8)})`,
  );
  const dir = path.dirname(generated.path);
  await Deno.mkdir(dir, { recursive: true });
  await Deno.writeFile(generated.path, source, {
    mode,
  });

  // CLI formatting
  const cliFormatter = cliFormatters[ext];
  if (cliFormatter) {
    log.info(`Formatting file ${generated.path}`);
    cliFormatter(generated.path);
  }

  // Execute additional tooling via "runAfter".
  if (generated.runAfter) {
    generated.runAfter.forEach(async (cmdConfig) => {
      const joined = cmdConfig.command
        .trim()
        .split("\n")
        .map((v) => v.trim())
        .join(" ");
      const args = joined.split(/\s+/);
      const cmd = args.shift()!;
      console.log(`%c${joined}`, "font-weight: bold");
      const command = new Deno.Command(cmd, {
        args: args,
        cwd: cmdConfig.dir,
      });
      const child = command.spawn();
      await child.status;
    });
  }
}

export async function getTemplateInfo(
  module: string,
): Promise<Template> {
  return await processGeneric<string, TemplateConfig>(
    "./run_template_info.ts",
    module,
  );
}

export async function processTemplate(
  module: string,
  variables: Variables,
): Promise<FSStructure> {
  return await processGeneric<ProcessTemplateArgs, FSStructure>(
    "./run_process_template.ts",
    {
      module,
      variables,
    },
  );
}

async function processGeneric<I, O>(
  url: string,
  config: I,
): Promise<O> {
  log.debug(`Input is: ${JSON.stringify(config, null, 2)}`);

  // Run the generation process with restricted permissions.
  const href = new URL(url, import.meta.url).href;
  const p = await Deno.run({
    cmd: [
      Deno.execPath(),
      "run",
      "--allow-read",
      "--allow-net=deno.land,raw.githubusercontent.com",
      href,
    ],
    stdout: "piped",
    stderr: "piped",
    stdin: "piped",
  });

  const input = JSON.stringify(config);
  await p.stdin.write(new TextEncoder().encode(input));
  p.stdin.close();

  // Reading the outputs and closes their pipes
  const rawOutput = await p.output();
  const rawError = await p.stderrOutput();

  const { code } = await p.status();
  p.close();

  if (code !== 0) {
    const errorString = new TextDecoder().decode(rawError);
    throw new Error(errorString);
  }

  const output = new TextDecoder().decode(rawOutput);
  log.debug(`Generator output: ${output}`);
  return JSON.parse(output) as O;
}
