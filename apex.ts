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
import * as log from "https://deno.land/std@0.167.0/log/mod.ts";

const LEVEL =
  (Deno.env.get("APEX_LOG")?.toUpperCase() as log.LevelName | undefined) ||
  "INFO";

await setupLogger(LEVEL);

import * as generate from "./src/commands/generate.ts";
import * as newCmd from "./src/commands/new.ts";
import * as init from "./src/commands/init.ts";
import * as list from "./src/commands/list.ts";
import * as watch from "./src/commands/watch.ts";
import { setupLogger } from "./src/utils.ts";

// Get version
const regex = /apexlang\/apex\/([^\/]*)\//gm;
let version = "edge";
let m;

if ((m = regex.exec(import.meta.url)) !== null) {
  m.forEach((match, _groupIndex) => {
    version = match;
  });
}

if (
  Deno.args.length == 1 &&
  Deno.args[0] == "__generate" &&
  !Deno.isatty(Deno.stdin.rid)
) {
  generate.fromStdin();
} else {
  await new Command()
    .default("help")
    .version(version)
    .name("apex")
    .description(
      "A code generation tool using Apex, an interface definition language (IDL) for modeling software.",
    )
    .command("new", newCmd.command)
    .command("init", init.command)
    .command("generate", generate.command)
    .command("list", list.command)
    .command("watch", watch.command)
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
    .command("completions", new CompletionsCommand())
    .parse(Deno.args);
}
