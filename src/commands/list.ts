import { Command } from "https://deno.land/x/cliffy@v0.25.5/command/mod.ts";
import { Row, Table } from "https://deno.land/x/cliffy@v0.25.5/table/mod.ts";

import { templateList } from "../utils.ts";

export const templates = new Command()
  .description("List installed templates.")
  .action(async (_options) => {
    const templates = await templateList();
    new Table()
      .header(Row.from(["Name", "Description"]).border(true))
      .body(templates.map((t) => [t.name, t.description]))
      .render();
  });

export const command = new Command()
  .description("List available resources.")
  .default("help")
  .command("templates", templates);
