import { defineConfig } from "astro/config";
import cloudflare from "@astrojs/cloudflare";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  output: "server",
  adapter: cloudflare({ platformProxy: { enabled: true } }),
  integrations: [
    react(),
    sitemap({
      // Only real pages — utility endpoints (robots.txt, llms.txt, OG image) aren't pages.
      filter: (page) => !/\/(robots|llms|llms-full)\.txt$/.test(page),
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
    resolve: {
      alias:
        process.env.NODE_ENV === "production"
          ? { "react-dom/server": "react-dom/server.edge" }
          : undefined,
    },
  },
  i18n: {
    defaultLocale: "en",
    locales: ["en", "fr", "th"],
    routing: { prefixDefaultLocale: true, redirectToDefaultLocale: true },
  },
  site: "https://rueangrot-khanom-f10.pages.dev",
});
