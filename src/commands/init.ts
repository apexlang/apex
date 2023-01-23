import { Command } from "../deps/cliffy.ts";

import { Variables } from "../config.ts";
import {
  initializeProjectFromGithub,
  initializeProjectFromTemplate,
} from "../init.ts";
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
  .option(
    "-s, --spec <string>",
    "apex specification to use for the project",
  )
  .description("Initialize a project using a template.")
  .action(async (options, template: string) => {
    const vars = (options || {}).var || ({} as Variables);
    if (
      template.startsWith("https://github.com") &&
      !template.endsWith(".ts")
    ) {
      await initializeProjectFromGithub(
        ".",
        template,
        vars || {},
        {
          isNew: false,
          path: options.path,
          branch: options.branch,
          spec: options.spec,
        },
      );
    } else {
      await initializeProjectFromTemplate(
        false,
        ".",
        template,
        options.spec,
        vars || {},
      );
    }
  });
