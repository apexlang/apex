import * as path from "../../deps/@std/path/mod.ts";
import * as yaml from "../../deps/@std/yaml/mod.ts";

import { Command } from "../../deps/@cliffy/command/mod.ts";
import { getInstallDirectories } from "../utils.ts";
import { installTemplate } from "../install.ts";
import { TemplateMap, TemplateRegistry } from "../config.ts";

export const command = new Command()
  .arguments("<location:string>")
  .description("Install templates locally.")
  .option(
    "-r, --reload",
    "ignore cache and reload sources",
  )
  // deno-lint-ignore no-explicit-any
  .action(async (options: any, location: string) => {
    const updates: TemplateMap = {};
    await installTemplate(updates, location, options || {});

    if (Object.keys(updates).length == 0) {
      return;
    }

    let allTemplates: TemplateRegistry = {
      templates: {},
    };
    const dirs = await getInstallDirectories();
    const templateRegistry = path.join(dirs.home, "templates.yaml");
    try {
      const templateListYAML = Deno.readTextFileSync(templateRegistry);
      allTemplates = yaml.parse(templateListYAML) as TemplateRegistry;
    } catch (_e) {
      // Ignore
    }

    for (const name of Object.keys(updates)) {
      allTemplates.templates[name] = updates[name];
    }

    const toSave = yaml.stringify(
      allTemplates as unknown as Record<string, unknown>,
    );
    Deno.writeTextFileSync(templateRegistry, toSave);
  });
