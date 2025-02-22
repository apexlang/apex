import init, { format } from "jsr:@fmt/gofmt@^0.4.9";

export async function formatGo(
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
