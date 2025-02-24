import { cache } from "./cache/mod.ts";
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

class ExitStatus {
  code: number;

  constructor(code: number) {
    this.code = code;
  }
}

const ERRNO_SUCCESS = 0;
const ERRNO_ACCES = 2;
const ERRNO_ADDRINUSE = 3;
const ERRNO_ADDRNOTAVAIL = 4;
const ERRNO_BADF = 8;
const ERRNO_BUSY = 10;
const ERRNO_CONNABORTED = 13;
const ERRNO_CONNREFUSED = 14;
const ERRNO_CONNRESET = 15;
const ERRNO_INTR = 27;
const ERRNO_INVAL = 28;
const ERRNO_NOENT = 44;
const ERRNO_NOTCONN = 53;
const ERRNO_PIPE = 64;
const ERRNO_TIMEDOUT = 73;

function syscall<T extends CallableFunction>(target: T) {
  return function (...args: unknown[]) {
    try {
      return target(...args);
    } catch (err) {
      if (err instanceof ExitStatus) {
        throw err;
      }

      if (!(err instanceof Error)) {
        return ERRNO_INVAL;
      }

      switch (err.name) {
        case "NotFound":
          return ERRNO_NOENT;

        case "PermissionDenied":
          return ERRNO_ACCES;

        case "ConnectionRefused":
          return ERRNO_CONNREFUSED;

        case "ConnectionReset":
          return ERRNO_CONNRESET;

        case "ConnectionAborted":
          return ERRNO_CONNABORTED;

        case "NotConnected":
          return ERRNO_NOTCONN;

        case "AddrInUse":
          return ERRNO_ADDRINUSE;

        case "AddrNotAvailable":
          return ERRNO_ADDRNOTAVAIL;

        case "BrokenPipe":
          return ERRNO_PIPE;

        case "InvalidData":
          return ERRNO_INVAL;

        case "TimedOut":
          return ERRNO_TIMEDOUT;

        case "Interrupted":
          return ERRNO_INTR;

        case "BadResource":
          return ERRNO_BADF;

        case "Busy":
          return ERRNO_BUSY;

        default:
          return ERRNO_INVAL;
      }
    }
  };
}

export async function init(wasmFile: string | ArrayBuffer): Promise<void> {
  if (wasmExports) return;

  // Load the module
  let wasmModule: WebAssembly.Module | undefined;
  if (typeof wasmFile === "string") {
    let filePath: string | URL = wasmFile;
    if (!filePath.startsWith("file:")) {
      const file = await cache(wasmFile);
      filePath = file.path;
    } else {
      filePath = new URL(filePath);
    }
    const wasm = await Deno.readFileSync(filePath);
    if (wasm.buffer.byteLength > 0) {
      wasmModule = await WebAssembly.compile(wasm.buffer);
    } else {
      wasmModule = await WebAssembly.compileStreaming(await fetch(wasmFile));
    }
  } else {
    wasmModule = await WebAssembly.compile(wasmFile);
  }

  // Stub out WASI preview1 imports.
  // astyle does not seem to use them.
  const wasm = await WebAssembly.instantiate(
    wasmModule as BufferSource,
    {
      wasi_snapshot_preview1: {
        "proc_exit": syscall((
          rval: number,
        ): never => {
          throw new ExitStatus(rval);
        }),
        "fd_close": syscall((
          _fd: number,
        ): number => {
          return ERRNO_SUCCESS;
        }),
        "environ_sizes_get": syscall((
          _environcOffset: number,
          _environBufferSizeOffset: number,
        ): number => {
          return ERRNO_SUCCESS;
        }),
        "environ_get": syscall((
          _environOffset: number,
          _environBufferOffset: number,
        ): number => {
          return ERRNO_SUCCESS;
        }),
      },
    },
  );

  // Deno returns a different type than expected.
  // deno-lint-ignore no-explicit-any
  const exports = (wasm as any).exports;
  wasmExports = exports as WasmModuleExports;

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
