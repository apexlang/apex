import * as io from "https://deno.land/std@0.213.0/io/read_all.ts";

import { ProcessTemplateArgs } from "./config.ts";
import { importTemplate } from "./generate.ts";

// Detect piped input
if (!Deno.stdin.isTerminal() && import.meta.main) {
  const stdinContent = await io.readAll(Deno.stdin);
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
