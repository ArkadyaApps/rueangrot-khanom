// Generates public/images/og.png: a 1200x630 branded share image with a QR
// code linking to the live site. Runs in CI (Node), never at request time —
// the Cloudflare Worker runtime can't launch a browser.
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import QRCode from "qrcode";
import jsQR from "jsqr";
import { PNG } from "pngjs";
import { siteConfig } from "../src/config/site";
import { loadSiteUrl, loadHeroCopy, extractThemeVars } from "./lib/site-context";

const root = dirname(dirname(fileURLToPath(import.meta.url)));

async function verifyQrDecodes(png: Buffer, expected: string) {
  const decoded = PNG.sync.read(png);
  const result = jsQR(new Uint8ClampedArray(decoded.data), decoded.width, decoded.height);
  if (!result || result.data !== expected) {
    throw new Error(`Generated QR code failed to decode back to "${expected}" (got: ${result?.data ?? "nothing"})`);
  }
}

async function main() {
  const siteUrl = await loadSiteUrl(root);
  const { eyebrow, subtitle } = loadHeroCopy(root);
  const vars = extractThemeVars(root, siteConfig.theme);

  const qrPng = await QRCode.toBuffer(siteUrl, { type: "png", margin: 2, width: 220, color: { dark: "#1a1a1a", light: "#ffffff" } });
  await verifyQrDecodes(qrPng, siteUrl);
  const qrDataUri = `data:image/png;base64,${qrPng.toString("base64")}`;

  const html = `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="${siteConfig.fonts.googleFontsUrl}" rel="stylesheet" />
<style>
  :root {
    --color-bg: ${vars["color-bg"]};
    --color-accent: ${vars["color-accent"]};
    --color-accent-deep: ${vars["color-accent-deep"]};
    --color-gold: ${vars["color-gold"]};
    --color-gold-soft: ${vars["color-gold-soft"]};
    --color-fg: ${vars["color-fg"]};
    --color-fg-muted: ${vars["color-fg-muted"]};
    --font-display: ${vars["theme-font-display"]};
    --font-body: ${vars["theme-font-body"]};
  }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { width: 1200px; height: 630px; overflow: hidden; }
  body {
    font-family: var(--font-body);
    background:
      radial-gradient(ellipse at 15% 20%, color-mix(in oklch, var(--color-accent) 55%, transparent), transparent 60%),
      radial-gradient(ellipse at 85% 85%, color-mix(in oklch, var(--color-accent-deep) 50%, transparent), transparent 65%),
      var(--color-bg);
    color: var(--color-fg);
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 88px 96px;
    position: relative;
  }
  .eyebrow {
    font-family: var(--font-body);
    font-size: 20px;
    letter-spacing: 0.3em;
    text-transform: uppercase;
    color: var(--color-gold);
    margin-bottom: 28px;
  }
  h1 {
    font-family: var(--font-display);
    font-style: italic;
    font-size: 88px;
    line-height: 1.05;
    color: var(--color-gold-soft);
    max-width: 820px;
  }
  p.tagline {
    margin-top: 28px;
    font-size: 26px;
    font-weight: 300;
    color: var(--color-fg-muted);
    max-width: 640px;
    line-height: 1.4;
  }
  .qr {
    position: absolute;
    right: 96px;
    bottom: 80px;
    display: flex;
    align-items: center;
    gap: 16px;
  }
  .qr img { width: 132px; height: 132px; border-radius: 8px; background: #fff; padding: 8px; }
  .qr span {
    font-size: 15px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--color-fg-muted);
    max-width: 90px;
    line-height: 1.4;
  }
</style>
</head>
<body>
  <p class="eyebrow">${eyebrow}</p>
  <h1>${siteConfig.name}</h1>
  <p class="tagline">${subtitle}</p>
  <div class="qr">
    <img src="${qrDataUri}" alt="" />
    <span>Scan to visit</span>
  </div>
</body>
</html>`;

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
  await page.setContent(html, { waitUntil: "networkidle" });
  await page.screenshot({ path: resolve(root, "public/images/og.png") });
  await browser.close();

  console.log(`Generated public/images/og.png for ${siteUrl}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
