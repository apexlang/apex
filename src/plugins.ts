import * as apex from "https://deno.land/x/apex_core@v0.1.0/mod.ts";
import * as log from "https://deno.land/std@0.167.0/log/mod.ts";
import * as path from "https://deno.land/std@0.167.0/path/mod.ts";
import * as streams from "https://deno.land/std@0.167.0/streams/read_all.ts";

import { Configuration } from "./config.ts";

export async function processPlugin(
  config: Configuration
): Promise<Configuration> {
  const apexSource = await Deno.readTextFile(config.spec);
  // TODO: implement resolver callback
  const doc = apex.parse(apexSource);

  for (const file of config.plugins || []) {
    const url = file.startsWith(".")
      ? new URL("file:///" + path.join(Deno.cwd(), file))
      : file.startsWith("/")
      ? new URL("file:///" + file)
      : new URL(file);

    log.debug(`Generating configuration with plugin from ${url}`);

    const plugin = await import(url.toString());
    config = plugin.default(doc, config);
  }

  return config;
}

// Detect piped input
if (!Deno.isatty(Deno.stdin.rid) && import.meta.main) {
  const stdinContent = await streams.readAll(Deno.stdin);
  const content = new TextDecoder().decode(stdinContent);
  try {
    const config = JSON.parse(content) as Configuration;
    console.log(JSON.stringify(await processPlugin(config)));
  } catch (e) {
    console.error(e);
    throw e;
  }
}
