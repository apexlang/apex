import * as path from "https://deno.land/std@0.167.0/path/mod.ts";
import * as fs from "https://deno.land/std@0.167.0/fs/mod.ts";
import * as yaml from "https://deno.land/std@0.167.0/encoding/yaml.ts";
import { fileExtension } from "https://deno.land/x/file_extension@v2.1.0/mod.ts";
import {
  Confirm,
  ConfirmOptions,
  Input,
  InputOptions,
  Number,
  NumberOptions,
} from "https://deno.land/x/cliffy@v0.25.5/prompt/mod.ts";
import * as log from "https://deno.land/std@0.167.0/log/mod.ts";

import { Template, Variables } from "./config.ts";
import { existsSync, getInstallDirectories, mkdirAll } from "./utils.ts";

export async function initializeProject(
  isNew: boolean,
  dir: string,
  template: string,
  spec?: string,
  variables: Variables = {},
): Promise<void> {
  if (template.indexOf("..") != -1) {
    throw new Error(`invalid template ${template}`);
  }

  const dirs = await getInstallDirectories();
  const templatePart = template.replaceAll(path.sep, "/");
  const templatePath = path.join(dirs.templates, templatePart);

  if (isNew) {
    mkdirAll(dir, 0o755);
  }

  variables = variables || {};

  const templateFile = path.join(templatePath, ".template");
  const templateData = Deno.readTextFileSync(templateFile);
  const templateConfig = yaml.parse(templateData) as Template;
  templateConfig.variables = templateConfig.variables || [];

  // Parse variable types and filter for unresolved variables.
  const unresolved = templateConfig.variables.filter((variable) => {
    if (variables[variable.name]) {
      if (variable.default) {
        const type = variable.type || "input";
        switch (type) {
          case "number":
            variables[variable.name] = parseFloat(variable.default as string);
            break;
          case "confirm":
            variables[variable.name] =
              (variable.default as string).toLowerCase() == "true";
            break;
        }
      }
      return false;
    }
    return true;
  });

  // Prompt for unresolved variables from the template.
  for (const variable of unresolved) {
    if (!variable.message) {
      variable.message = variable.prompt || variable.description ||
        `Enter ${variable.name}`;
    }
    const type = variable.type || "input";
    switch (type) {
      case "input":
        variables[variable.name] = await Input.prompt(
          variable as unknown as InputOptions,
        );
        break;
      case "number":
        variables[variable.name] = await Number.prompt(
          variable as unknown as NumberOptions,
        );
        break;
      case "confirm":
        variables[variable.name] = await Confirm.prompt(
          variable as unknown as ConfirmOptions,
        );
        break;
      default:
        throw new Error(`Unexpected variable type ${type}`);
    }
  }

  // Default to name variable to directory name.
  variables.name = variables.name || path.basename(path.resolve(dir));

  // Copy files from template directory.
  const iter = fs.walkSync(templatePath, {
    followSymlinks: true,
    skip: [/\W.(template|keep|gitkeep|github|git)$/g],
  });

  for (const f of iter) {
    const relPath = path.relative(templatePath, f.path);
    const filename = path.basename(relPath);
    const ext = fileExtension(filename);
    let target = path.join(dir, relPath);
    if (ext == "tmpl") {
      target = target.slice(0, -5);
    }

    if (!isNew && existsSync(target)) {
      if (f.isFile) {
        log.info(`${target} already exists. Skipping...`);
      }
      continue;
    }

    if (f.isDirectory) {
      mkdirAll(target, 0o755);
      continue;
    }

    let contents = Deno.readTextFileSync(f.path);

    // Handle template file
    // Very simple variable resolution.
    // Replace {{ .[varname] }} with value.
    if (ext == "tmpl") {
      for (const key of Object.keys(variables)) {
        const value = variables[key];
        if (!value) {
          continue;
        }
        const expr = `\\{\\{\\s*\\.${key}\\s*\\}\\}`;
        contents = contents.replaceAll(
          new RegExp(expr, "gm"),
          value.toString(),
        );
      }
    }

    Deno.writeTextFileSync(target, contents);
  }

  // If an existing spec was specified, copy it to the spec location.
  if (spec) {
    Deno.copyFile(
      spec,
      path.join(dir, templateConfig.specLocation || "apex.axdl"),
    );
  }

  // TODO: Run npm install if needed
}
