import { TaskConfig } from "./task.ts";
import * as yaml from "https://deno.land/std@0.171.0/encoding/yaml.ts";

export type Config = { [key: string]: unknown };

/// MAIN CONFIG

export interface Configuration {
  spec: string;
  config?: Config;
  plugins?: string[];
  generates?: Record<string, Target>;
  tasks?: Record<string, TaskDefinition>;
}

export type TaskDefinition = string[] | TaskConfig;

export interface Target {
  module: string;
  visitorClass?: string;
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
  files?: string[];
  directories?: string[];
  templates?: { [engine: string]: string[] };
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
    .map((v) => yaml.parse(v) as Configuration);
}
