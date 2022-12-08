export type Config = { [key: string]: unknown };

/// MAIN CONFIG

export interface Configuration {
  spec: string;
  config?: Config;
  generates: Record<string, Target>;
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

export interface Template {
  name: string;
  description?: string;
  variables?: Variable[];
  specLocation?: string;
}

export interface Variable {
  name: string;
  message: string;
  description?: string;
  type?: "input" | "number" | "confirm";
  prompt: string;
  default?: string | number | boolean;
  required: boolean;
  loop: boolean;
}

export type Variables = {
  [name: string]: string | number | boolean | undefined;
};
