import { Command } from "../deps/cliffy.ts";
import * as ui from "../ui.ts";

import { loadTemplateRegistry } from "../utils.ts";
import { templateCompletion } from "./utils.ts";

export const templates = new Command()
  .complete("template", async () => await templateCompletion())
  .arguments("<template:string>")
  .description("Describe installed template.")
  .action(async (_options, template: string) => {
    const registry = await loadTemplateRegistry();
    const temp = registry.templates[template];
    if (!temp) {
      throw new Error(`template ${template} is not installed`);
    }

    console.log(`Name: ${temp.name} [${temp.url}]`);
    if (temp.description) {
      console.log(`Description: ${temp.description}`);
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
