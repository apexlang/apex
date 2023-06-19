import { assertEquals } from "https://deno.land/std@0.192.0/testing/asserts.ts";
import { process } from "../src/process.ts";
import * as path from "https://deno.land/std@0.192.0/path/mod.ts";
import { asBytes } from "../src/utils.ts";

const __dirname = new URL(".", import.meta.url).pathname;

Deno.test(
  "process",
  { permissions: { read: true, net: true, run: true } },
  async () => {
    const generated = await process({
      spec: path.join(__dirname, "test.axdl"),
      generates: {
        "file.rs": {
          module:
            "https://raw.githubusercontent.com/apexlang/codegen/main/src/rust/rust-basic.ts",
          visitorClass: "RustBasic",
        },
      },
    }, { reload: true });

    const fixture = await Deno.readTextFile(path.join(__dirname, "fixture.rs"));
    assertEquals(generated, [
      {
        path: "file.rs",
        contents: asBytes(fixture),
        executable: false,
      },
    ]);
  },
);
