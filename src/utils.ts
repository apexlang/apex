import * as path from "https://deno.land/std@0.167.0/path/mod.ts";
import home_dir from "https://deno.land/x/dir@1.5.1/home_dir/mod.ts";
import * as yaml from "https://deno.land/std@0.167.0/encoding/yaml.ts";
import { walkSync } from "https://deno.land/std@0.167.0/fs/mod.ts";
import * as log from "https://deno.land/std@0.167.0/log/mod.ts";

import { Template } from "./config.ts";

// This function is copied here because it is deprecated for a reason
// that does not match ou use case.
export function existsSync(filePath: string | URL): boolean {
  try {
    Deno.lstatSync(filePath);
    return true;
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      return false;
    }
    throw error;
  }
}

export async function templateList(): Promise<Template[]> {
  const dirs = await getInstallDirectories();
  // Copy files from template directory.
  const iter = walkSync(dirs.templates, {
    followSymlinks: true,
    match: [/\W.template$/g],
  });

  const templates: Template[] = [];
  for (const f of iter) {
    const name = path
      .relative(dirs.templates, path.dirname(f.path))
      .replace("\\", "/");
    const templateData = Deno.readTextFileSync(f.path);
    const templateConfig = yaml.parse(templateData) as Template;
    templates.push({
      ...templateConfig,
      name,
    });
  }

  return templates.sort((a, b) =>
    new String(a.name).localeCompare(
      b.name ||
        "",
    )
  );
}

export interface ApexDirs {
  home: string;
  templates: string;
  definitions: string;
}

export async function getInstallDirectories(): Promise<ApexDirs> {
  const homeDirectory = home_dir();
  if (!homeDirectory) {
    throw new Error("could not determine home directory");
  }

  const apexHome = path.join(homeDirectory, ".apex");
  const templatesHome = path.join(apexHome, "templates");
  const definitionsHome = path.join(apexHome, "definitions");

  await mkdirAll(apexHome, 0o700);
  await Promise.all([
    mkdirAll(templatesHome, 0o700),
    mkdirAll(definitionsHome, 0o700),
  ]);

  return {
    home: apexHome,
    templates: templatesHome,
    definitions: definitionsHome,
  };
}

export async function mkdirAll(path: string, mode: number) {
  try {
    await Deno.mkdir(path, { recursive: true, mode: mode });
  } catch (error) {
    if (error && error.kind === Deno.errors.AlreadyExists) {
      // file or directory does not exist
    } else {
      // unexpected error, maybe permissions, pass it along
      throw error;
    }
  }
}

export function makeRelativeUrl(file: string): URL {
  return file.startsWith(".")
    ? new URL("file:///" + path.join(Deno.cwd(), file))
    : file.startsWith("/")
    ? new URL("file:///" + file)
    : new URL(file);
}

export function asBytes(str: string) {
  return new TextEncoder().encode(str);
}

export function asString(bytes: Uint8Array) {
  return new TextDecoder().decode(bytes);
}

export async function setupLogger(level: log.LevelName) {
  await log.setup({
    handlers: {
      console: new log.handlers.ConsoleHandler(level),
    },
    loggers: {
      default: {
        level,
        handlers: ["console"],
      },
    },
  });
}
