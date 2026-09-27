import type { APIRoute } from "astro";

export const prerender = true;

// AI assistant crawlers are allowed by name so the restaurant can be found and
// summarized correctly by chat-based search, not just classic web search.
const AI_CRAWLERS = [
  "GPTBot",
  "ChatGPT-User",
  "ClaudeBot",
  "anthropic-ai",
  "PerplexityBot",
  "Google-Extended",
  "Applebot-Extended",
];

export const GET: APIRoute = ({ site }) => {
  const lines = [
    "User-agent: *",
    "Allow: /",
    "Disallow: /api/",
    "",
    ...AI_CRAWLERS.flatMap((bot) => [`User-agent: ${bot}`, "Allow: /", ""]),
    `Sitemap: ${new URL("sitemap-index.xml", site)}`,
  ];

  return new Response(lines.join("\n") + "\n", {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
};
