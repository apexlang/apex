import { Command } from "../../deps/@cliffy/command/mod.ts";
import { action as runAction } from "./run.ts";

import { templateList } from "../utils.ts";
import * as ui from "../ui.ts";

export const templates = new Command()
  .description("List installed templates.")
  // deno-lint-ignore no-explicit-any
  .action(async (_options: any) => {
    const templates = await templateList();
    ui.objToTable(templates, ["version", "description"]);
  });

export const tasks = new Command()
  .description("List tasks.")
  .option(
    "-c, --config <string>",
    "specify an Apex configuration",
    { default: "apex.yaml" },
  )
  // deno-lint-ignore no-explicit-any
  .action(async (options: any) => {
    await runAction({ list: true, config: options.config }, "");
  });

export const command = new Command()
  .description("List available resources.")
  .default("help")
  .command("templates", templates)
  .command("tasks", tasks);
