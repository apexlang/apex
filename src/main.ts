import { Command } from "https://deno.land/x/cliffy@v0.25.4/command/mod.ts";
import * as log from "https://deno.land/std@0.167.0/log/mod.ts";

const LEVEL =
  (Deno.env.get("APEX_LOG")?.toUpperCase() as log.LevelName | undefined) ||
  "INFO";

await log.setup({
  handlers: {
    console: new log.handlers.ConsoleHandler(LEVEL),
  },
  loggers: {
    default: {
      level: LEVEL,
      handlers: ["console"],
    },
  },
});

import * as generate from "./commands/generate.ts";

await new Command().command("generate", generate.command).parse(Deno.args);
