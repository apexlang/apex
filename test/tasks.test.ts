import { assertEquals } from "https://deno.land/std@0.171.0/testing/asserts.ts";
import { parseTasks } from "../src/commands/run.ts";
import { Task, TaskRunner } from "../src/task.ts";

Deno.test(
  "run task array shorthand",
  async () => {
    const tasks = await parseTasks({
      spec: "",
      tasks: { start: [`echo "test"`] },
    });

    assertEquals(tasks, {
      "start": new Task({
        cmds: [`echo "test"`],
        deps: [],
        runner: TaskRunner.Dax,
      }),
    });
  },
);

Deno.test(
  "run a > b shorthand",
  async () => {
    const tasks = await parseTasks({
      spec: "",
      tasks: { "start > a b c": [`echo "test"`], a: [], b: [], c: [] },
    });

    assertEquals(tasks, {
      "start": new Task({
        cmds: [`echo "test"`],
        deps: ["a", "b", "c"],
        runner: TaskRunner.Dax,
      }),
      "a": new Task({
        cmds: [],
        deps: [],
        runner: TaskRunner.Dax,
      }),
      "b": new Task({
        cmds: [],
        deps: [],
        runner: TaskRunner.Dax,
      }),
      "c": new Task({
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

Deno.test(
  "run combo",
  async () => {
    const tasks = await parseTasks({
      spec: "",
      tasks: {
        "start > a b": { cmds: ["echo a", "echo b"], deps: ["c"] },
        a: [],
        b: [],
        c: [],
      },
    });

    assertEquals(tasks, {
      "start": new Task({
        cmds: ["echo a", "echo b"],
        deps: ["a", "b", "c"],
        runner: TaskRunner.Dax,
      }),
      "a": new Task({
        cmds: [],
        deps: [],
        runner: TaskRunner.Dax,
      }),
      "b": new Task({
        cmds: [],
        deps: [],
        runner: TaskRunner.Dax,
      }),
      "c": new Task({
        cmds: [],
        deps: [],
        runner: TaskRunner.Dax,
      }),
    });
  },
);
