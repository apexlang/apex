import init, { format } from "jsr:@fmt/ruff-fmt@^0.9.4";

export async function formatPython(
  source: string,
): Promise<string> {
  try {
    await init();
    return await format(source);
  } catch (_e) {
    console.log(_e);
    return source;
  }
}
