import * as apex from "https://deno.land/x/apex_core@v0.1.1/mod.ts";
import { assertEquals } from "https://deno.land/std@0.167.0/testing/asserts.ts";
import { processPlugin, processConfig } from "../src/generate.ts";
import * as path from "https://deno.land/std@0.167.0/path/mod.ts";

const __dirname = new URL(".", import.meta.url).pathname;
const spec = path.join(__dirname, "test.axdl");
const plugin = path.join(__dirname, "test-plugin.ts");
const generator = path.join(__dirname, "test-generator.ts");

Deno.test(
  "plugin",
  { permissions: { read: true, net: true, run: true } },
  async () => {
    const apexSource = await Deno.readTextFile(spec);
    const doc = apex.parse(apexSource);
    const config = await processPlugin(doc, {
      spec,
      plugins: [plugin],
    });

    assertEquals(config.generates, { "Test.0.file": { module: generator } });
  }
);

Deno.test(
  "plugin",
  { permissions: { read: true, net: true, run: true } },
  async () => {
    const apexSource = await Deno.readTextFile(spec);
    const doc = apex.parse(apexSource);
    const config = await processPlugin(doc, {
      spec,
      plugins: [plugin, plugin],
    });

    assertEquals(config.generates, {
      "Test.0.file": { module: generator },
      "Test.1.file": { module: generator },
    });
  }
);

Deno.test(
  "generate",
  { permissions: { read: true, net: true, run: true } },
  async () => {
    const apexSource = await Deno.readTextFile(spec);
    const output = await processConfig({
      spec,
      plugins: [plugin, plugin],
    });

    assertEquals(output, [
      {
        file: "Test.0.file",
        source: "startend",
        executable: false,
        runAfter: undefined,
      },
      {
        file: "Test.1.file",
        source: "startend",
        executable: false,
        runAfter: undefined,
      },
    ]);
  }
);
