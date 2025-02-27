import { Command } from "../../deps/@cliffy/command/mod.ts";
import * as log from "../../deps/@std/log/mod.ts";
import { fromConfigs } from "./generate.ts";
import * as ui from "../ui.ts";

import {
  type Configuration,
  findConfigFile,
  parseConfigYaml,
} from "../config.ts";
import { type ProcessOptions, processPlugins } from "../process.ts";
import { flatten, mergeConfigurations } from "../utils.ts";
import { type CmdOutput, Task } from "../task.ts";

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
      return;
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

  for (const key of Object.keys(config.tasks)) {
    const def = config.tasks[key];
    taskMap[key] = new Task(def);
  }

  return taskMap;
}

export async function loadTasks(
  config: Configuration,
  options: ProcessOptions,
): Promise<Record<string, Task>> {
  const generatedConfig = await processPlugins(config, options);
  const updatedConfig = mergeConfigurations(config, generatedConfig);
  const generatedTasks = parseTasks(updatedConfig);
  return generatedTasks;
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
    apex_spec: config.spec || "",
  };
  Object.assign(env, flatten("apex_config", config.config));

  await t.run({ quiet: opts.quiet, env });
}
