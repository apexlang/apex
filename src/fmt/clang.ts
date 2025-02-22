import init, { format } from "jsr:@fmt/clang-format@^19.1.7";

export async function formatJson(
  source: string,
  filename: string,
): Promise<string> {
  try {
    const config = JSON.stringify({
      BasedOnStyle: "Chromium",
      IndentWidth: 4,
      ColumnLimit: 80,
    });

    await init();
    return await format(source, filename, config);
  } catch (_e) {
    console.log(_e);
    return source;
  }
}
