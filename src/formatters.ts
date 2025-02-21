import * as fmtJS from "@fmt/biome-fmt";
import * as fmtPy from "@fmt/ruff-fmt";
import * as fmtC from "@fmt/clang-format";
import * as fmtGo from "@fmt/gofmt";
import * as fmtJSON from "@fmt/json-fmt";

type SourceFormatter = (source: string, filename: string) => Promise<string>;
type CLIFormatter = (filename: string) => Promise<void>;

export const sourceFormatters: { [ext: string]: SourceFormatter } = {
  js: formatJSTS,
  // jsx: formatJsx,
  ts: formatJSTS,
  // tsx: formatTsx,
  // md: formatMd,
  json: formatJson,
  jsonc: formatJson,
  cs: formatCsharp,
  java: formatClike,
  c: formatClike,
  cpp: formatClike,
  "c++": formatClike,
  h: formatClike,
  hpp: formatClike,
  "h++": formatClike,
  m: formatClike,
  py: formatPython,
  go: formatGo,
};

export const cliFormatters: { [filename: string]: CLIFormatter } = {
  rs: formatRust,
};

// async function formatJsx(source: string): Promise<string> {
//   return await formatWithDeno(source, "jsx");
// }

// async function formatTsx(source: string): Promise<string> {
//   return await formatWithDeno(source, "tsx");
// }

// async function formatMd(source: string): Promise<string> {
//   return await formatWithDeno(source, "md");
// }

async function formatJson(source: string): Promise<string> {
  try {
    await fmtJSON.default();
    return await fmtJSON.format(source);
  } catch (_e) {
    return source;
  }
}

// async function formatJsonc(source: string): Promise<string> {
//   return await formatWithDeno(source, "jsonc");
// }

async function formatJSTS(
  source: string,
  filename: string,
): Promise<string> {
  try {
    await fmtJS.default();
    return await fmtJS.format(source, filename);
  } catch (_e) {
    return source;
  }
}

async function formatCsharp(source: string, filename: string): Promise<string> {
  // TODO: Find better settings
  const config = JSON.stringify({
    BasedOnStyle: "Chromium",
    IndentWidth: 4,
    ColumnLimit: 80,
  });

  try {
    await fmtC.default();
    return await fmtC.format(source, filename, config);
  } catch (_e) {
    return source;
  }
}

async function formatClike(source: string, filename: string): Promise<string> {
  const config = JSON.stringify({
    BasedOnStyle: "Chromium",
    IndentWidth: 4,
    ColumnLimit: 80,
  });

  try {
    await fmtC.default();
    return await fmtC.format(source, filename, config);
  } catch (_e) {
    return source;
  }
}

async function formatRust(filename: string): Promise<void> {
  return await exec("rustfmt", "--edition", "2021", filename);
}

async function formatGo(source: string): Promise<string> {
  try {
    await fmtGo.default();
    return await fmtGo.format(source);
  } catch (_e) {
    return source;
  }
}

async function formatPython(source: string): Promise<string> {
  await fmtPy.default();
  return fmtPy.format(source);
}

async function exec(cmd: string, ...args: string[]) {
  const command = new Deno.Command(cmd, {
    args: args,
  });
  await command.output();
}
