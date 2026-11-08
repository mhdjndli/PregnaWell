import type { Locale } from "./i18n";

export function formatDate(iso: string | null | undefined, locale: Locale = "en"): string {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString(locale === "ar" ? "ar" : "en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return String(iso);
  }
}

// "45s", "2m 05s". Used for GA engagement times (seconds).
export function formatDuration(seconds: number): string {
  if (!seconds) return "0s";
  const s = Math.round(seconds);
  return s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${String(s % 60).padStart(2, "0")}s`;
}
