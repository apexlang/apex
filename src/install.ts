import * as log from "https://deno.land/std@0.171.0/log/mod.ts";

import { getTemplateInfo, processTemplate } from "./process.ts";
import { makeRelativeUrl } from "./utils.ts";
import * as cache from "./cache.ts";
import { FSStructure, TemplateMap } from "./config.ts";

export async function installTemplate(
  registry: TemplateMap,
  location: string,
) {
  const url = makeRelativeUrl(location);

  const module = await getTemplateInfo(url.toString());
  if (module.info) {
    log.info(`Installing ${module.info.name}...`);
    registry[module.info.name] = {
      ...module.info,
      url: url.toString(),
    };

    // Cache possible files
    let structure: FSStructure | undefined;
    try {
      structure = await processTemplate(url.toString(), {
        "cache": true,
      });
    } catch (_err) {
      // Ignore
    }

    if (structure) {
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
    await installTemplate(registry, nestedURL.toString());
  }
}
