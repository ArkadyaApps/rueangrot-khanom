// Shared helpers for build-time asset scripts (OG image, hero video): the
// site's real deploy URL, its hero copy, and its resolved theme CSS variables.
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { siteConfig } from "../../src/config/site";

export async function loadSiteUrl(root: string): Promise<string> {
  const configPath = resolve(root, "astro.config.mjs");
  const mod = await import(pathToFileURL(configPath).href);
  const site = mod.default?.site;
  if (!site) throw new Error("astro.config.mjs has no `site` set — cannot build a QR code or absolute asset URL");
  return site;
}

export function loadHeroCopy(root: string): { eyebrow: string; subtitle: string } {
  const dictPath = resolve(root, "src/i18n", `${siteConfig.defaultLocale}.json`);
  const dict = JSON.parse(readFileSync(dictPath, "utf-8"));
  return {
    eyebrow: dict.hero?.eyebrow ?? siteConfig.name,
    subtitle: dict.hero?.subtitle ?? siteConfig.name,
  };
}

export function extractThemeVars(root: string, theme: string): Record<string, string> {
  const css = readFileSync(resolve(root, "src/styles/themes.css"), "utf-8");
  const selector = `[data-theme="${theme}"]`;
  const start = css.indexOf(selector);
  if (start === -1) throw new Error(`Theme "${theme}" not found in themes.css`);
  const openBrace = css.indexOf("{", start);
  const closeBrace = css.indexOf("}", openBrace);
  const block = css.slice(openBrace + 1, closeBrace);
  const vars: Record<string, string> = {};
  for (const line of block.split(";")) {
    const match = line.match(/--([\w-]+)\s*:\s*([^;]+)/);
    if (match) vars[match[1]] = match[2].trim();
  }
  return vars;
}
