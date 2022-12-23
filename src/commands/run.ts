import { Command } from "https://deno.land/x/cliffy@v0.25.5/command/mod.ts";
import * as yaml from "https://deno.land/std@0.171.0/encoding/yaml.ts";
import * as log from "https://deno.land/std@0.171.0/log/mod.ts";
import { fromFiles } from "./generate.ts";

import { build$, CommandBuilder } from "https://deno.land/x/dax@0.24.1/mod.ts";
import { Configuration } from "../config.ts";
import { processPlugins } from "../process.ts";

interface Task {
  dependsOn: string[];
  commands: string[];
}

export const command = new Command()
  .arguments("[...tasks:string[]]")
  .option(
    "-c, --config <string>",
    "specify an Apex configuration",
    { default: "apex.yaml" },
  )
  .description("Run tasks.")
  .action(async (options, tasks: string[]) => {
    const configFile = options.config || "apex.yaml";
    const taskMap = await loadTasks(configFile);
    await runTasks(configFile, taskMap, tasks);
  });

export async function loadTasks(
  configFile: string,
): Promise<Record<string, Task>> {
  let configContents = "";
  try {
    configContents = await Deno.readTextFile(configFile);
  } catch (_e) {
    log.error(`Could not read config ${configFile}`);
    return {};
  }

  let tasksConfig = yaml.parse(configContents) as Configuration;
  tasksConfig = await processPlugins(tasksConfig);

  tasksConfig.tasks ||= {};
  const taskMap: Record<string, Task> = {};
  let firstTask: string | undefined;

  for (const key of Object.keys(tasksConfig.tasks)) {
    const commands = tasksConfig.tasks[key] || [];
    let dependsOn: string[] = [];
    let taskName = key;
    const idx = taskName.indexOf(">");
    if (idx != -1) {
      const d = taskName.substring(idx + 1).trim();
      taskName = taskName.substring(0, idx).trim();
      if (d.length > 0) {
        dependsOn = d.split(" ").map((v) => v.trim());
      }
    }

    if (firstTask == undefined) {
      firstTask = taskName;
    }

    taskMap[taskName] = {
      dependsOn,
      commands,
    };
  }

  return taskMap;
}

export async function runTasks(
  configFile: string,
  taskMap: Record<string, Task>,
  tasks: string[],
) {
  tasks ||= [];
  if (!tasks.length) {
    for (const first of Object.keys(taskMap)) {
      tasks = [first];
      break;
    }
  }
  if (!tasks.length) {
    log.error(`no tasks defined`);
    return;
  }

  const hasRun = new Set<string>();

  for (const t of tasks) {
    await run(configFile, hasRun, taskMap, t);
  }
}

async function run(
  configFile: string,
  hasRun: Set<string>,
  taskMap: Record<string, Task>,
  task: string,
): Promise<void> {
  if (hasRun.has(task)) {
    return Promise.resolve();
  }

  hasRun.add(task);

  const t = taskMap[task];
  if (!t) {
    if (task == "generate") {
      console.log("%capex generate", "font-weight: bold");
      await fromFiles(configFile);
      return;
    }

    throw new Error(`task not defined: "${task}"`);
  }

  for (const d of t.dependsOn) {
    await run(configFile, hasRun, taskMap, d);
  }

  const commandBuilder = new CommandBuilder().noThrow();
  const $ = build$({ commandBuilder });

  for (let c of t.commands) {
    c = c.trim();
    console.log(`%c${c}`, "font-weight: bold");

    const joined = c
      .split("\n")
      .map((v) => v.trim())
      .join(" ");

    const result = await $.raw`${joined}`;
    if (result.code != 0) {
      throw new Error(`Aborted with exit code: ${result.code}`);
    }
  }
}
