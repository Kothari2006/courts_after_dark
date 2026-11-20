# Courts After Dark

Next.js 16 student facility reservation application with MongoDB, Auth.js credentials login, bookings, equipment, reviews, waitlists, and administrative dashboards.

## Local Development

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

For local development, `.env.local` can use:

```text
MONGODB_URI=mongodb://127.0.0.1:27017/courts-after-dark
AUTH_SECRET=generate-a-random-secret
```

## Production Build

```bash
npm run lint
npm run build
npm run start
```

## Deploy to Vercel

The complete deployment checklist is in [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md).

### Required Vercel environment variables

| Variable | Production value |
| --- | --- |
| `MONGODB_URI` | MongoDB Atlas `mongodb+srv://...` connection string |
| `AUTH_SECRET` | Random secret generated with `openssl rand -base64 32` |

Do not use `mongodb://127.0.0.1:27017/...` on Vercel. It is only reachable from the same machine and will fail in a Vercel serverless function.

### Deploy from GitHub

1. Push the repository to GitHub.
2. Import `Dhruvamaheshwari/Nexo` in Vercel.
3. Keep Framework Preset as **Next.js** and Root Directory as `./`.
4. Set `MONGODB_URI` and `AUTH_SECRET` under Project Settings -> Environment Variables.
5. Enable the variables for Production and, if needed, Preview.
6. Deploy the project.
7. Open `/api/health/db` to verify that MongoDB is connected.

After changing environment variables, redeploy from Vercel. Local `.env.local` values are not uploaded to Vercel.
