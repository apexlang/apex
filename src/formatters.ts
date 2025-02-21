import * as fmt from "https://deno.land/x/deno_fmt@0.1.5/mod.ts";
import { Options } from "https://deno.land/x/deno_fmt@0.1.5/src/options.ts";
import * as astyle from "./astyle.ts";

type SourceFormatter = (source: string) => Promise<string>;
type CLIFormatter = (source: string) => Promise<void>;

export const sourceFormatters: { [ext: string]: SourceFormatter } = {
  js: formatJs,
  jsx: formatJsx,
  ts: formatTs,
  tsx: formatTsx,
  md: formatMd,
  json: formatJson,
  jsonc: formatJsonc,
  cs: formatCsharp,
  java: formatClike,
  c: formatClike,
  cpp: formatClike,
  "c++": formatClike,
  h: formatClike,
  hpp: formatClike,
  "h++": formatClike,
  m: formatClike,
};

export const cliFormatters: { [filename: string]: CLIFormatter } = {
  rs: formatRust,
  go: formatGo,
  py: formatPython,
};

async function formatJs(source: string): Promise<string> {
  return await formatWithDeno(source, "js");
}

async function formatJsx(source: string): Promise<string> {
  return await formatWithDeno(source, "jsx");
}

async function formatTs(source: string): Promise<string> {
  return await formatWithDeno(source, "ts");
}

async function formatTsx(source: string): Promise<string> {
  return await formatWithDeno(source, "tsx");
}

async function formatMd(source: string): Promise<string> {
  return await formatWithDeno(source, "md");
}

async function formatJson(source: string): Promise<string> {
  return await formatWithDeno(source, "json");
}

async function formatJsonc(source: string): Promise<string> {
  return await formatWithDeno(source, "jsonc");
}

async function formatWithDeno(
  source: string,
  ext: Options.Ext,
): Promise<string> {
  try {
    return await fmt.format(source, { ext: ext });
  } catch (_e) {
    return source;
  }
}

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

async function formatGo(filename: string): Promise<void> {
  return await exec("gofmt", "-w", filename);
}

async function formatPython(filename: string): Promise<void> {
  return await exec("yapf", "-i", filename);
}

async function exec(cmd: string, ...args: string[]) {
  const command = new Deno.Command(cmd, {
    args: args,
  });
  await command.output();
}
