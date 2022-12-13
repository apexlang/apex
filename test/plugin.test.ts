import { assertEquals } from "https://deno.land/std@0.167.0/testing/asserts.ts";
import { processPlugin } from "../src/plugins.ts";
import * as path from "https://deno.land/std@0.167.0/path/mod.ts";

const __dirname = new URL(".", import.meta.url).pathname;

Deno.test(
  "plugin",
  { permissions: { read: true, net: true, run: true } },
  async () => {
    const config = await processPlugin({
      spec: path.join(__dirname, "test.axdl"),
      plugins: [path.join(__dirname, "test-plugin.ts")],
    });

    assertEquals(config.generates, { "dynamic.0.file": { module: "this.ts" } });
  }
);

Deno.test(
  "plugin",
  { permissions: { read: true, net: true, run: true } },
  async () => {
    const config = await processPlugin({
      spec: path.join(__dirname, "test.axdl"),
      plugins: [
        path.join(__dirname, "test-plugin.ts"),
        path.join(__dirname, "test-plugin.ts"),
      ],
    });

    assertEquals(config.generates, {
      "dynamic.0.file": { module: "this.ts" },
      "dynamic.1.file": { module: "this.ts" },
    });
  }
);
