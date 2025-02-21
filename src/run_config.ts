import { asWorker, type Configuration, type WorkerArgs } from "./config.ts";
import { processConfig } from "./generate.ts";

const worker = asWorker(self);

worker.onmessage = async (event: MessageEvent<WorkerArgs<Configuration>>) => {
  try {
    const args = event.data;
    const output = await processConfig(args.config, args.options.scaffold);
    worker.postMessage(output);
  } catch (e) {
    worker.postMessage({ error: `${e}` });
  }
};
