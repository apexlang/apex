// Hack to surpress warning.
const _import = new Function("path", "return import(path)");

// Wraps `import` so that there is a single unanalyzable dynamic import.
// deno-lint-ignore no-explicit-any
export default async function (url: string): Promise<any> {
  return await _import(url.toString());
}
