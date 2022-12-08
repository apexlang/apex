import { Command } from "https://deno.land/x/cliffy@v0.25.5/command/mod.ts";

import { Variables } from "../config.ts";
import { initializeProject } from "../init.ts";
import { templateCompletion, varOptions } from "./utils.ts";

export const command = new Command()
  .complete("template", async () => await templateCompletion())
  .arguments("<template:string> <dir:string>")
  .option("-v, --var <item:string>", "define a template variable", varOptions)
  .description("Create a new project directory using a template.")
  .action(async (options, template: string, dir: string) => {
    const vars = (options || {}).var || ({} as Variables);
    await initializeProject(true, dir, template, undefined, vars || {});
  });
