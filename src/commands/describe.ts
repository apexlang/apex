import { Command } from "../../deps/@cliffy/command/mod.ts";
import * as ui from "../ui.ts";

import { loadTemplateRegistry } from "../utils.ts";
import { templateCompletion } from "./utils.ts";

export const templates = new Command()
  .complete("template", async () => await templateCompletion())
  .arguments("<template:string>")
  .description("Describe installed template.")
  // deno-lint-ignore no-explicit-any
  .action(async (_options: any, template: string) => {
    const registry = await loadTemplateRegistry();
    const temp = registry.templates[template];
    if (!temp) {
      throw new Error(`template ${template} is not installed`);
    }

    console.log(`Name: ${temp.name} [${temp.url}]`);
    if (temp.description) {
      console.log(`Description: ${temp.description}`);
    }
    if (temp.metadata) {
      console.log(`Metadata:`);
      Object.keys(temp.metadata).forEach((key) => {
        const value = temp.metadata![key];
        console.log(`  ${key}: ${value}`);
      });
    }

    const variables = temp.variables || [];
    if (variables.length > 0) {
      console.log("\nVariables:");
      ui.listToTable(variables, ["description", "default"]);
    }
  });

export const command = new Command()
  .description("Describe available resources.")
  .default("help")
  .command("template", templates);
