import * as path from "https://deno.land/std@0.167.0/path/mod.ts";
import * as yaml from "https://deno.land/std@0.167.0/encoding/yaml.ts";
import * as log from "https://deno.land/std@0.167.0/log/mod.ts";
import {
  Confirm,
  ConfirmOptions,
  Input,
  InputOptions,
  Number,
  NumberOptions,
} from "https://deno.land/x/cliffy@v0.25.5/prompt/mod.ts";
import * as eta from "https://deno.land/x/eta@v1.12.3/mod.ts";

import { TemplateRegistry, Variables } from "./config.ts";
import {
  existsSync,
  getInstallDirectories,
  makeRelativeUrl,
  mkdirAll,
} from "./utils.ts";
import { getTemplateInfo, processTemplate } from "./process.ts";
import { AssetsBuilder } from "./asset_builder.ts";

const templateEngines: Record<
  string,
  (temp: string, vars: Variables) => Promise<string>
> = {
  "eta": async (temp: string, variables: Variables) => {
    const result = eta.renderAsync(temp, variables);
    if (result) {
      return await result;
    }
    throw new Error("template failed");
  },
};

export async function initializeProject(
  isNew: boolean,
  dir: string,
  template: string,
  spec?: string,
  variables: Variables = {},
): Promise<void> {
  if (
    !(template.startsWith(".") || template.startsWith("http://") ||
      template.startsWith("https://"))
  ) {
    const dirs = await getInstallDirectories();
    const templateRegistry = path.join(dirs.home, "templates.yaml");
    const templateListYAML = Deno.readTextFileSync(templateRegistry);
    const allTemplates = yaml.parse(templateListYAML) as TemplateRegistry;
    const resolved = allTemplates.templates[template];
    if (!resolved) {
      throw new Error(`template ${template} is not installed`);
    }
    template = resolved.url;
  }

  const url = makeRelativeUrl(template);

  const templateModule = await getTemplateInfo(url.toString());
  if (!templateModule.info) {
    throw new Error("template module does not contain info");
  }

  if (isNew) {
    mkdirAll(dir, 0o755);
  }

  variables = variables || {};

  const templateConfig = templateModule.info;
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
    variable.message = variable.prompt || variable.description ||
      `Enter ${variable.name}`;
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

  const fsstructure = await processTemplate(template, variables);

  const builder = new AssetsBuilder(url);

  const files = fsstructure.files || [];
  for (const file of files) {
    await builder.addFiles(file);
  }

  // currently, only eta templates are supported.
  const engineTemplates = (fsstructure.templates || {});
  for (const engine of Object.keys(engineTemplates)) {
    const engineFn = templateEngines[engine];
    if (!engine) {
      throw new Error(`unknown template engine ${engine}`);
    }
    const etaTemplates = engineTemplates[engine] || [];
    for (const file of etaTemplates) {
      await builder.addTemplates(
        async (temp: string) => await engineFn(temp, variables),
        file,
      );
    }
  }

  const assets = builder.getAssets();

  (fsstructure.directories || []).forEach((newDir) => {
    if (newDir.indexOf("..") != -1) {
      throw new Error("invalid directory");
    }

    mkdirAll(path.join(dir, newDir), 0o755);
  });

  for (const file of Object.keys(assets)) {
    const target = path.join(dir, file);
    if (!isNew && existsSync(target)) {
      log.info(`${target} already exists. Skipping...`);
      continue;
    }

    log.info(`Writing ${target}...`);
    Deno.writeFileSync(target, assets[file]);
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
