import * as log from "https://deno.land/std@0.167.0/log/mod.ts";
import * as path from "https://deno.land/std@0.167.0/path/mod.ts";
import { fileExtension } from "https://deno.land/x/file_extension@v2.1.0/mod.ts";

import {
  Assets,
  Configuration,
  FSStructure,
  Output,
  ProcessTemplateArgs,
  Template,
  Variables,
} from "./config.ts";
import { cliFormatters, sourceFormatters } from "./formatters.ts";

export async function processConfiguration(
  config: Configuration,
): Promise<Output[]> {
  return await process<Configuration, Output[]>("./run_config.ts", config);
}

export async function writeOutput(generated: Output): Promise<void> {
  let source = generated.source;
  const ext = fileExtension(generated.file).toLowerCase();

  // Source formatting
  const sourceFormatter = sourceFormatters[ext];
  if (sourceFormatter) {
    source = await sourceFormatter(source);
  }

  log.info(`Writing file ${generated.file}`);
  const dir = path.dirname(generated.file);
  await Deno.mkdir(dir, { recursive: true });
  await Deno.writeTextFile(generated.file, source, {
    mode: generated.executable ? 0o777 : 0o666,
  });

  // CLI formatting
  const cliFormatter = cliFormatters[ext];
  if (cliFormatter) {
    log.info(`Formatting file ${generated.file}`);
    cliFormatter(generated.file);
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
      log.info(`Running ${joined}`);
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
  return await process<string, Template>("./run_template_info.ts", module);
}

export async function processTemplate(
  module: string,
  variables: Variables,
): Promise<FSStructure> {
  return await process<ProcessTemplateArgs, FSStructure>(
    "./run_process_template.ts",
    {
      module,
      variables,
    },
  );
}

async function process<I, O>(
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
