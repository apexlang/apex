import { Command } from "https://deno.land/x/cliffy@v0.25.5/command/mod.ts";

import { Variables } from "../config.ts";
import { initializeProject } from "../init.ts";
import { templateCompletion, varOptions } from "./utils.ts";

export const command = new Command()
  .complete("template", async () => await templateCompletion())
  .arguments("<template:string>")
  .option("-v, --var <item:string>", "define a template variable", varOptions)
  .option(
    "-p, --path <string>",
    "specify a relative path to the template root",
    { default: "" },
  )
  .option(
    "-b, --branch <string>",
    "checkout branch before processing template",
    { default: "main" },
  )
  .description("Initialize a project using a template.")
  .action(async (options, template: string) => {
    const vars = (options || {}).var || ({} as Variables);
    const subdir = (options || {}).path;
    const branch = (options || {}).branch;
    await initializeProject(
      false,
      ".",
      template,
      subdir,
      branch,
      undefined,
      vars || {},
    );
  });
