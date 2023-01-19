import * as path from "https://deno.land/std@0.171.0/path/mod.ts";
import * as yaml from "https://deno.land/std@0.171.0/encoding/yaml.ts";

import { Command } from "https://deno.land/x/cliffy@v0.25.5/command/mod.ts";
import { getInstallDirectories } from "../utils.ts";
import { installTemplate } from "../install.ts";
import { TemplateMap, TemplateRegistry } from "../config.ts";

export const command = new Command()
  .arguments("<location:string>")
  .description("Install templates locally.")
  .action(async (_options, location: string) => {
    const updates: TemplateMap = {};
    await installTemplate(updates, location);

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
