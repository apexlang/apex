import { asWorker } from "./config.ts";
import { importTemplate } from "./generate.ts";

const worker = asWorker(self);

worker.onmessage = async (event: MessageEvent<string>) => {
  try {
    const output = await importTemplate(event.data);
    // Functions do not serialize so null it out.
    // deno-lint-ignore no-explicit-any
    (output as any).process = null;
    worker.postMessage(output);
  } catch (e) {
    worker.postMessage({ error: `${e}` });
  }
};
