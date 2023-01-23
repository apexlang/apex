import * as path from "https://deno.land/std@0.171.0/path/mod.ts";
import home_dir from "https://deno.land/x/dir@1.5.1/home_dir/mod.ts";
import * as yaml from "https://deno.land/std@0.171.0/encoding/yaml.ts";
import * as log from "https://deno.land/std@0.171.0/log/mod.ts";

import { InstalledTemplate, TemplateRegistry } from "./config.ts";

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

export async function loadTemplateRegistry(): Promise<TemplateRegistry> {
  const dirs = await getInstallDirectories();
  const templateRegistry = path.join(dirs.home, "templates.yaml");
  try {
    const templateListYAML = Deno.readTextFileSync(templateRegistry);
    const registry = yaml.parse(templateListYAML) as TemplateRegistry;
    calulateVersions(registry);
    return registry;
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      return {
        templates: {},
      } as TemplateRegistry;
    }
    throw error;
  }
}

const versionRegex = /@(v[0-9][^\/]*)\//gm;

function calulateVersions(registry: TemplateRegistry) {
  for (const tmpl of Object.values(registry.templates)) {
    if (tmpl.version) {
      continue;
    }

    // Get version
    let m;
    if ((m = versionRegex.exec(tmpl.url)) !== null) {
      m.forEach((match, groupIndex) => {
        if (groupIndex == 1) {
          tmpl.version = match;
        }
      });
    }
  }
}

export async function templateList(): Promise<
  Record<string, InstalledTemplate>
> {
  const allTemplates = await loadTemplateRegistry();
  return allTemplates.templates;
}

export interface ApexDirs {
  home: string;
  definitions: string;
}

export async function getInstallDirectories(): Promise<ApexDirs> {
  const homeDirectory = home_dir();
  if (!homeDirectory) {
    throw new Error("could not determine home directory");
  }

  const apexHome = path.join(homeDirectory, ".apex");
  const definitionsHome = path.join(apexHome, "definitions");

  await mkdirAll(apexHome, 0o700);
  await mkdirAll(definitionsHome, 0o700);

  return {
    home: apexHome,
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

export function findApexConfig(config = "apex.yaml"): string | undefined {
  try {
    let dir = Deno.cwd();
    let p = path.join(dir, config);
    if (existsSync(p)) {
      Deno.chdir(path.dirname(p));
      return p;
    }
    while (true) {
      const prev = dir;
      dir = path.resolve(dir, "../");
      if (prev == dir) {
        return undefined;
      }
      p = path.join(dir, config);
      if (existsSync(p)) {
        Deno.chdir(dir);
        return p;
      }
    }
  } catch (_e) {
    return undefined;
  }
}

export function flatten(prefix: string, obj: unknown): unknown {
  if (obj === null || obj === undefined) {
    return { [prefix]: "" };
  } else if (typeof obj === "string") {
    return { [prefix]: obj };
  } else if (Array.isArray(obj)) {
    const result = {};
    for (let i = 0; i < obj.length; i++) {
      Object.assign(result, flatten(`${prefix}_${i}`, obj[i]));
    }
    return result;
  } else if (typeof obj === "object") {
    const result = {};
    for (const [key, value] of Object.entries(obj)) {
      Object.assign(result, flatten(`${prefix}_${key}`, value));
    }
    return result;
  } else {
    return { [prefix]: obj.toString() };
  }
}
