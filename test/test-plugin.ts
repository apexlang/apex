import { Configuration } from "../src/config.ts";
import * as apex from "https://deno.land/x/apex_core@v0.1.2/mod.ts";
import * as path from "https://deno.land/std@0.171.0/path/mod.ts";

const __dirname = new URL(".", import.meta.url).pathname;
const generator = path.join(__dirname, "test-generator.ts");

export default function (
  doc: apex.ast.Document,
  config: Configuration,
): Configuration {
  config.generates ||= {};
  const interfaces = doc.definitions.filter(
    (def) => def.getKind() === apex.ast.Kind.InterfaceDefinition,
  ) as apex.ast.InterfaceDefinition[];
  const num = Object.keys(config.generates).length;
  for (const iface of interfaces) {
    config.generates[`${iface.name.value}.${num}.file`] = {
      module: generator,
    };
  }
  config.config ||= {};
  config.config.value = "from-plugin";
  config.config.name = "from-plugin";

  config.tasks ||= {};
  config.tasks["build"] = [`echo "from-plugin"`];

  return config;
}
