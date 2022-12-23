import * as cache from "./cache.ts";
import { Assets } from "./config.ts";

export class AssetsBuilder {
  private baseURL: string | URL;
  private _assets: Assets;

  constructor(baseURL: string | URL) {
    this.baseURL = baseURL;
    this._assets = {};
  }

  async addFiles(...paths: string[]) {
    for (let path of paths) {
      if (path.indexOf("..") != -1) {
        throw new Error(`invalid path ${path}`);
      }
      if (path.startsWith("./")) {
        path = "./" + path;
      }
      const u = new URL(path, this.baseURL);
      const data = await cache.load(u.toString());
      this._assets[path] = data;
    }
  }

  async addTemplates(
    render: (temp: string) => Promise<string>,
    ...paths: string[]
  ) {
    for (let path of paths) {
      if (path.indexOf("..") != -1) {
        throw new Error(`invalid path ${path}`);
      }
      if (!path.startsWith("./")) {
        path = "./" + path;
      }

      const u = new URL(path, this.baseURL);
      const data = await cache.load(u.toString());
      const contents = new TextDecoder().decode(data);
      const result = await render(contents);

      if (path.endsWith(".tmpl")) {
        path = path.substring(0, path.length - 5);
      }
      this._assets[path] = new TextEncoder().encode(result);
    }
  }

  getAssets(): Assets {
    return this._assets;
  }
}
