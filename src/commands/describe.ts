import { Command } from "https://deno.land/x/cliffy@v0.25.5/command/mod.ts";
import { Row, Table } from "https://deno.land/x/cliffy@v0.25.5/table/mod.ts";

import { loadTemplateRegistry } from "../utils.ts";
import { templateCompletion } from "./utils.ts";

export const templates = new Command()
  .complete("template", async () => await templateCompletion())
  .arguments("<template:string>")
  .description("Describe installed template.")
  .action(async (_options, template: string) => {
    const registry = await loadTemplateRegistry();
    const temp = registry.templates[template];
    if (!template) {
      throw new Error(`template ${template} is not installed`);
    }

    console.log(`Name: ${temp.name} [${temp.url}]`);
    if (temp.description) {
      console.log(`Description: ${temp.description}`);
    }

    const variables = temp.variables || [];
    if (variables.length > 0) {
      console.log("\nVariables:");
      new Table()
        .header(Row.from(["Name", "Description", "Default"]).border(true))
        .body(
          variables.map((
            t,
          ) => [t.name, t.description || "", (t.default || "").toString()]),
        )
        .render();
    }
  });

export const command = new Command()
  .description("Describe available resources.")
  .default("help")
  .command("template", templates);
