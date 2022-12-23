#!/usr/bin/env -S deno run --allow-read --allow-write --allow-env --allow-net --allow-run --unstable

import {
  Command,
  CompletionsCommand,
  HelpCommand,
} from "https://deno.land/x/cliffy@v0.25.5/command/mod.ts";
import {
  GithubProvider,
  UpgradeCommand,
} from "https://deno.land/x/cliffy@v0.25.5/command/upgrade/mod.ts";
import * as log from "https://deno.land/std@0.171.0/log/mod.ts";

const LEVEL =
  (Deno.env.get("APEX_LOG")?.toUpperCase() as log.LevelName | undefined) ||
  "INFO";

await setupLogger(LEVEL);

import * as generate from "./src/commands/generate.ts";
import * as newCmd from "./src/commands/new.ts";
import * as install from "./src/commands/install.ts";
import * as init from "./src/commands/init.ts";
import * as list from "./src/commands/list.ts";
import * as describe from "./src/commands/describe.ts";
import * as watch from "./src/commands/watch.ts";
import * as run from "./src/commands/run.ts";
import { setupLogger } from "./src/utils.ts";

// Version bump this on release.
const version = "v0.0.11";

const args = Deno.args;

if (
  args.length == 1 &&
  args[0] == "__generate" &&
  !Deno.isatty(Deno.stdin.rid)
) {
  generate.fromStdin();
} else {
  const cli = new Command()
    .default("help")
    .version(version)
    .name("apex")
    .description(
      "A code generation tool using Apex, an interface definition language (IDL) for modeling software.",
    )
    .command("install", install.command)
    .command("new", newCmd.command)
    .command("init", init.command)
    .command("generate", generate.command)
    .command("list", list.command)
    .command("describe", describe.command)
    .command("watch", watch.command)
    .command("run", run.command)
    .command(
      "upgrade",
      new UpgradeCommand({
        main: "apex.ts",
        args: [
          "--allow-read",
          "--allow-write",
          "--allow-env",
          "--allow-net",
          "--allow-run",
          "--unstable",
        ],
        provider: [new GithubProvider({ repository: "apexlang/apex" })],
      }),
    )
    .command("help", new HelpCommand().global())
    .command("completions", new CompletionsCommand());

  // Run target if defined in the config.
  if (args.length > 0 && !cli.getBaseCommand(args[0], true)) {
    const targetMap = await run.loadTasks("apex.yaml");
    if (targetMap[args[0]]) {
      await run.runTasks("apex.yaml", targetMap, args);
      Deno.exit(0);
    }
  }

  await cli.parse(args);
}
