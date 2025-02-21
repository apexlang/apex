import * as log from "@std/log";

import {
  getTemplateInfo,
  type ProcessOptions,
  processTemplate,
} from "./process.ts";
import { makeRelativeUrl } from "./utils.ts";
import * as cache from "./cache.ts";
import type { TemplateMap } from "./config.ts";

export async function installTemplate(
  registry: TemplateMap,
  location: string,
  options: ProcessOptions,
) {
  let url = makeRelativeUrl(location);

  // Determine if URL redirects and possible use the
  // location with the version included (e.g. deno.land/x).
  if (["http:", "https:"].indexOf(url.protocol) != -1) {
    const resp = await fetch(url);
    if (resp.redirected) {
      url = new URL(resp.url);
    }
  }

  const module = await getTemplateInfo(url.toString());
  if (module.info) {
    // Cache possible files
    const structure = await processTemplate(url.toString(), {
      cache: true,
    });

    if (structure) {
      log.info(`Installing ${module.info.name}...`);
      registry[module.info.name] = {
        ...module.info,
        url: url.toString(),
      };

      const files = structure.files || [];
      for (let path of files) {
        if (path.indexOf("..") != -1) {
          throw new Error(`invalid path ${path}`);
        }
        if (!path.startsWith("./")) {
          path = "./" + path;
        }
        await cache.load(new URL(path, url).toString());
      }

      const templates = structure.templates || {};
      for (const engine of Object.keys(templates)) {
        const files = templates[engine] || [];
        for (let path of files) {
          if (path.indexOf("..") != -1) {
            throw new Error(`invalid path ${path}`);
          }
          if (!path.startsWith("./")) {
            path = "./" + path;
          }
          await cache.load(new URL(path, url).toString());
        }
      }
    }
  }

  const templates = module.templates || [];
  for (let template of templates) {
    if (template.indexOf("..") != -1) {
      throw new Error(`invalid template path ${template}`);
    }
    if (!template.startsWith("./")) {
      template = "./" + template;
    }
    const nestedURL = new URL(template, url);
    await installTemplate(registry, nestedURL.toString(), options);
  }
}
