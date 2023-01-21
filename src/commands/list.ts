import { Command } from "../deps/cliffy.ts";
import { action as runAction } from "./run.ts";

import { templateList } from "../utils.ts";
import * as ui from "../ui.ts";

export const templates = new Command()
  .description("List installed templates.")
  .action(async (_options) => {
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
  .action(async (options) => {
    await runAction({ list: true, config: options.config }, "");
  });

export const command = new Command()
  .description("List available resources.")
  .default("help")
  .command("templates", templates)
  .command("tasks", tasks);
