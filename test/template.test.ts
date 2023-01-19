import { assertEquals } from "https://deno.land/std@0.171.0/testing/asserts.ts";
import { processTemplate } from "../src/process.ts";
import * as path from "https://deno.land/std@0.171.0/path/mod.ts";

const __dirname = new URL(".", import.meta.url).pathname;

Deno.test(
  "template",
  { permissions: { read: true, net: true, run: true } },
  async () => {
    const generated = await processTemplate(
      path.join(__dirname, "template", "template.ts"),
      {},
    );

    assertEquals(generated, {
      files: ["file.js"],
      templates: {
        "tmpl": ["file.txt.tmpl"],
      },
    });
  },
);
