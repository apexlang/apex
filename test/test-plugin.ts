import { Configuration } from "../src/config.ts";
import * as ast from "@apexlang/core/ast";
import * as path from "@std/path";

const __dirname = new URL(".", import.meta.url).pathname;
const generator = path.join(__dirname, "test-generator.ts");

export default function (
  doc: ast.Document,
  config: Configuration,
): Configuration {
  config.generates ||= {};
  const interfaces = doc.definitions.filter(
    (def) => def.getKind() === ast.Kind.InterfaceDefinition,
  ) as ast.InterfaceDefinition[];
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
  config.tasks["build"] = {
    cmds: [`echo "from-plugin"`],
  };

  return config;
}
