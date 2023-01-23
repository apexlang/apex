import { Command } from "../deps/cliffy.ts";

import { Variables } from "../config.ts";
import {
  initializeProjectFromGithub,
  initializeProjectFromTemplate,
} from "../init.ts";
import { templateCompletion, varOptions } from "./utils.ts";

export const command = new Command()
  .complete("template", async () => await templateCompletion())
  .arguments("<template:string> <dir:string>")
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
  .option(
    "-s, --spec <string>",
    "apex specification to use for the project",
  )
  .description("Create a new project directory using a template.")
  .action(async (options, template: string, dir: string) => {
    const vars = (options || {}).var || ({} as Variables);
    if (
      template.startsWith("https://github.com") &&
      !template.endsWith(".ts")
    ) {
      await initializeProjectFromGithub(
        dir,
        template,
        vars || {},
        {
          isNew: true,
          path: options.path,
          branch: options.branch,
          spec: options.spec,
        },
      );
    } else {
      await initializeProjectFromTemplate(
        true,
        dir,
        template,
        options.spec,
        vars || {},
      );
    }
  });
