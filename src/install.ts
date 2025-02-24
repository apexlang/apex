import * as log from "../deps/@std/log/mod.ts";

import { getTemplateInfo, ProcessOptions, processTemplate } from "./process.ts";
import { makeRelativeUrl } from "./utils.ts";
import * as cache from "./cache.ts";
import { TemplateMap } from "./config.ts";

export async function installTemplate(
  registry: TemplateMap,
  location: string,
  options: ProcessOptions,
) {
  if (location.startsWith("jsr:")) {
    let pkg = location.substring(4);

    // Resolve latest version if not specified
    if (!/@\d+\.\d+\.\d+/.test(pkg)) {
      while (pkg.startsWith("/")) {
        pkg = pkg.substring(1);
      }
      const parts = pkg.split("/");
      if (parts.length < 2) {
        throw new Error(`Invalid JSR location: ${location}`);
      }
      pkg = parts[0] + "/" + parts[1];
      const metaURL = "https://jsr.io/" + pkg + "/meta.json";
      const meta = await (await fetch(metaURL)).json();
      log.info(`Latest version of ${location} is ${meta.latest}`);
      pkg = pkg += "@" + meta.latest;
      for (let i = 2; i < parts.length; i++) {
        pkg += "/" + parts[i];
      }
    }

    pkg = "@" + pkg.substring(1).replace("@", "/");
    const parts = pkg.split("/");
    if (parts.length < 3) {
      throw new Error(`Invalid JSR location: ${pkg}`);
    }
    let relativeImport = ".";
    for (let i = 3; i < parts.length; i++) {
      relativeImport += "/" + parts[i];
    }

    const slug = parts[0] + "/" + parts[1] + "/" +
      parts[2];
    const jsrURL = "https://jsr.io/" + slug + "/jsr.json";
    const jsr = await (await fetch(jsrURL)).json();

    location = "https://jsr.io/" + slug;
    const relativePath = jsr.exports[relativeImport];
    if (!relativePath) {
      throw new Error(`Module is missing export: ${relativeImport}`);
    }
    if (relativePath.length > 1) {
      location += relativePath.substring(1);
    }
  }

  const url = makeRelativeUrl(location);

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

        const download = new URL(path, url);
        try {
          await cache.load(download.toString());
        } catch (e) {
          log.warn(`Could not load ${download.toString()}: ${e}`);
        }
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
          const download = new URL(path, url);
          try {
            await cache.load(download.toString());
          } catch (e) {
            log.warn(`Could not load ${download.toString()}: ${e}`);
          }
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
