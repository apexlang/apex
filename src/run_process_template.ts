import * as streams from "https://deno.land/std@0.192.0/streams/read_all.ts";

import { ProcessTemplateArgs } from "./config.ts";
import { importTemplate } from "./generate.ts";

// Detect piped input
if (!Deno.isatty(Deno.stdin.rid) && import.meta.main) {
  const stdinContent = await streams.readAll(Deno.stdin);
  const content = new TextDecoder().decode(stdinContent);
  try {
    const args = JSON.parse(content) as ProcessTemplateArgs;
    const temp = await importTemplate(args.module);
    if (!temp.process) {
      throw new Error("template does not implement process");
    }
    const fsstruct = await temp.process(args.variables);
    console.log(JSON.stringify(fsstruct));
  } catch (e) {
    console.error(e);
    throw e;
  }
}
