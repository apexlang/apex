import * as astyle from "./astyle.ts";
import { formatGo } from "./fmt/go.ts";
import { formatJsTs } from "./fmt/jsts.ts";
import { formatPython } from "./fmt/python.ts";
import { formatJson } from "./fmt/json.ts";
import { formatWeb } from "./fmt/web.ts";

type SourceFormatter = (source: string, filename: string) => Promise<string>;
type CLIFormatter = (source: string) => Promise<void>;

export const sourceFormatters: { [ext: string]: SourceFormatter } = {
  js: formatJsTs,
  ts: formatJsTs,
  cs: formatCsharp,
  java: formatClike,
  c: formatClike,
  cpp: formatClike,
  "c++": formatClike,
  h: formatClike,
  hpp: formatClike,
  "h++": formatClike,
  m: formatClike,
  go: formatGo,
  py: formatPython,
  json: formatJson,
  tsx: formatWeb,
  html: formatWeb,
  vue: formatWeb,
};

export const cliFormatters: { [filename: string]: CLIFormatter } = {
  rs: formatRust,
};

const astyleHref = new URL("./astyle.wasm", import.meta.url).href;

async function formatCsharp(source: string): Promise<string> {
  await astyle.init(astyleHref);
  const [ok, result] = astyle.format(
    source,
    "indent-namespaces break-blocks pad-comma indent=tab style=1tbs",
  );
  if (!ok) {
    throw new Error(`Could not format C#: ${result}`);
  }
  return result;
}

async function formatClike(source: string): Promise<string> {
  await astyle.init(astyleHref);
  const [ok, result] = astyle.format(
    source,
    "pad-oper indent=tab style=google",
  );
  if (!ok) {
    throw new Error(`Could not format source: ${result}`);
  }
  return result;
}

async function formatRust(filename: string): Promise<void> {
  return await exec("rustfmt", "--edition", "2021", filename);
}

async function exec(cmd: string, ...args: string[]) {
  const command = new Deno.Command(cmd, {
    args: args,
  });
  await command.output();
}
