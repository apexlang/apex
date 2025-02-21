import { asWorker, type ProcessTemplateArgs } from "./config.ts";
import { processTemplateArgs } from "./generate.ts";

const worker = asWorker(self);

worker.onmessage = async (event: MessageEvent<ProcessTemplateArgs>) => {
  try {
    const args = event.data;
    const fsstruct = await processTemplateArgs(args);
    worker.postMessage(fsstruct);
  } catch (e) {
    worker.postMessage({ error: `${e}` });
  }
};
