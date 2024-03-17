import { assertEquals } from "@std/assert";
import { Configuration } from "../src/config.ts";
import { flatten, merge, mergeConfigurations } from "../src/utils.ts";

Deno.test(
  "flatten",
  () => {
    const flat = flatten("APEX", {
      str: "string",
      num: 333,
      config: { this: "that" },
      arr: ["first", { inner_obj: "inner_val" }, "last"],
    });

    assertEquals(flat, {
      "APEX_str": "string",
      "APEX_num": "333",
      "APEX_config_this": "that",
      "APEX_arr_0": "first",
      "APEX_arr_1_inner_obj": "inner_val",
      "APEX_arr_2": "last",
    });
  },
);

Deno.test(
  "mergeConfiguration",
  () => {
    const orig: Configuration = {
      config: { value: "original" },
      generates: {
        "original.txt": { module: "original.ts" },
      },
      tasks: {
        original: { cmds: ["echo 'original'"] },
      },
    };
    const plugin: Configuration = {
      config: { name: "from-plugin", value: "plugin", other: "plugin" },
      generates: {
        "original.txt": { module: "plugin.ts" },
        "plugin.txt": { module: "plugin.ts" },
      },
      tasks: {
        original: { cmds: ["echo 'plugin'"] },
      },
    };

    const finalConfig = mergeConfigurations(orig, plugin);

    assertEquals(finalConfig, {
      config: { name: "from-plugin", value: "original", other: "plugin" },
      generates: {
        "original.txt": { module: "original.ts" },
        "plugin.txt": { module: "plugin.ts" },
      },
      tasks: {
        original: { cmds: ["echo 'original'"] },
      },
    });
  },
);

Deno.test(
  "merge",
  () => {
    const orig = {
      name: undefined,
      " other ": "original",
    };
    const plugin = {
      name: "from-plugin",
      other: "from-plugin",
    };

    const finalConfig = merge(orig, plugin);

    assertEquals(finalConfig, {
      name: "from-plugin",
      other: "original",
    });
  },
);
