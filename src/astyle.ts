import { default as WASI } from "https://deno.land/std@0.167.0/wasi/snapshot_preview1.ts";
import { cache } from "https://deno.land/x/cache@0.2.13/mod.ts";
import { decode, encode } from "./utf8.ts";

interface WasmModuleExports {
  memory: WebAssembly.Memory;
  _initialize: () => void;
  alloc_buffer: (size: number) => number;
  free_buffer: (buffer: number) => number;
  wastyle: (
    codePointer: number,
    optionsPointer: number,
    resultPointerPointer: number,
  ) => number;
}

let wasmExports: WasmModuleExports;

export function isInitialized(): boolean {
  return wasmExports != undefined;
}

export async function init(wasmFile: string | ArrayBuffer): Promise<void> {
  if (wasmExports) return;

  // Load the module
  let wasmModule: WebAssembly.Module | undefined;
  if (typeof wasmFile === "string") {
    const file = await cache(wasmFile);
    const wasm = await Deno.readFileSync(file.path);
    if (wasm.buffer.byteLength > 0) {
      wasmModule = await WebAssembly.compile(wasm.buffer);
    } else {
      wasmModule = await WebAssembly.compileStreaming(await fetch(wasmFile));
    }
  } else {
    wasmModule = await WebAssembly.compile(wasmFile);
  }

  // Load WASI and start the module
  const wasi = new WASI({
    args: [],
    env: {},
  });

  const wasm = await WebAssembly.instantiate(wasmModule!, {
    wasi_snapshot_preview1: wasi.exports,
  });

  wasmExports = (wasm.exports as unknown) as WasmModuleExports;

  wasmExports._initialize(); // C++ initialization
}

function writeEncodedString(
  str: Uint8Array,
  memory: WebAssembly.Memory,
  pointer: number,
) {
  const array = new Uint8Array(memory.buffer, pointer, str.byteLength + 1);
  for (let i = 0; i < str.length; i++) array[i] = str[i];
  array[str.length] = 0;
}

function readInt32(memory: WebAssembly.Memory, pointer: number) {
  const array = new Uint32Array(memory.buffer, pointer, 1);
  return array[0];
}

function readString(memory: WebAssembly.Memory, pointer: number) {
  let array = new Uint8Array(memory.buffer, pointer);
  let length = 0;
  while (array[length] !== 0) length++;

  if (length === 0) return "";

  array = new Uint8Array(memory.buffer, pointer, length);
  return decode(array);
}

export function format(code: string, options: string): [boolean, string] {
  if (!wasmExports) {
    throw new Error(
      "Please call init() to load the WASM AStyle library first.",
    );
  }

  const encodedCode = encode(code);
  const encodedOptions = encode(options);

  // code + options + result buffer address
  const bufferSize = encodedCode.byteLength + 1 +
    (encodedOptions.byteLength + 1) + 4;

  const bufferPointer = wasmExports.alloc_buffer(bufferSize);

  const resultBufferPointerBufferPointer = bufferPointer;
  const codePointer = resultBufferPointerBufferPointer + 4;
  const optionsPointer = codePointer + (encodedCode.byteLength + 1);

  writeEncodedString(encodedCode, wasmExports.memory, codePointer);
  writeEncodedString(encodedOptions, wasmExports.memory, optionsPointer);

  const success = !!wasmExports.wastyle(
    codePointer,
    optionsPointer,
    resultBufferPointerBufferPointer,
  );

  const resultBufferPointer = readInt32(
    wasmExports.memory,
    resultBufferPointerBufferPointer,
  );
  const result = readString(wasmExports.memory, resultBufferPointer);

  wasmExports.free_buffer(bufferPointer);

  if (resultBufferPointer) wasmExports.free_buffer(resultBufferPointer);

  return [success, result];
}
