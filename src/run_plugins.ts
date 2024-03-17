import { asWorker, Configuration, WorkerArgs } from "./config.ts";
import { processPlugins } from "./generate.ts";

const worker = asWorker(self);

worker.onmessage = async (event: MessageEvent<WorkerArgs<Configuration>>) => {
  try {
    const args = event.data;
    const output = await processPlugins(args.config);
    worker.postMessage(output);
  } catch (e) {
    worker.postMessage({ error: `${e}` });
  }
};
