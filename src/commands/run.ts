import { Command } from "https://deno.land/x/cliffy@v0.25.5/command/mod.ts";
import * as log from "https://deno.land/std@0.171.0/log/mod.ts";
import { fromConfigs } from "./generate.ts";

import { Configuration, parseConfigYaml } from "../config.ts";
import { processPlugins } from "../process.ts";
import { findApexConfig, flatten } from "../utils.ts";
import { CmdOutput, Task } from "../task.ts";

export interface RunOptions {
  config?: string;
  quiet?: boolean;
}

export const command = new Command()
  .arguments("[...tasks:string[]]")
  .option(
    "-c, --config <string>",
    "specify an Apex configuration",
    { default: "apex.yaml" },
  )
  .option(
    "-q, --quiet",
    "silence extraneous apex output",
  )
  .description("Run tasks.")
  .action(async (options: RunOptions, tasks: string[]) => {
    const configFile = options.config || "apex.yaml";
    const configPath = findApexConfig(configFile);
    if (!configPath) {
      console.log("could not find configuration");
      Deno.exit(1);
    }
    let config;
    try {
      config = await Deno.readTextFile(configPath);
    } catch (_e) {
      log.error(`Could not read config ${configPath}`);
      return {};
    }
    const configs = parseConfigYaml(config);
    for (const cfg of configs) {
      const taskMap = await loadTasks(cfg);
      await runTasks(cfg, taskMap, tasks, options);
    }
  });

export function parseTasks(
  config: Configuration,
): Record<string, Task> {
  config.tasks ||= {};
  const taskMap: Record<string, Task> = {};
  let firstTask: string | undefined;

  for (const key of Object.keys(config.tasks)) {
    let task;
    const def = config.tasks[key];
    if (Array.isArray(def)) {
      task = new Task({ cmds: def });
    } else {
      task = new Task(def);
    }

    let taskName = key;
    const idx = taskName.indexOf(">");
    if (idx != -1) {
      const d = taskName.substring(idx + 1).trim();
      taskName = taskName.substring(0, idx).trim();
      if (d.length > 0) {
        // prepend dependencies written in shorthand to the explicit deps.
        task.deps.unshift(...d.split(" ").map((v) => v.trim()));
      }
    }

    if (firstTask == undefined) {
      firstTask = taskName;
    }

    taskMap[taskName] = task;
  }

  return taskMap;
}

export async function loadTasks(
  config: Configuration,
): Promise<Record<string, Task>> {
  config = await processPlugins(config);

  return parseTasks(config);
}

export async function runTasks(
  config: Configuration,
  taskMap: Record<string, Task>,
  tasks: string[] = [],
  opts: RunOptions = {},
): Promise<Record<string, CmdOutput> | undefined> {
  if (tasks.length === 0) {
    const defaultTask = Object.keys(taskMap).shift();
    tasks = defaultTask ? [defaultTask] : [];
  }

  if (!tasks.length) {
    log.error(`no tasks defined`);
    return;
  }

  const hasRun = new Set<string>();

  for (const t of tasks) {
    await run(config, hasRun, taskMap, t, opts);
  }
}

async function run(
  config: Configuration,
  hasRun: Set<string>,
  taskMap: Record<string, Task>,
  task: string,
  opts: RunOptions = {},
): Promise<Record<string, CmdOutput> | undefined> {
  if (hasRun.has(task)) {
    return Promise.resolve(undefined);
  }

  hasRun.add(task);

  const t = taskMap[task];
  if (!t) {
    if (task == "generate") {
      console.log("%capex generate", "font-weight: bold");
      await fromConfigs([config]);
      return;
    }

    throw new Error(`task not defined: "${task}"`);
  }

  for (const d of t.deps) {
    await run(config, hasRun, taskMap, d, opts);
  }

  const env = {
    apex_spec: config.spec,
  };
  Object.assign(env, flatten("apex_config", config.config));

  await t.run({ quiet: opts.quiet, env });
}
