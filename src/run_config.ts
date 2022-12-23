import * as streams from "https://deno.land/std@0.167.0/streams/read_all.ts";

import { Configuration } from "./config.ts";
import { processConfig } from "./generate.ts";

// Detect piped input
if (!Deno.isatty(Deno.stdin.rid) && import.meta.main) {
  const stdinContent = await streams.readAll(Deno.stdin);
  const content = new TextDecoder().decode(stdinContent);
  try {
    const config = JSON.parse(content) as Configuration;
    console.log(JSON.stringify(await processConfig(config)));
  } catch (e) {
    console.error(e);
    throw e;
  }
}
