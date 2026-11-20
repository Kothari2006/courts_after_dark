/**
 * Centralised, lazily-validated environment access.
 *
 * Values are read on demand (not at import time) so `next build` can run
 * without secrets, while a missing variable at runtime fails with a message
 * that says exactly what to set and where.
 */

type RequiredKey = "MONGODB_URI" | "AUTH_SECRET";

const HINTS: Record<RequiredKey, string> = {
  MONGODB_URI:
    "MongoDB connection string. Use a hosted database such as MongoDB Atlas in production (mongodb+srv://...).",
  AUTH_SECRET: "Session signing secret. Generate one with `openssl rand -base64 32`.",
};

export function requireEnv(key: RequiredKey): string {
  const value =
    key === "AUTH_SECRET"
      ? process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET
      : process.env[key];

  if (!value) {
    throw new Error(
      `[env] Missing required environment variable ${key}. ${HINTS[key]} ` +
        `Locally add it to .env.local; on Vercel add it under Project Settings -> Environment Variables and redeploy. See .env.example.`
    );
  }
  return value;
}

/** True when running a production build/server on a hosted platform. */
export const isProduction = process.env.NODE_ENV === "production";

/**
 * Guards against the most common deployment mistake: pointing a hosted
 * deployment at a local MongoDB that does not exist in the serverless runtime.
 */
export function assertDatabaseReachableFromHost(uri: string): void {
  const onVercel = !!process.env.VERCEL;
  if (onVercel && /^mongodb:\/\/(localhost|127\.0\.0\.1|\[::1\])/i.test(uri)) {
    throw new Error(
      "[env] MONGODB_URI points to a local MongoDB (localhost/127.0.0.1), which is not reachable from Vercel. " +
        "Create a hosted database (e.g. MongoDB Atlas) and set MONGODB_URI to its mongodb+srv:// connection string."
    );
  }
}
