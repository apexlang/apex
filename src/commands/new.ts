import { Command } from "../deps/cliffy.ts";

import type { Variables } from "../config.ts";
import {
  initializeProjectFromGit,
  initializeProjectFromTemplate,
} from "../init.ts";
import { templateCompletion, varOptions } from "./utils.ts";
import * as log from "@std/log";

export const command = new Command()
  .complete("template", async () => await templateCompletion())
  .arguments("<template:string> <dir:string>")
  .option("-v, --var <item:string>", "define a template variable", varOptions)
  .option(
    "-g, --from-git",
    "use the project template from git",
  )
  .option(
    "-r, --reload",
    "ignore cache and reload sources",
  )
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
  .description("Create a new project directory using a template.")
  // deno-lint-ignore no-explicit-any
  .action(async (options: any, template: string, dir: string) => {
    options ||= {
      path: "",
    };
    const vars = options.var || ({} as Variables);
    try {
      if (options.fromGit) {
        await initializeProjectFromGit(
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
          options,
          options.spec,
          vars || {},
        );
      }
    } catch (e) {
      log.error(
        `Could not initialize project from programmatic template: ${e}`,
      );
    }
  });
