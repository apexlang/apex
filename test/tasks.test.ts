import { assertEquals } from "../deps/@std/assert/mod.ts";
import { loadTasks, parseTasks } from "../src/commands/run.ts";
import { Task, TaskRunner } from "../src/task.ts";
import * as path from "../deps/@std/path/mod.ts";
import { setupLogger } from "../src/utils.ts";

const __dirname = new URL(".", import.meta.url).pathname;
const plugin = path.join(__dirname, "test-plugin.ts");
await setupLogger("DEBUG");

Deno.test(
  "tasks from plugin don't override original tasks",
  async () => {
    const tasks = await loadTasks({
      plugins: [plugin],
      tasks: {
        // note: the extra whitespace in 'build ' is intentional.
        "build ": { cmds: [`echo "original"`], deps: ["dep"] },
        "dep ": {},
      },
    }, { reload: false });

    assertEquals(tasks, {
      "build": new Task({
        cmds: [`echo "original"`],
        deps: [
          "dep",
        ],
        runner: TaskRunner.Dax,
      }),
      "dep": new Task({
        cmds: [],
        deps: [],
        runner: TaskRunner.Dax,
      }),
    });
  },
);

Deno.test(
  "run explicit",
  async () => {
    const tasks = await parseTasks({
      spec: "",
      tasks: { "start": { cmds: ["echo a", "echo b"] } },
    });

    assertEquals(tasks, {
      "start": new Task({
        cmds: ["echo a", "echo b"],
        deps: [],
        runner: TaskRunner.Dax,
      }),
    });
  },
);
