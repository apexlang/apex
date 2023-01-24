import {
  assert,
  assertEquals,
} from "https://deno.land/std@0.171.0/testing/asserts.ts";
import { runApex } from "./run-apex.ts";

Deno.test(
  "apex new works with git HTTPS urls",
  { permissions: { read: true, run: true, env: true, write: true } },
  async () => {
    const tmpDir = await Deno.makeTempDir();
    const _output = await runApex([
      "new",
      "https://github.com/apexlang/codegen.git",
      "-p",
      "templates/generator",
      tmpDir,
    ]);
    const files = Array.from(Deno.readDirSync(tmpDir));
    assert(files.length > 1);
  },
);

Deno.test(
  "apex new works with git SSH urls",
  { permissions: { read: true, run: true, env: true, write: true } },
  async () => {
    const tmpDir = await Deno.makeTempDir();
    const _output = await runApex([
      "new",
      "git@github.com:apexlang/codegen.git",
      "-p",
      "templates/generator",
      tmpDir,
    ]);
    const files = Array.from(Deno.readDirSync(tmpDir));
    assert(files.length > 1);
  },
);

Deno.test(
  "apex new works with local git paths",
  { permissions: { read: true, run: true, env: true, write: true } },
  async () => {
    const tmpDir = await Deno.makeTempDir();
    const _output = await runApex([
      "new",
      ".",
      "-p",
      "test/template",
      tmpDir,
    ]);
    const files = Array.from(Deno.readDirSync(tmpDir));
    assertEquals(files.length, 2);
  },
);
