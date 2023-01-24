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
