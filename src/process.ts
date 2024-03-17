// deno-lint-ignore-file no-explicit-any
import * as log from "@std/log";
import * as path from "@std/path";

const __dirname = new URL(".", import.meta.url).pathname;

import {
  Configuration,
  FSStructure,
  Output,
  Template,
  Variables,
} from "./config.ts";
import { cliFormatters, sourceFormatters } from "./formatters.ts";
import { asBytes, asString } from "./utils.ts";

export interface ProcessOptions {
  reload?: boolean;
  scaffold?: boolean;
}

export async function processPlugins(
  config: Configuration,
  options: ProcessOptions,
): Promise<Configuration> {
  return await runWorker<Configuration>(
    path.join(__dirname, "run_plugins.ts"),
    {
      config,
      options,
    },
  );
}

export async function processConfiguration(
  config: Configuration,
  options: ProcessOptions,
): Promise<Output[]> {
  return await runWorker<Output[]>(
    path.join(__dirname, "run_config.ts"),
    {
      config,
      options,
    },
  );
}

export async function writeOutput(generated: Output): Promise<void> {
  let source = generated.contents;
  const ext = path.extname(generated.path).substring(1).toLowerCase();

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
      await command.output();
    });
  }
}

export async function getTemplateInfo(
  module: string,
): Promise<Template> {
  return await runWorker<Template>(
    path.join(__dirname, "run_template_info.ts"),
    module,
  );
}

export async function processTemplate(
  module: string,
  variables: Variables,
): Promise<FSStructure> {
  return await runWorker<FSStructure>(
    path.join(__dirname, "run_process_template.ts"),
    {
      module,
      variables,
    },
  );
}

function runWorker<O>(
  url: string,
  input: any,
): Promise<O> {
  log.debug(`Input is: ${JSON.stringify(input, null, 2)}`);

  // Run the generation process with restricted permissions.
  const href = new URL(url, import.meta.url).href;

  const w = new Worker(href, {
    type: "module",
    deno: {
      permissions: {
        read: true,
        import: true,
      },
    },
  });

  interface ErrorWrapper {
    error?: Error;
  }

  return new Promise((resolve, reject) => {
    w.onmessage = (e: MessageEvent<O | ErrorWrapper>) => {
      w.terminate();
      const ew = e.data as ErrorWrapper;
      if (ew != null && ew.error) {
        reject(ew.error);
      } else {
        resolve(e.data as O);
      }
    };
    w.onerror = (e) => {
      w.terminate();
      reject(e);
    };

    w.postMessage(input);
  });
}
