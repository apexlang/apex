import { Command } from "../deps/cliffy.ts";
import * as log from "https://deno.land/std@0.171.0/log/mod.ts";
import { fromConfigs } from "./generate.ts";
import * as ui from "../ui.ts";

import { Configuration, findConfigFile, parseConfigYaml } from "../config.ts";
import { ProcessOptions, processPlugins } from "../process.ts";
import { flatten } from "../utils.ts";
import { CmdOutput, Task } from "../task.ts";

export interface RunOptions {
  config?: string;
  quiet?: boolean;
  failUndefined?: boolean;
  list?: boolean;
  reload?: boolean;
}

export const command = new Command()
  .arguments("[...tasks]")
  .option(
    "-c, --config <string>",
    "specify an Apex configuration",
    { default: "apex.yaml" },
  )
  .option(
    "-q, --quiet",
    "silence extraneous apex output",
  )
  .option(
    "-l, --list",
    "list tasks",
  )
  .option(
    "--fail-undefined",
    "when there are multiple configurations, force the command to fail if a task is not defined",
  )
  .description("Run tasks.")
  .action(action);

export async function action(
  options: RunOptions,
  ...tasks: string[]
) {
  options ||= {};
  const config = await findConfigFile(options.config);
  const configs = parseConfigYaml(config);
  for (const cfg of configs) {
    const taskMap = await loadTasks(cfg, options);
    if (options.list) {
      ui.objToTable(taskMap, ["description"]);
      continue;
    }
    await runTasks(
      cfg,
      taskMap,
      tasks,
      configs.length == 1 || options.failUndefined == true,
      options,
    );
  }
}

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
  options: ProcessOptions,
): Promise<Record<string, Task>> {
  config = await processPlugins(config, options);
  return parseTasks(config);
}

export async function runTasks(
  config: Configuration,
  taskMap: Record<string, Task>,
  tasks: string[] = [],
  taskNotFoundError = true,
  opts: RunOptions = {},
): Promise<Record<string, CmdOutput> | undefined> {
  if (tasks.length === 0) {
    const defaultTask = Object.keys(taskMap).shift();
    tasks = defaultTask ? [defaultTask] : [];
  }

  if (taskNotFoundError && !tasks.length) {
    log.error(`no tasks defined`);
    return;
  }

  const hasRun = new Set<string>();

  for (const t of tasks) {
    await run(config, hasRun, taskMap, t, taskNotFoundError, opts);
  }
}

async function run(
  config: Configuration,
  hasRun: Set<string>,
  taskMap: Record<string, Task>,
  task: string,
  taskNotFoundError = true,
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
      await fromConfigs([config], opts);
      return;
    }

    if (taskNotFoundError) {
      throw new Error(`task not defined: "${task}"`);
    } else {
      return;
    }
  }

  for (const d of t.deps) {
    await run(config, hasRun, taskMap, d, taskNotFoundError, opts);
  }

  const env = {
    apex_spec: config.spec,
  };
  Object.assign(env, flatten("apex_config", config.config));

  await t.run({ quiet: opts.quiet, env });
}
