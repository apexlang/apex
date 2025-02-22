import init, { format } from "jsr:@fmt/json-fmt@^0.1.13";

export async function formatJson(
  source: string,
): Promise<string> {
  try {
    await init();
    return await format(source, {
      indent_style: "space",
      indent_width: 2,
    });
  } catch (_e) {
    console.log(_e);
    return source;
  }
}
