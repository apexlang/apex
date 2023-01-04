import { assertEquals } from "https://deno.land/std@0.167.0/testing/asserts.ts";
import { getTemplateSources, getUnresolved } from "../src/init.ts";
import * as path from "https://deno.land/std@0.167.0/path/mod.ts";
import { asBytes, setupLogger } from "../src/utils.ts";
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
      variables,
      { path: templateSubdir },
    );
    assertEquals(output.length, 2);
    const fileTxt = output.find((o) => o.path.endsWith("file.txt"));
    assertEquals(fileTxt, {
      path: path.join(testdir, "file.txt"),
      contents: asBytes(
        `This is the ${variables.name} project: ${variables.someVar}`,
      ),
      executable: false,
      mode: parseInt("100644", 8),
    });
    const fileJs = output.find((o) => o.path.endsWith("file.js"));
    assertEquals(fileJs, {
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
    const variables = {
      module: "I am provided",
    };
    const unresolved = getUnresolved(variables, definitions);
    assertEquals(variables, { "module": "I am provided" });
    assertEquals(unresolved, [{
      name: "needed",
      description: "a required var",
      required: true,
      loop: false,
    }]);
  },
);
