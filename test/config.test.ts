import { assertEquals } from "https://deno.land/std@0.167.0/testing/asserts.ts";
import { process } from "../src/process.ts";
import * as path from "https://deno.land/std@0.167.0/path/mod.ts";

const __dirname = new URL(".", import.meta.url).pathname;

// Compact form: name and function
Deno.test(
  "process",
  { permissions: { read: true, net: true, run: true } },
  async () => {
    const generated = await process({
      spec: path.join(__dirname, "test.axdl"),
      generates: {
        "file.rs": {
          module:
            "https://raw.githubusercontent.com/apexlang/codegen/deno-wip/src/rust/rust-basic.ts",
        },
      },
    });

    const fixture = await Deno.readTextFile(path.join(__dirname, "fixture.rs"));
    assertEquals(generated, [{
      file: "file.rs",
      source: fixture,
      executable: false,
    }]);
  },
);
