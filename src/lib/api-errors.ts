/**
 * Keeps internal error details out of API responses in production.
 *
 * Services throw short UPPER_SNAKE_CASE codes for expected failures
 * (e.g. "EQUIPMENT_NOT_FOUND"); those are safe to return. Anything else
 * (driver errors, stack-derived text, connection strings...) is logged
 * server-side and replaced with a generic message in production.
 */
export function publicErrorMessage(message: string): string {
  if (/^[A-Z][A-Z0-9_]+$/.test(message)) return message;
  if (process.env.NODE_ENV !== "production") return message;
  console.error("[api] Unhandled error:", message);
  return "Internal server error";
}
