import init, { format } from "jsr:@fmt/biome-fmt@^0.1.13";

export async function formatJsTs(
  source: string,
  filename: string,
): Promise<string> {
  try {
    await init();
    return await format(source, filename, {
      indent_style: "space",
      indent_width: 2,
      trailing_comma: "all",
    });
  } catch (_e) {
    console.log(_e);
    return source;
  }
}
