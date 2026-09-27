import type { APIRoute } from "astro";
import { siteConfig } from "@/config/site";
import { getDictionary } from "@/i18n/utils";
import { formatHoursLine } from "@/lib/llms";

export const prerender = true;

export const GET: APIRoute = ({ site }) => {
  const t = getDictionary(siteConfig.defaultLocale);
  const base = site ? site.toString().replace(/\/$/, "") : "";
  const locale = siteConfig.defaultLocale;

  const lines = [
    `# ${siteConfig.name}`,
    "",
    `> ${t.hero.subtitle}`,
    "",
    "## Key facts",
    `- Address: ${siteConfig.contact.address}`,
    `- WhatsApp: ${siteConfig.contact.whatsappDisplay}`,
    ...formatHoursLine(siteConfig.hours).map((l) => `- ${l}`),
    "",
    "## Pages",
    `- Home: ${base}/${locale}/`,
    `- Menu: ${base}/${locale}/menu`,
    `- Reservations: ${base}/${locale}/booking`,
    `- Contact: ${base}/${locale}/contact`,
    "",
    `More detail: ${base}/llms-full.txt`,
  ];

  return new Response(lines.join("\n") + "\n", {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
};
