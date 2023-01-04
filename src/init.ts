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

import { Output, Template, Variable, Variables } from "./config.ts";
import { asBytes } from "./utils.ts";
import { writeOutput } from "./process.ts";

export async function initializeProject(
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
      const stat = await Deno.stat(generated.path);
      exists = true;
    } catch {}
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

  log.debug(`Using template path ${template}`);
  const cmd = [
    "git",
    "clone",
    `--depth=1`,
  ];
  if (options.branch) {
    cmd.push(`--branch=${options.branch}`);
  }
  cmd.push(...[template, tmpDir]);

  const process = Deno.run({
    cmd,
  });
  const status = await process.status();
  process.close();
  if (!status.success) {
    throw new Error(`Failed to clone template ${template}`);
  }
  const realTemplateDir = path.join(tmpDir, options.path || "");

  const defaultTemplateFile = ".template";
  const templateFilePath = path.join(realTemplateDir, defaultTemplateFile);

  log.debug(`Looking for template configuration at ${templateFilePath}`);
  const templateFileSrc = await Deno.readTextFile(templateFilePath).catch(
    (_) => "",
  );

  const templateConfig: Template = yaml.parse(templateFileSrc) || {};

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
    skip: [/\W.(template|gitkeep|git)$/g],
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
