import * as apex from "https://deno.land/x/apex_core@v0.1.5/mod.ts";
import { assertEquals } from "https://deno.land/std@0.213.0/assert/assert_equals.ts";
import { processPlugin } from "../src/generate.ts";
import * as path from "https://deno.land/std@0.213.0/path/mod.ts";
import { setupLogger } from "../src/utils.ts";

const __dirname = new URL(".", import.meta.url).pathname;
const spec = path.join(__dirname, "test.axdl");
await setupLogger("DEBUG");

Deno.test(
  "regression test for #33",
  { permissions: { read: true, net: true, run: true } },
  async () => {
    const apexSource = await Deno.readTextFile(spec);
    const doc = apex.parse(apexSource);
    const config = await processPlugin(doc, {
      spec,
      plugins: [
        "https://raw.githubusercontent.com/nanobus/iota/5aec377a326c7f04ae4c37a5e1dfaaf9ea5c3e92/codegen/src/tinygo/plugin.ts",
      ],
    });

    assertEquals(config.tasks?.all, {
      deps: ["clean", "generate", "deps", "build"],
      description: "Clean, generate, and build",
    });
  },
);
