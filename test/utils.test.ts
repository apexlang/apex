import { assertEquals } from "https://deno.land/std@0.171.0/testing/asserts.ts";
import { flatten } from "../src/utils.ts";

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
