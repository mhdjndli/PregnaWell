// Unicode-aware: Arabic titles keep their Arabic letters instead of being
// reduced to an empty/transliterated English slug. Diacritics and tatweel are
// stripped so the slug stays stable however the title was typed.
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .normalize("NFC")
    .replace(/['"‘’“”]/g, "")
    .replace(/[ـً-ٰٟ]/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}
