import { Command } from "../deps/cliffy.ts";
import * as yaml from "@std/yaml";
import * as log from "@std/log";
import * as path from "@std/path";

import type { Configuration } from "../config.ts";
import {
  processConfiguration,
  type ProcessOptions,
  writeOutput,
} from "../process.ts";

export const command = new Command()
  .arguments("[...configuration:string[]]")
  .description(
    "Watch configuration for changes and trigger code generation.",
  )
  .option(
    "-r, --reload",
    "ignore cache and reload sources",
  )
  // deno-lint-ignore no-explicit-any
  .action(async (options: any, configFiles: string[]) => {
    configFiles = configFiles || [];
    if (!configFiles.length) {
      configFiles = ["apex.yaml"];
    }
    await watch(configFiles, options || {});
  });

interface ConfigLocation {
  config: Configuration;
  dir: string;
  path: string;
}

async function watch(configurations: string[], options: ProcessOptions) {
  let configMap: { [file: string]: Configuration[] } = {};
  let specMap: { [file: string]: Configuration[] } = {};

  // Track recently modified files
  // and prevent processing duplicate FS events.
  const smoothEvents = new Set<string>();

  const doWatch = async (watcher: Deno.FsWatcher) => {
    try {
      for await (const event of watcher) {
        if (event.kind !== "modify") {
          continue;
        }

        for (const eventPath of event.paths) {
          const p = path.resolve(eventPath);
          if (smoothEvents.has(p)) {
            continue;
          }
          smoothEvents.add(p);
          setTimeout(() => smoothEvents.delete(p), 500);

          let confs = specMap[p];
          if (confs) {
            await processAndWrite(confs, options);
          }

          confs = configMap[p];
          if (confs) {
            watcher.close();
            await reloadConfigurations();
            await processAndWrite(confs, options);
            return;
          }
        }
      }
    } catch (e) {
      if (!(e instanceof Deno.errors.BadResource)) {
        throw e;
      }
    }
  };

  const reloadConfigurations = async () => {
    for (const configFile of configurations) {
      const p = path.resolve(configFile);
      const dir = path.dirname(configFile);
      const contents = await Deno.readTextFileSync(p);
      const configsNew: ConfigLocation[] = [];
      contents
        .split("---")
        .map((c) => yaml.parse(c) as Configuration)
        .forEach((c) =>
          configsNew.push({
            config: c,
            dir: dir,
            path: p,
          })
        );

      const watchPaths = new Set<string>();

      const configMapNew: { [file: string]: Configuration[] } = {};
      const specMapNew: { [file: string]: Configuration[] } = {};
      configsNew.forEach((c) => {
        watchPaths.add(c.path);

        const confs1 = configMapNew[c.path] || [];
        confs1.push(c.config);
        configMapNew[c.path] = confs1;

        if (c.config.spec) {
          const specPath = path.resolve(c.config.spec);
          watchPaths.add(specPath);
          const confs = specMapNew[specPath] || [];
          confs.push(c.config);
          specMapNew[specPath] = confs;
        }
      });

      configMap = configMapNew;
      specMap = specMapNew;

      const filesToWatch = Array.from(watchPaths);
      const watcher = Deno.watchFs(filesToWatch);
      doWatch(watcher);
    }
  };

  await reloadConfigurations();

  console.log("Watching for file changes. Press CTRL-C to interrupt.");
  await new Promise<void>((_resolve, _reject) => {
    Deno.addSignalListener("SIGINT", () => {
      console.log("interrupted!");
      Deno.exit();
    });
  });
}

async function processAndWrite(
  confs: Configuration[],
  options: ProcessOptions,
) {
  for (const conf of confs) {
    try {
      const outputs = await processConfiguration(conf, options);
      for (const output of outputs) {
        await writeOutput(output);
      }
    } catch (e) {
      log.error(e);
    }
  }
}
