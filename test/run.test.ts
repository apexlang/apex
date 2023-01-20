import {
  assert,
  assertEquals,
} from "https://deno.land/std@0.171.0/testing/asserts.ts";
import { runTasks } from "../src/commands/run.ts";
import { Task } from "../src/task.ts";
const __dirname = new URL(".", import.meta.url).pathname;

async function runFixture(
  config: string,
  task: string,
  env: Record<string, string> = {},
): Promise<Uint8Array> {
  const proc = Deno.run({
    env,
    stderr: "inherit",
    stdout: "piped",
    cmd: [
      "deno",
      "run",
      "--allow-all",
      "--unstable",
      "./apex.ts",
      "run",
      "--config",
      config,
      "--quiet",
      task,
    ],
  });
  const out = await proc.output();
  await proc.close();
  return out;
}

function doTest(def: TestDef) {
  Deno.test(
    `apex run -c ${def.fixture} ${def.task}`,
    { permissions: { read: true, run: true, env: true, net: true } },
    async () => {
      const output = await runFixture(def.fixture, def.task, def.env);
      assertEquals(new TextDecoder().decode(output), def.expected);
    },
  );
}

function strEnc(str: string): Uint8Array {
  return new TextEncoder().encode(str);
}

Deno.test(
  "no tasks defined",
  async () => {
    const output = await runTasks({ spec: "" }, {}, []);
    assert(true, "should not throw");
  },
);

Deno.test(
  "basic echo",
  { permissions: { read: true, run: true, env: true } },
  async () => {
    const output = await new Task({ cmds: ["echo Howdy"] }).run({
      capture: true,
    })!;
    assertEquals(output, {
      "echo Howdy": {
        cmd: "echo Howdy",
        output: new TextEncoder().encode("Howdy\n"),
      },
    });
  },
);

Deno.test(
  "shell exec",
  { permissions: { read: true, run: true, env: true } },
  async () => {
    const output = await new Task({ cmds: ["sh -c 'echo Test'"] }).run({
      capture: true,
    })!;
    assertEquals(output, {
      "sh -c 'echo Test'": {
        cmd: "sh -c 'echo Test'",
        output: strEnc("Test\n"),
      },
    });
  },
);

Deno.test(
  "not found",
  { permissions: { read: true, run: true, env: true } },
  async () => {
    try {
      const output = await new Task({ cmds: ["DOES_NOT_EXIST"] }).run()!;
      assert(false, "should throw");
    } catch {}
  },
);

interface TestDef {
  fixture: string;
  task: string;
  expected: string;
  env?: Record<string, string>;
}

const tests: TestDef[] = [
  {
    fixture: "test/fixtures/task-hello-world.yaml",
    task: "test",
    expected: "Hello World\n",
  },
  {
    fixture: "test/fixtures/task-deps.yaml",
    task: "test",
    expected: "From b\nHello World\n",
  },
  {
    fixture: "test/fixtures/task-explicit.yaml",
    task: "test",
    expected: "From b\nHello World\n",
  },
  {
    fixture: "test/fixtures/task-refs.yaml",
    task: "test",
    expected: "From c\nHello World\n",
  },
  {
    fixture: "test/fixtures/task-env-vars.yaml",
    task: "test",
    expected: "Hello World\n",
    env: {
      NAME: "World",
    },
  },
  {
    fixture: "test/fixtures/task-apex-env.yaml",
    task: "test",
    expected: "My spec is my-spec.yaml and some_val is 12345\n",
  },
];

tests.forEach(doTest);
