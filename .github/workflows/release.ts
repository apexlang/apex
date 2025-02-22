function env(name: string): string {
  const val = Deno.env.get(name);
  if (!val) throw new Error(`$${name} is required`);
  return val;
}

const files = env("FILES").split(/\s*,\s*/);
const version = env("VERSION");

if (!version.match(/^v\d+\.\d+\.\d+$/)) {
  throw new Error("VERSION must be in the form v1.2.3");
}

console.log("Updating versions in files");

for (const file of files) {
  console.log(`Updating ${file} for ${version}...`);
  const orig = Deno.readTextFileSync(file);
  const updated = orig.replace(/\d+\.\d+\.\d+/, version.substring(1));
  Deno.writeFileSync(file, new TextEncoder().encode(updated));
}
