export async function runApex(
  args: string[],
  env: Record<string, string> = {},
): Promise<Uint8Array> {
  const cmdArgs = [
    "run",
    "--allow-all",
    "--unstable",
    "./apex.ts",
  ];
  cmdArgs.push(...args);
  console.log(`Running: deno ${cmdArgs.join(" ")}`);
  env ||= {};
  // Leave in for quick debugging. Enabling debug logging for every test
  // causes problems for tests that assert on apex output.
  // env.APEX_LOG = "debug";
  const command = new Deno.Command("deno", {
    env,
    stderr: "inherit",
    stdout: "piped",
    args: cmdArgs,
  });
  const out = await command.output();

  return out.stdout;
}
