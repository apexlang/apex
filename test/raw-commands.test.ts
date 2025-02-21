import { assertEquals } from "@std/assert";
import { runApex } from "./run-apex.ts";

// Deno.test(
//   "apex new works with git HTTPS urls",
//   { permissions: { read: true, run: true, env: true, write: true } },
//   async () => {
//     const tmpDir = await Deno.makeTempDir();
//     const _output = await runApex([
//       "new",
//       "https://github.com/apexlang/apex.git",
//       "-p",
//       "test/template",
//       tmpDir,
//     ]);
//     const files = Array.from(Deno.readDirSync(tmpDir));
//     assertEquals(files.length, 2);
//   },
// );

// Deno.test(
//   "apex new works with git SSH urls",
//   { permissions: { read: true, run: true, env: true, write: true } },
//   async () => {
//     const tmpDir = await Deno.makeTempDir();
//     const _output = await runApex([
//       "new",
//       "git@github.com:apexlang/apex.git",
//       "-p",
//       "test/template",
//       tmpDir,
//     ]);
//     const files = Array.from(Deno.readDirSync(tmpDir));
//     assertEquals(files.length, 2);
//   },
// );

// Deno.test(
//   "apex new works with local git paths",
//   { permissions: { read: true, run: true, env: true, write: true } },
//   async () => {
//     const tmpDir = await Deno.makeTempDir();
//     const _output = await runApex([
//       "new",
//       ".",
//       "-p",
//       "test/template",
//       tmpDir,
//     ]);
//     const files = Array.from(Deno.readDirSync(tmpDir));
//     assertEquals(files.length, 2);
//   },
// );

Deno.test(
  "apex new works with programmatic templates",
  { permissions: { read: true, run: true, env: true, write: true } },
  async () => {
    const tmpDir = await Deno.makeTempDir();
    const _output = await runApex([
      "new",
      "--var",
      "test=test",
      "https://raw.githubusercontent.com/apexlang/apex/main/test/template/template.ts",
      tmpDir,
    ]);
    const files = Array.from(Deno.readDirSync(tmpDir));
    assertEquals(files.length, 2);
  },
);
