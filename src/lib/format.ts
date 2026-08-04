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
