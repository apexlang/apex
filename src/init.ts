import * as path from "https://deno.land/std@0.192.0/path/mod.ts";
import * as fs from "https://deno.land/std@0.192.0/fs/mod.ts";
import * as yaml from "https://deno.land/std@0.192.0/yaml/mod.ts";
import * as log from "https://deno.land/std@0.192.0/log/mod.ts";
import {
  Confirm,
  ConfirmOptions,
  Input,
  InputOptions,
  Number,
  NumberOptions,
} from "./deps/cliffy.ts";
import * as eta from "https://deno.land/x/eta@v1.12.3/mod.ts";

import {
  Output,
  TemplateConfig,
  TemplateRegistry,
  Variable,
  Variables,
} from "./config.ts";
import { asBytes } from "./utils.ts";
import { ProcessOptions, writeOutput } from "./process.ts";
import {
  existsSync,
  getInstallDirectories,
  makeRelativeUrl,
  mkdirAll,
} from "./utils.ts";
import { getTemplateInfo, processTemplate } from "./process.ts";
import { AssetsBuilder } from "./asset_builder.ts";
import { fileExtension } from "https://deno.land/x/file_extension@v2.1.0/mod.ts";

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
  "tmpl": (temp: string, variables: Variables) => {
    return Promise.resolve(renderTemplate(temp, variables));
  },
};

export async function initializeProjectFromGit(
  dest: string,
  template: string,
  variables: Variables = {},
  options: TemplateOptions = {},
): Promise<void> {
  const outputs = await getTemplateSources(
    dest,
    template,
    variables,
    options,
  );
  for (const generated of outputs) {
    let exists = false;
    try {
      const _stat = await Deno.stat(generated.path);
      exists = true;
    } catch (_e) {
      // Ignore
    }
    if (exists && !options.isNew) {
      log.debug(`Skipping ${generated.path} as it already exists`);
      continue;
    }
    await writeOutput(generated);
  }
}

export interface TemplateOptions {
  isNew?: boolean;
  branch?: string;
  path?: string;
  spec?: string;
}

export async function getTemplateSources(
  dest: string,
  template: string,
  variables: Variables = {},
  options: TemplateOptions = {},
): Promise<Output[]> {
  const tmpDir = await Deno.makeTempDir();

  log.debug(`Using template from path '${template}'`);
  const args = [
    "clone",
    `--depth=1`,
  ];
  if (options.branch) {
    args.push(`--branch=${options.branch}`);
  }
  args.push(...[template, tmpDir]);

  const command = new Deno.Command("git", { args: args });
  const result = await command.output();
  // comprocessmand.close();
  if (!result.success) {
    throw new Error(`Failed to clone template ${template}`);
  }
  const realTemplateDir = path.join(tmpDir, options.path || "");

  const defaultTemplateFile = ".template";
  const templateFilePath = path.join(realTemplateDir, defaultTemplateFile);

  log.debug(`Looking for template configuration at ${templateFilePath}`);
  const templateFileSrc = await Deno.readTextFile(templateFilePath).catch(
    (_) => "",
  );

  const templateConfig: TemplateConfig = yaml.parse(templateFileSrc) || {};

  variables = variables || {};

  const unresolved = getUnresolved(
    variables || {},
    templateConfig.variables || [],
  );

  const fromUser = await promptFor(unresolved);
  Object.assign(variables, fromUser);
  variables.name = variables.name || path.basename(path.resolve(dest));

  log.debug(`Template variables: ${JSON.stringify(variables)}`);

  // Default the "name" variable to directory name.

  // Copy files from template directory.
  const iter = fs.walkSync(realTemplateDir, {
    followSymlinks: true,
    skip: [/\W(template.ts|.template|.gitkeep|.git)$/g],
  });

  const output: Output[] = [];

  for (const f of iter) {
    const relPath = path.relative(realTemplateDir, f.path);

    const stat = await Deno.stat(f.path);
    if (!stat.isFile) continue;

    const src = await Deno.readFile(f.path);
    const [filename, contents] = processFile(relPath, src, variables);
    const target = path.join(dest, filename);

    output.push({
      path: target,
      contents,
      mode: stat.mode || undefined,
      executable: false,
    });
  }

  // If an existing spec was specified, register it to copy over.
  if (options.spec) {
    output.push({
      path: path.join(dest, templateConfig.specLocation || "apex.axdl"),
      contents: await Deno.readFile(options.spec),
      executable: false,
      mode: 0o644,
    });
  }
  log.debug("Done processing template files");
  return output;
}

// Handle template file
// Very simple variable resolution.
// Replace {{ .[varname] }} with value.
export function processFile(
  path: string,
  contents: Uint8Array,
  variables: Record<string, unknown>,
): [string, Uint8Array] {
  let target = path;
  const ext = fileExtension(path);
  if (ext == "tmpl") {
    target = target.slice(0, -5);
    log.debug(`Processing '${path}' as template file`);
    contents = asBytes(
      renderTemplate(new TextDecoder().decode(contents), variables),
    );
  }
  return [target, contents];
}

export function renderTemplate(
  contents: string,
  data: Record<string, unknown>,
): string {
  for (const key of Object.keys(data)) {
    const value = data[key];
    if (!value) {
      continue;
    }
    const expr = `\\{\\{\\s*\\.${key}\\s*\\}\\}`;

    contents = contents.replaceAll(
      new RegExp(expr, "gm"),
      value.toString(),
    );
  }
  return contents;
}

export function getUnresolved(
  variables: Record<string, unknown>,
  definitions: Variable[],
): Variable[] {
  const unresolved: Variable[] = [];

  for (const variable of definitions) {
    const value = variables[variable.name];
    if (value !== undefined) {
      // Make sure the value provided on the command line
      // is the type we expect.
      const type = variable.type || "input";
      switch (type) {
        case "number":
          variables[variable.name] = parseFloat(value as string);
          break;
        case "confirm":
          variables[variable.name] = ("" + value).toLowerCase() == "true";
          break;
      }
    } else {
      unresolved.push(variable);
    }
  }
  return unresolved;
}

async function promptFor(
  variables: Variable[],
): Promise<Record<string, unknown>> {
  const values: Record<string, unknown> = {};
  for (const variable of variables) {
    if (!variable.message) {
      variable.message = variable.prompt || variable.description ||
        `Enter ${variable.name}`;
    }
    const type = variable.type || "input";
    switch (type) {
      case "input":
        values[variable.name] = await Input.prompt(
          variable as unknown as InputOptions,
        );
        break;
      case "number":
        values[variable.name] = await Number.prompt(
          variable as unknown as NumberOptions,
        );
        break;
      case "confirm":
        values[variable.name] = await Confirm.prompt(
          variable as unknown as ConfirmOptions,
        );
        break;
      default:
        throw new Error(`Unexpected variable type ${type}`);
    }
  }
  return values;
}

export async function initializeProjectFromTemplate(
  isNew: boolean,
  dir: string,
  template: string,
  options: ProcessOptions,
  spec?: string,
  variables: Variables = {},
): Promise<void> {
  if (
    !(template.startsWith(".") || template.match(/^\w+:\/\//) ||
      template.match(/\.git$/))
  ) {
    const dirs = await getInstallDirectories();
    const templateRegistry = path.join(dirs.home, "templates.yaml");
    const templateListYAML = await Deno.readTextFile(templateRegistry).catch(
      (e) => {
        log.debug(`Could not find template registry at ${templateRegistry}`, e);
        return "";
      },
    );
    const allTemplates =
      (yaml.parse(templateListYAML) || {}) as TemplateRegistry;
    allTemplates.templates ||= {};
    const resolved = allTemplates.templates[template];
    if (!resolved) {
      throw new Error(`template ${template} is not installed`);
    }
    template = resolved.url;
  }

  const url = makeRelativeUrl(template);

  log.debug(`Initializing project from template ${url}`);

  const templateModule = await getTemplateInfo(url.toString(), options);
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

  const fsstructure = await processTemplate(template, variables, options);

  // Add dynamic variables
  if (fsstructure.variables) {
    for (const key of Object.keys(fsstructure.variables)) {
      variables[key] = fsstructure.variables[key];
    }
  }

  const builder = new AssetsBuilder(url);

  const files = fsstructure.files || [];
  for (const file of files) {
    await builder.addFiles(file);
  }

  // currently, only eta templates are supported.
  const engineTemplates = fsstructure.templates || {};
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
    const dirName = path.dirname(target);
    await mkdirAll(dirName, 0o755);

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
