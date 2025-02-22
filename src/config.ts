import { TaskConfig } from "./task.ts";
import * as yaml from "../deps/@std/yaml/mod.ts";
import { findApexConfig } from "./utils.ts";
import * as log from "../deps/@std/log/mod.ts";
import { ProcessOptions } from "./process.ts";

export type Config = Record<string, unknown>;

/// MAIN CONFIG

export interface WorkerArgs<T> {
  config: T;
  options: ProcessOptions;
}

export interface IWorker {
  // deno-lint-ignore no-explicit-any
  onmessage: (event: MessageEvent<any>) => void;
  // deno-lint-ignore no-explicit-any
  postMessage: (event: any) => void;
}

// deno-lint-ignore no-explicit-any
export function asWorker(s: any): IWorker {
  return s as IWorker;
}

export interface Configuration {
  spec?: string;
  config?: Config;
  plugins?: string[];
  generates?: Record<string, Target>;
  tasks?: Record<string, TaskConfig>;
}

export interface Target {
  module: string;
  visitorClass?: string;
  scaffold?: boolean;
  ifNotExists?: boolean;
  append?: Visitor[];
  executable?: boolean;
  config?: Config;
  runAfter?: Command[];
}

export interface Visitor {
  module: string;
  visitorClass?: string;
}

export interface Command {
  command: string;
  dir?: string;
}

export interface Output {
  path: string;
  contents: Uint8Array;
  mode?: number;
  executable: boolean;
  runAfter?: Command[];
}

export interface JsonOutput {
  path: string;
  contents: string;
  mode?: number;
  executable: boolean;
  runAfter?: Command[];
}

/// TEMPLATE FILES

export type TemplateMap = Record<string, InstalledTemplate>;

export interface InstalledTemplate extends TemplateInfo {
  url: string;
  version?: string;
}

export interface TemplateRegistry {
  templates: TemplateMap;
}

export interface ProcessTemplateArgs {
  module: string;
  variables: Variables;
}

export type Assets = Record<string, Uint8Array>;

export interface FSStructure {
  variables?: Record<string, string | number | boolean>;
  files?: string[];
  directories?: string[];
  templates?: Record<string, string[]>;
  definitions?: Record<string, string>;
}

export interface TemplateConfig {
  name?: string;
  description?: string;
  variables?: Variable[];
  specLocation?: string;
}

export interface Template {
  name?: string;
  description?: string;
  info?: TemplateInfo;
  templates?: string[];
  process?(variables: Variables): Promise<FSStructure>;
}

export interface TemplateInfo {
  name: string;
  description: string;
  metadata?: Record<string, unknown>;
  variables?: Variable[];
  specLocation?: string;
}

export interface Variable {
  name: string;
  message?: string;
  description?: string;
  prompt?: string;
  type?: "input" | "number" | "confirm";
  default?: string | number | boolean;
  required?: boolean;
  loop?: boolean;
}

export type Variables = Record<string, string | number | boolean | undefined>;

// TODO: need to validate yaml for a TS interface rather than assume it's OK.
export function parseConfigYaml(contents: string): Configuration[] {
  return contents
    .split("---\n")
    .map((v) => v.trim())
    .map((v) => (yaml.parse(v) || {}) as Configuration);
}

export async function findConfigFile(filePath?: string): Promise<string> {
  const configFile = filePath || "apex.yaml";
  const configPath = findApexConfig(configFile);
  if (!configPath) {
    console.log("could not find configuration");
    Deno.exit(1);
  }
  let config;
  try {
    config = await Deno.readTextFile(configPath);
  } catch (_e) {
    log.error(`Could not read config ${configPath}`);
    Deno.exit(1);
  }
  return config;
}
