import {
  prettier,
  prettierPlugins,
} from "https://denolib.com/denolib/prettier/prettier.ts";
import * as astyle from "./astyle.ts";

type SourceFormatter = (source: string) => Promise<string>;
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
};

export const cliFormatters: { [filename: string]: CLIFormatter } = {
  rs: formatRust,
  go: formatGo,
  py: formatPython,
};

// deno-lint-ignore require-await
async function formatJsTs(source: string): Promise<string> {
  try {
    return prettier.format(source, {
      parser: "typescript",
      plugins: prettierPlugins,
    });
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
