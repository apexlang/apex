export async function runApex(
  args: string[],
  env: Record<string, string> = {},
): Promise<Uint8Array> {
  const cmd = [
    "deno",
    "run",
    "--allow-all",
    "--unstable",
    "./apex.ts",
  ];
  cmd.push(...args);
  console.log(`Running: ${cmd.join(" ")}`);
  env ||= {};
  // Leave in for quick debugging. Enabling debug logging for every test
  // causes problems for tests that assert on apex output.
  // env.APEX_LOG = "debug";
  const proc = Deno.run({
    env,
    stderr: "inherit",
    stdout: "piped",
    cmd,
  });
  const out = await proc.output();
  await proc.close();
  return out;
}
