import { Configuration } from "../src/config.ts";
import * as apex from "https://deno.land/x/apex_core@v0.1.0/mod.ts";

export default function (
  _doc: apex.ast.Document,
  config: Configuration
): Configuration {
  config.generates ||= {};
  const numFiles = Object.keys(config.generates).length;
  config.generates[`dynamic.${numFiles}.file`] = { module: "this.ts" };
  return config;
}
