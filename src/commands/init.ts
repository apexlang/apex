import { Command } from "../deps/cliffy.ts";

import { Variables } from "../config.ts";
import {
  initializeProjectFromGit,
  initializeProjectFromTemplate,
} from "../init.ts";
import { templateCompletion, varOptions } from "./utils.ts";
import * as log from "@std/log";

export const command = new Command()
  .complete("template", async () => await templateCompletion())
  .arguments("<template:string>")
  .option(
    "-r, --reload",
    "ignore cache and reload sources",
  )
  .option("-v, --var <item:string>", "define a template variable", varOptions)
  .option(
    "-p, --path <string>",
    "specify a relative path to the template root",
    { default: "" },
  )
  .option(
    "-b, --branch <string>",
    "checkout branch before processing template",
  )
  .option(
    "-s, --spec <string>",
    "apex specification to use for the project",
  )
  .description("Initialize a project using a template.")
  // deno-lint-ignore no-explicit-any
  .action(async (options: any, template: string) => {
    options ||= {
      path: "",
    };
    const vars = options.var || ({} as Variables);
    try {
      await initializeProjectFromTemplate(
        false,
        ".",
        template,
        options,
        options.spec,
        vars || {},
      );
    } catch (e) {
      log.debug(
        `Could not initialize project from programmatic template: ${e}`,
      );
      log.debug(`Falling back to git`);
      await initializeProjectFromGit(
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
    }
  });
