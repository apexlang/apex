function env(name: string): string {
  const val = Deno.env.get(name);
  if (!val) throw new Error(`$${name} is required`);
  return val;
}

const files = env("FILES").split(/\s*,\s*/);
const version = env("VERSION");

console.log("Updating versions in files");

for (const file of files) {
  console.log(`Updating ${file} for ${version}...`);
  const orig = Deno.readTextFileSync(file);
  const updated = orig.replace(/v\d+\.\d+\.\d+/, version);
  Deno.writeFileSync(file, new TextEncoder().encode(updated));
}
