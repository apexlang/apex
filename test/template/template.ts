// deno-lint-ignore-file require-await
import { FSStructure, Template } from "../../src/config.ts";

const template: Template = {
  info: {
    name: "@apex/test",
    description: "My test template",
    variables: [
      {
        name: "test",
        description: "test",
        type: "input",
        prompt: "Enter test",
        default: "test1234",
      },
    ],
  },

  async process(_vars): Promise<FSStructure> {
    return {
      files: ["file.js"],
      templates: {
        "tmpl": [
          "file.txt.tmpl",
        ],
      },
    };
  },
};

export default template;
