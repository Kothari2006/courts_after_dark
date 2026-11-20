# Deploying Courts After Dark to Vercel

> **Status:** the production build (`npm run build`) and the production server (`next start`) were
> verified locally. **The app has not been deployed to Vercel from this environment**, so the
> deployment itself is unverified. Follow the checklist below and run the smoke tests at the end.

## 1. What the project is

| Item | Value |
| --- | --- |
| Framework | Next.js **16.4.6**, **App Router** (`src/app`), React 19 |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS v4 (theme variables in `src/app/globals.css`, black theme in `src/app/theme-dark.css`) |
| Auth | Auth.js / `next-auth` v5 beta, Credentials provider, JWT sessions (no DB session table) |
| Database | **MongoDB** via Mongoose 9 |
| Backend | Next.js Route Handlers in `src/app/api/**` (no separate server) |
| Route protection | `src/proxy.ts` (Next 16 successor to `middleware.ts`) |

There is **no separate backend service**: everything runs inside the Next.js app, so everything can run on
Vercel. The only external dependency is the **MongoDB database**.

## 2. Vercel project settings

| Setting | Value |
| --- | --- |
| Framework Preset | Next.js (auto-detected) |
| Root Directory | `./` (the repository root is the project; `package.json` is at the top level) |
| Install Command | `npm install` (default) |
| Build Command | `npm run build` (runs `next build --webpack`) |
| Output Directory | leave default (`.next`) |
| Node.js Version | 20.x or newer (`engines.node >= 20.9.0` is declared) |

No `vercel.json` is required. Security headers are configured in `next.config.ts`.

## 3. Environment variables

Set these in **Vercel -> Project -> Settings -> Environment Variables** (Production, and Preview if you use it).
A documented template is in [`.env.example`](./.env.example). Never commit real values: `.env*` is git-ignored
(only `.env.example` is tracked) and the git history was checked for committed secrets (none found).

| Variable | Required | Notes |
| --- | --- | --- |
| `MONGODB_URI` | **Yes** | Hosted MongoDB connection string, e.g. `mongodb+srv://USER:PASS@cluster.mongodb.net/courts?retryWrites=true&w=majority`. A `localhost` / `127.0.0.1` URI is rejected on Vercel with a clear error. |
| `AUTH_SECRET` | **Yes** | Random secret for signing session JWTs. Generate: `openssl rand -base64 32` (or `npx auth secret`). Use a **different** value than local development. |
| `AUTH_TRUST_HOST` | Optional | `true` is already hard-coded via `trustHost` in `src/lib/auth.config.ts`; not needed on Vercel. |
| `NEXTAUTH_URL` | Optional | Not needed on Vercel (host is trusted). Set only for a custom domain behind another proxy. |

Missing variables fail fast with explicit messages (see `src/lib/env.ts`), for example
`[env] Missing required environment variable MONGODB_URI ...`. Details are logged on the server only and are not
returned to API clients in production.

> After adding or changing a variable you must **redeploy** (Deployments -> ... -> Redeploy) for it to take effect.

## 4. Database: this is the one blocker you must handle

Your local `.env.local` uses `MONGODB_URI=mongodb://127.0.0.1:27017/3year`: **a MongoDB running on your own
computer. Vercel cannot reach it.** The application code needs no change, but you need a hosted MongoDB.
This project did **not** switch your database for you.

Recommended: **MongoDB Atlas** (free M0 tier is enough to start).

1. Create a cluster at <https://cloud.mongodb.com> and a database user (username + password).
2. **Network Access -> Add IP Address -> `0.0.0.0/0`.** Vercel functions use dynamic IPs, so a fixed allow-list
   does not work on the standard plan (the database user's strong password and TLS protect access).
   Alternative: Vercel Pro static IPs / Atlas private networking.
3. Copy the `mongodb+srv://...` connection string, put your database name in the path, and set it as `MONGODB_URI`
   on Vercel.
4. (Optional) Move your existing data:
   ```bash
   mongodump --uri="mongodb://127.0.0.1:27017/3year" --out=./dump
   mongorestore --uri="mongodb+srv://USER:PASS@cluster.mongodb.net" --nsFrom="3year.*" --nsTo="courts.*" ./dump
   ```
5. Atlas clusters are replica sets, so the booking code's transaction path (used when available) works. On a
   standalone MongoDB it falls back automatically.

Serverless notes (already handled in `src/lib/mongodb.ts`): the connection is cached on `global` and reused by warm
invocations, `maxPoolSize` is 10, and `serverSelectionTimeoutMS` is 8s so requests fail fast instead of hanging.
Pick the Vercel **Function Region** (Settings -> Functions) closest to your Atlas region to reduce latency.

Concurrency note: `withFacilityLock` / `withEquipmentLock` are in-memory locks, i.e. per function instance. Across
multiple serverless instances they do not serialise requests; double-booking protection relies on MongoDB
(transactions on Atlas and unique indexes). This is existing business logic and was left unchanged.

## 5. First-time setup: GitHub -> Vercel

1. Push the code. Make sure no secrets are staged:
   ```bash
   git status            # .env / .env.local must NOT appear
   git add -A && git commit -m "Prepare for Vercel deployment"
   git push origin main
   ```
2. Go to <https://vercel.com/new> and **Import** the GitHub repository (`Dhruvamaheshwari/Nexo`).
3. Confirm the settings from section 2 (Root Directory `./`, Framework Next.js).
4. Expand **Environment Variables** and add `MONGODB_URI` and `AUTH_SECRET` (section 3).
5. Click **Deploy**. Vercel runs `npm install` then `npm run build`.
6. Every later `git push` to `main` deploys to production automatically; other branches and pull requests get
   Preview deployments. (Preview deployments need the env variables enabled for the *Preview* environment too.)

## 6. Post-deploy smoke test

Replace `https://YOUR-APP.vercel.app` with your URL.

1. `GET /api/health/db` returns `{"status":"success","database":"connected"}`. If it returns `disconnected`, check
   `MONGODB_URI` and the Atlas IP allow-list (details are in Vercel -> Logs, not in the response).
2. `/register`: create a Student account, then log in at `/login`. You should land on `/student/dashboard`.
3. Register a Teacher account and verify `/teacher/dashboard`.
4. Book a court, check the notification bell, request equipment, toggle the light/black theme (moon/sun button).
5. Admin and Equipment Manager accounts cannot be self-registered. Promote a user in the database
   (`role: "ADMIN"` or `"EQUIPMENT_MANAGER"`) or create them with a seed script.

## 7. What was verified locally

- `npm install` / `npm audit --omit=dev` -> 0 known vulnerabilities (Next.js was upgraded from 16.3.0, which had
  critical advisories, to 16.4.6).
- `npm run build` -> succeeds with no warnings; `npx tsc --noEmit` -> no errors.
- `next start` (production server): public pages, protected-route redirects (307 to login / 401 for APIs),
  role guards, Student / Teacher / Admin / Equipment Manager pages and key APIs return 200; registration and
  credential login work; missing `MONGODB_URI` produces a clear server-side message and a generic public response.
- Response headers present: `X-Content-Type-Options`, `X-Frame-Options: DENY`, `Referrer-Policy`,
  `Permissions-Policy`, `Strict-Transport-Security`, `Cache-Control: no-store` on `/api/*`; `X-Powered-By` removed.

## 8. Changes made for production readiness

- `src/lib/env.ts` (new): lazy env validation with actionable messages and a "local DB on Vercel" guard.
- `src/lib/mongodb.ts`: serverless-friendly connection options; uses the env helper.
- `src/lib/api-errors.ts` (new) + 45 API routes: unexpected 500 errors no longer leak internal messages in production
  (known `UPPER_SNAKE_CASE` service codes are still returned). `/api/health/db` no longer exposes error text.
- `next.config.ts`: security headers, `poweredByHeader: false`, no-store caching for API responses.
- `src/middleware.ts` -> `src/proxy.ts` (Next 16 convention; removes the deprecation and Edge-runtime warnings).
- Build blockers fixed: a CSS selector form the production minifier could not parse, and `useSearchParams()` without a
  Suspense boundary on statically rendered pages (`/events`).
- Removed unused dependencies (`class-variance-authority`, `tsx`); added `engines.node`; added `.env.example`.

## 9. Known items that do not block deployment

- `npm run lint` reports ~50 errors (mostly `@typescript-eslint/no-explicit-any` and
  `react-hooks/set-state-in-effect`) and ~50 warnings. `next build` does not run ESLint in Next 16, so they do not fail the
  build. They were not mass-edited to avoid touching business logic.
- No Content-Security-Policy header is set: a strict CSP needs nonce plumbing for Next's inline scripts and the theme
  init script. Add one later if you need it.
- `/kanti-sweets` and `/category/snacks` use external image URLs with plain `<img>`; they work, but are not
  optimised through `next/image`.
- Credentials login has no rate limiting. For public production use, add rate limiting (e.g. Vercel Firewall rules or
  Upstash Ratelimit) on `/api/auth/*`.

## 10. Common errors and fixes

| Symptom | Cause | Fix |
| --- | --- | --- |
| Build fails: `useSearchParams() should be wrapped in a suspense boundary` | A client component uses `useSearchParams` on a static page | Wrap it in `<Suspense>` (already done for the dashboard sidebars and bookings page). |
| Build fails: `Unexpected "," found` in a CSS file | CSS selector the webpack minifier cannot parse | Avoid attribute selectors with escaped spaces; use `[class~="token"]`. |
| `/api/health/db` -> `disconnected` | `MONGODB_URI` missing, wrong password, or Atlas blocks Vercel IPs | Check the env var, URL-encode special characters in the password, allow `0.0.0.0/0` in Atlas. |
| `[env] MONGODB_URI points to a local MongoDB` (Vercel logs) | The local URI was used in production | Use the Atlas `mongodb+srv://` URI. |
| Login loops back to `/login` or `MissingSecret` in logs | `AUTH_SECRET` not set | Add `AUTH_SECRET` and redeploy. |
| `UntrustedHost` error | Host not trusted | `trustHost` is enabled; make sure you did not remove it from `src/lib/auth.config.ts`. |
| Works locally, not on Vercel | Env vars only set in `.env.local` | `.env.local` is never deployed: add every variable in Vercel settings and redeploy. |
| `MongooseServerSelectionError` / timeouts after idle | Cold start plus distant region | Put the Vercel Function Region near the Atlas region; check Atlas cluster is not paused. |
| `Module not found` / path errors | Case-sensitive paths on Linux | Match import path casing exactly (`@/components/...`); Windows hides this problem. |
| Changes not visible after setting a variable | Env vars apply to new deployments only | Redeploy. |
