import type { SiteConfig, DayKey } from "@/config/types";

const DAY_ORDER: { key: DayKey; label: string }[] = [
  { key: "monday", label: "Monday" },
  { key: "tuesday", label: "Tuesday" },
  { key: "wednesday", label: "Wednesday" },
  { key: "thursday", label: "Thursday" },
  { key: "friday", label: "Friday" },
  { key: "saturday", label: "Saturday" },
  { key: "sunday", label: "Sunday" },
];

export function formatHoursLine(hours: SiteConfig["hours"]): string[] {
  return DAY_ORDER.map(({ key, label }) => {
    const day = hours[key];
    return day ? `${label}: ${day.open}–${day.close}` : `${label}: Closed`;
  });
}
