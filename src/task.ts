import { build$, CommandBuilder } from "https://deno.land/x/dax@0.24.1/mod.ts";

export enum TaskRunner {
  Dax = "dax",
}

export type TaskConfig = Partial<Pick<Task, keyof Task>>;

export interface CmdOutput {
  cmd: string;
  output: Uint8Array;
}

export class Task {
  runner = TaskRunner.Dax;
  deps: string[] = [];
  cmds: string[] = [];

  constructor(config: TaskConfig = {}) {
    this.runner = config.runner || TaskRunner.Dax;
    this.deps = config.deps || [];
    this.cmds = config.cmds || [];
  }

  async run(
    opts: { capture?: boolean; quiet?: boolean; env?: Record<string, string> } =
      {},
  ): Promise<Record<string, CmdOutput> | undefined> {
    const output: Record<string, CmdOutput> = {};

    if (this.runner === TaskRunner.Dax) {
      const commandBuilder = new CommandBuilder().noThrow();
      const $ = build$({ commandBuilder });
      const env = opts.env || {};

      for (let c of this.cmds) {
        c = c.trim();

        const joined = c
          .split("\n")
          .map((v) => v.trim())
          .join(" ");

        let result;
        if (opts.capture) {
          result = await $.raw`${joined}`.env(env).captureCombined();
          output[joined] = { cmd: c, output: result.combinedBytes };
        } else {
          if (!opts.quiet) {
            console.log(`%c${c}`, "font-weight: bold");
          }
          result = await $.raw`${joined}`.env(env);
        }
        if (result.code != 0) {
          throw new Error(`Aborted with exit code: ${result.code}`);
        }
      }
      return output;
    }
    throw new Error(`unknown runner ${this.runner}`);
  }
}
