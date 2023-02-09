import * as apex from "https://deno.land/x/apex_core@v0.1.2/mod.ts";
import { assertEquals } from "https://deno.land/std@0.171.0/testing/asserts.ts";
import { processConfig, processPlugin } from "../src/generate.ts";
import * as path from "https://deno.land/std@0.171.0/path/mod.ts";
import { asBytes, setupLogger } from "../src/utils.ts";
import { Configuration } from "../src/config.ts";

const __dirname = new URL(".", import.meta.url).pathname;
const spec = path.join(__dirname, "test.axdl");
const plugin = path.join(__dirname, "test-plugin.ts");
const generator = path.join(__dirname, "test-generator.ts");
await setupLogger("DEBUG");

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
  },
);

Deno.test(
  "plugins don't override original tasks, generate commands, or config properties",
  { permissions: { read: true, net: true, run: true } },
  async () => {
    const apexSource = await Deno.readTextFile(spec);
    const doc = apex.parse(apexSource);
    const config = await processPlugin(doc, {
      spec,
      config: { name: "", value: "original" },
      plugins: [plugin],
      tasks: { "build": [`echo "overridden"`], dependency: [""] },
      generates: { "Test.1.file": { module: "overridden.ts" } },
    } as Configuration);

    assertEquals(config, {
      spec,
      config: { value: "original", name: "from-plugin" },
      plugins: [plugin],
      tasks: { "build": [`echo "overridden"`], dependency: [""] },
      generates: { "Test.1.file": { module: "overridden.ts" } },
    });
  },
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

    assertEquals(config.tasks, {
      "build": [`echo "from-plugin"`],
    });
  },
);

Deno.test(
  "generate",
  { permissions: { read: true, net: true, run: true } },
  async () => {
    const output = await processConfig({
      spec,
      plugins: [plugin, plugin],
    });

    assertEquals(output, [
      {
        path: "Test.0.file",
        contents: asBytes("startend"),
        executable: false,
        runAfter: undefined,
      },
      {
        path: "Test.1.file",
        contents: asBytes("startend"),
        executable: false,
        runAfter: undefined,
      },
    ]);
  },
);
