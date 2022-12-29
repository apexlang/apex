import * as apex from "https://deno.land/x/apex_core@v0.1.1/mod.ts";
import { assertEquals } from "https://deno.land/std@0.167.0/testing/asserts.ts";
import { getTemplateSources, mergeVariables } from "../src/init.ts";
import * as path from "https://deno.land/std@0.167.0/path/mod.ts";
import { asBytes, asString, setupLogger } from "../src/utils.ts";
import { Variable } from "../src/config.ts";

const __dirname = new URL(".", import.meta.url).pathname;
await setupLogger("DEBUG");

Deno.test(
  "init",
  { permissions: { read: true, net: true, run: true, write: true } },
  async () => {
    const testdir = await Deno.makeTempDir();
    const templateBase = path.join(__dirname, "..");
    const templateSubdir = path.join("test", "template");
    const variables = {
      name: "Test Project",
      someVar: "This is just a variable",
    };
    const output = await getTemplateSources(
      testdir,
      templateBase,
      templateSubdir,
      "apex-new",
      undefined,
      variables,
    );
    assertEquals(output.length, 2);

    assertEquals(output[0], {
      path: path.join(testdir, "file.txt"),
      contents: asBytes(
        `This is the ${variables.name} project: ${variables.someVar}`,
      ),
      executable: false,
      mode: parseInt("100644", 8),
    });
    assertEquals(output[1], {
      path: path.join(testdir, "file.js"),
      contents: asBytes('console.log("test");\n'),
      executable: false,
      mode: parseInt("100644", 8),
    });
  },
);

Deno.test(
  "init",
  () => {
    const definitions: Variable[] = [{
      name: "module",
      description: "The module name",
      default: "default value",
      required: false,
      loop: false,
    }, {
      name: "needed",
      description: "a required var",
      required: true,
      loop: false,
    }];
    const variables = {};
    const unresolved = mergeVariables(variables, definitions);
    assertEquals(variables, { "module": "default value" });
    assertEquals(unresolved, [{
      name: "needed",
      description: "a required var",
      required: true,
      loop: false,
    }]);
  },
);
