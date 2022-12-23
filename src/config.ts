export type Config = { [key: string]: unknown };

/// MAIN CONFIG

export interface Configuration {
  spec: string;
  config?: Config;
  plugins?: string[];
  generates?: Record<string, Target>;
}

export interface Target {
  module: string;
  visitorClass?: string;
  ifNotExists?: boolean;
  executable?: boolean;
  config?: Config;
  runAfter?: Command[];
}

export interface Command {
  command: string;
  dir?: string;
}

export interface Output {
  file: string;
  source: string;
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

export interface Template {
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
  description?: string;
  prompt: string;
  type?: "input" | "number" | "confirm";
  default?: string | number | boolean;
  required?: boolean;
  loop?: boolean;
  message?: string;
}

export type Variables = Record<string, string | number | boolean | undefined>;
