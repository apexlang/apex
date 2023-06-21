import * as streams from "https://deno.land/std@0.192.0/streams/read_all.ts";

import { importTemplate } from "./generate.ts";

// Detect piped input
if (!Deno.isatty(Deno.stdin.rid) && import.meta.main) {
  const stdinContent = await streams.readAll(Deno.stdin);
  const content = new TextDecoder().decode(stdinContent);
  try {
    const module = JSON.parse(content) as string;
    console.log(JSON.stringify(await importTemplate(module)));
  } catch (e) {
    console.error(e);
    throw e;
  }
}
