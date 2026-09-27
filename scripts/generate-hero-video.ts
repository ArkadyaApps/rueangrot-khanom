// Generates public/videos/hero.mp4: a short, seamlessly looping, silent
// ambient background video for the hero section, rendered from
// scripts/hero-video/ via HyperFrames (github.com/heygen-com/hyperframes).
// Runs in CI (Node + system ffmpeg), never at request time.
import { execFileSync } from "node:child_process";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { siteConfig } from "../src/config/site";
import { extractThemeVars } from "./lib/site-context";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const HYPERFRAMES_VERSION = "0.8.80"; // pinned for reproducible renders

// The hero-video composition takes plain hex color variables. Convert the
// theme's oklch() values with real Chrome so the result is colorimetrically
// correct, rather than approximating the conversion by hand.
async function oklchToHex(oklch: string): Promise<string> {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    // getComputedStyle can hand back oklch(...) notation verbatim on modern
    // Chrome instead of converting it — a <canvas> 2D context always
    // rasterizes to concrete sRGB bytes regardless of the input color space.
    await page.setContent("<canvas id='c' width='1' height='1'></canvas>");
    const hex = await page.evaluate(`(() => {
      const ctx = document.getElementById("c").getContext("2d");
      ctx.fillStyle = ${JSON.stringify(oklch)};
      ctx.fillRect(0, 0, 1, 1);
      const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
      const toHex = (n) => n.toString(16).padStart(2, "0");
      return "#" + toHex(r) + toHex(g) + toHex(b);
    })()`);
    return hex as string;
  } finally {
    await browser.close();
  }
}

async function main() {
  const vars = extractThemeVars(root, siteConfig.theme);
  const [bg, accent, gold] = await Promise.all([
    oklchToHex(vars["color-bg"]),
    oklchToHex(vars["color-accent"]),
    oklchToHex(vars["color-gold"]),
  ]);

  const compositionDir = resolve(root, "scripts/hero-video");
  const outputPath = resolve(root, "public/videos/hero.mp4");

  execFileSync(
    "npx",
    [
      "--yes",
      `hyperframes@${HYPERFRAMES_VERSION}`,
      "render",
      compositionDir,
      "--variables",
      JSON.stringify({ bg, accent, gold }),
      "--output",
      outputPath,
      "--crf",
      "30",
      "--strict-variables",
    ],
    { stdio: "inherit" }
  );

  console.log(`Generated public/videos/hero.mp4 (theme: ${siteConfig.theme}, bg: ${bg}, accent: ${accent}, gold: ${gold})`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
