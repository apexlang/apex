import * as streams from "https://deno.land/std@0.192.0/streams/read_all.ts";
import * as base64 from "https://deno.land/std@0.192.0/encoding/base64.ts";

import { Configuration } from "./config.ts";
import { processConfig } from "./generate.ts";

// Detect piped input
if (!Deno.isatty(Deno.stdin.rid) && import.meta.main) {
  const stdinContent = await streams.readAll(Deno.stdin);
  const content = new TextDecoder().decode(stdinContent);
  const scaffold = Deno.args.indexOf("--scaffold") != -1;
  try {
    const config = JSON.parse(content) as Configuration;
    console.log(JSON.stringify(
      await processConfig(config, scaffold),
      (_, v) => v instanceof Uint8Array ? base64.encode(v) : v,
    ));
  } catch (e) {
    console.error(e);
    throw e;
  }
}
