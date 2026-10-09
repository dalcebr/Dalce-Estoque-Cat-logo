const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Returns true when `s` is a valid v4-style UUID (any version nibble accepted). */
export function isValidUUID(s: string): boolean {
  return UUID_RE.test(s);
}

/**
 * Trims, collapses whitespace, strips control characters and HTML-dangerous
 * characters (< > &) that could lead to stored XSS, then truncates.
 */
export function sanitizeText(s: string, maxLen: number): string {
  return s
    .trim()
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "") // strip control chars
    .replace(/[<>&]/g, "")                                // prevent XSS in stored text
    .replace(/\s+/g, " ")                                 // collapse whitespace
    .slice(0, maxLen);
}

/**
 * Like `sanitizeText`, but preserves line breaks and paragraphs.
 *
 * Normalises CRLF/CR to LF, collapses runs of spaces/tabs (but not newlines),
 * limits consecutive blank lines to one (so a paragraph break is a single
 * empty line), strips control characters and HTML-dangerous characters
 * (< > &), then truncates.
 */
export function sanitizeMultiline(s: string, maxLen: number): string {
  return s
    .replace(/\r\n?/g, "\n")                              // normalise line endings
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")    // strip control chars (keeps \n and \t)
    .replace(/[<>&]/g, "")                                // prevent XSS in stored text
    .replace(/[^\S\n]+/g, " ")                            // collapse spaces/tabs, keep newlines
    .replace(/ *\n */g, "\n")                             // trim spaces around line breaks
    .replace(/\n{3,}/g, "\n\n")                           // at most one blank line between paragraphs
    .trim()
    .slice(0, maxLen);
}

/**
 * Parses a decimal string, accepting the Brazilian `1.234,56` format as well
 * as the standard `1234.56` format. Returns null for any non-finite result.
 */
export function parseDecimal(s: string): number | null {
  const cleaned = s.trim().replace(/\./g, "").replace(",", ".");
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

/** Parses a positive integer (>= 1). Returns null for anything else. */
export function parsePosInt(s: string): number | null {
  const n = Number(s.trim());
  return Number.isInteger(n) && n >= 1 ? n : null;
}

/**
 * Normalises a slug: lowercases, removes accents, replaces non-alphanumeric
 * runs with `-`, trims leading/trailing dashes, and truncates.
 */
export function sanitizeSlug(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 30);
}

/** Validates that a payment method string is one of the known values. */
const PAYMENT_METHODS = new Set([
  "dinheiro", "pix", "debito", "credito", "fiado", "outro",
]);
export function isValidPaymentMethod(s: string): boolean {
  return PAYMENT_METHODS.has(s);
}
