#!/usr/bin/env -S deno run --allow-read --allow-write --allow-env --allow-net --allow-run

import {
  Command,
  CompletionsCommand,
  GithubProvider,
  HelpCommand,
  UpgradeCommand,
} from "./src/deps/cliffy.ts";
import * as log from "https://deno.land/std@0.213.0/log/mod.ts";

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
const version = "v0.1.1";

// This is necessary so we can modify the argument list.
const args = Array.from(Deno.args);

if (
  args.length == 1 &&
  args[0] == "__generate" &&
  !Deno.stdin.isTerminal()
) {
  generate.fromStdin();
} else {
  const cli = new Command()
    .default("help")
    .version(version)
    .name("apex")
    .description(
      "A complete project tool suite based on Apexlang, an interface definition language (IDL) for modeling software.",
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
        ],
        provider: [new GithubProvider({ repository: "apexlang/apex" })],
      }),
    )
    .command("help", new HelpCommand().global())
    .command("completions", new CompletionsCommand());

  const nonFlagArgs = args.filter((v) => !v.startsWith("-"));
  const nonApexCommand = nonFlagArgs.length > 0 &&
    !cli.getBaseCommand(args[0], true);
  // If we have a subcommand that isn't a built-in, treat
  // the command as if it were triggered with `apex run`
  if (nonApexCommand) {
    args.unshift("run");
  }

  try {
    await cli.parse(args);
  } catch (e) {
    log.error(e);
    Deno.exit(1);
  }
}
