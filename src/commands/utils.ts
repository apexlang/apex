import { ValidationError } from "../../deps/@cliffy/command/mod.ts";
import { templateList } from "../utils.ts";

export const varOptions = {
  collect: true,
  value: (
    value: string,
    previous: { [key: string]: string } = {},
  ): { [key: string]: string } => {
    const idx = value.indexOf("=");
    if (idx == -1) {
      throw new ValidationError(
        `Variables must be in [key]=[value] syntax, but got "${value}".`,
        { exitCode: 1 },
      );
    }

    const key = value.substring(0, idx);
    const val = value.substring(idx + 1);
    previous[key] = val;
    return previous;
  },
};

export async function templateCompletion(): Promise<string[]> {
  return Object.values(await templateList()).map((t) => t.name || "");
}
