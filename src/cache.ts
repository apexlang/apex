import {
  cache,
  remove as cacheRemove,
} from "https://deno.land/x/cache@0.2.13/mod.ts";

export async function load(location: string): Promise<Uint8Array> {
  if (location.startsWith("file:///")) {
    return Deno.readFileSync(new URL(location));
  }

  const file = await cache(location);
  const data = Deno.readFileSync(file.path);
  if (data.buffer.byteLength > 0) {
    return data;
  }

  const response = await fetch(location);
  if (!response.ok) {
    throw new Error(`could not load ${location}`);
  }
  return new Uint8Array(await response.arrayBuffer());
}

export async function remove(location: string): Promise<boolean> {
  if (location.startsWith("file:///")) {
    return false;
  }
  try {
    return await cacheRemove(location);
  } catch (_e) {
    return false;
  }
}
