import * as io from "https://deno.land/std@0.213.0/io/read_all.ts";

import { importTemplate } from "./generate.ts";

// Detect piped input
if (!Deno.stdin.isTerminal() && import.meta.main) {
  const stdinContent = await io.readAll(Deno.stdin);
  const content = new TextDecoder().decode(stdinContent);
  try {
    const module = JSON.parse(content) as string;
    console.log(JSON.stringify(await importTemplate(module)));
  } catch (e) {
    console.error(e);
    throw e;
  }
}
