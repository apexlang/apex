import { assertEquals } from "../deps/@std/assert/mod.ts";
import { processConfiguration } from "../src/process.ts";
import * as path from "../deps/@std/path/mod.ts";
import { asBytes } from "../src/utils.ts";

const __dirname = new URL(".", import.meta.url).pathname;

Deno.test(
  "process",
  { permissions: "inherit" },
  async () => {
    const generated = await processConfiguration({
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
        runAfter: undefined,
      },
    ]);
  },
);
