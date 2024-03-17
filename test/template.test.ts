import { assertEquals } from "@std/assert";
import { processTemplate } from "../src/process.ts";
import * as path from "@std/path";

const __dirname = new URL(".", import.meta.url).pathname;

Deno.test(
  "template",
  { permissions: "inherit" },
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
