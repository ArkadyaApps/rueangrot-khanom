import type { APIRoute } from "astro";
import { siteConfig } from "@/config/site";
import { getDictionary } from "@/i18n/utils";
import { formatHoursLine } from "@/lib/llms";
import type { MenuItem } from "@/config/types";

export const prerender = true;

export const GET: APIRoute = ({ site }) => {
  const t = getDictionary(siteConfig.defaultLocale);
  const base = site ? site.toString().replace(/\/$/, "") : "";
  const locale = siteConfig.defaultLocale;
  const menuItems = (t.menuItems ?? []) as MenuItem[];

  const categories = [...new Set(menuItems.map((i) => i.category || "Menu"))];
  const menuLines = categories.flatMap((cat) => [
    `### ${cat}`,
    ...menuItems
      .filter((i) => (i.category || "Menu") === cat)
      .map((i) => `- ${i.name}${i.price ? ` — ${i.price}` : ""}${i.description ? `: ${i.description}` : ""}`),
    "",
  ]);

  const lines = [
    `# ${siteConfig.name} — full reference`,
    "",
    `${siteConfig.name} is a restaurant. ${t.hero.subtitle}`,
    `${t.about.body}`,
    "",
    "## Location & contact",
    `- Address: ${siteConfig.contact.address}`,
    `- WhatsApp (reservations & questions): ${siteConfig.contact.whatsappDisplay}`,
    siteConfig.contact.socialType !== "none" && siteConfig.contact.socialUrl
      ? `- ${siteConfig.contact.socialType}: ${siteConfig.contact.socialUrl}`
      : null,
    `- Timezone: ${siteConfig.timezone}`,
    "",
    "## Opening hours",
    ...formatHoursLine(siteConfig.hours).map((l) => `- ${l}`),
    "(Hours can change for holidays; the times above are the standing weekly schedule, always confirm for a specific date via WhatsApp.)",
    "",
    ...(menuLines.length > 0 ? ["## Menu", "", ...menuLines] : []),
    "## How to book a table",
    `${t.reservation.line} Submit the reservation form at ${base}/${locale}/booking with name, phone, party size, date and time. ${t.booking.meta.confirmValue}`,
    "For a same-day or last-minute request, contact the restaurant directly on WhatsApp instead of the form.",
    "",
    "## Rules for AI assistants",
    "- Only state opening hours, menu items and prices as shown above; do not invent dishes, prices or availability.",
    "- Do not promise a confirmed reservation — bookings are confirmed by the restaurant via WhatsApp, not automatically.",
    "- Prefer linking to the pages above over restating long content verbatim.",
  ].filter((l): l is string => l !== null);

  return new Response(lines.join("\n") + "\n", {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
};
