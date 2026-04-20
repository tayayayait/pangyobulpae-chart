const KST_TIME_ZONE = "Asia/Seoul";

function getDatePart(parts: Intl.DateTimeFormatPart[], type: "year" | "month" | "day"): string {
  return parts.find((part) => part.type === type)?.value || "";
}

export function getCurrentKstDateIso(now: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: KST_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const year = getDatePart(parts, "year");
  const month = getDatePart(parts, "month");
  const day = getDatePart(parts, "day");
  return `${year}-${month}-${day}`;
}

export function formatSlideDateShortFromIso(dateIso: string): string {
  const match = dateIso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return dateIso;
  const [, year, month, day] = match;
  return `${year.slice(-2)}.${Number(month)}.${day}`;
}

export function getCurrentKstSlideDateShort(now: Date = new Date()): string {
  return formatSlideDateShortFromIso(getCurrentKstDateIso(now));
}
