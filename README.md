# Courts After Dark

Courts After Dark is a sports facility reservation platform for campuses. It supports facility discovery, slot booking, waiting lists, tournaments, equipment checkout, reviews, notifications, reports, and role-based dashboards.

## Features

- Student facility search and date-wise slot booking
- Live availability, prime-time booking, and waitlist queues
- My Bookings, cancellations, attendance, and booking history
- Tournament and event registration
- Equipment inventory requests and checkout tracking
- Facility, user, booking, event, maintenance, and review management
- Student, Teacher, Admin, and Equipment Manager dashboards
- MongoDB-backed authentication and role-based route protection
- Responsive dark UI with light/dark theme support

## Tech Stack

| Technology | Purpose |
| --- | --- |
| Next.js 16 App Router | Frontend and server route handlers |
| React 19 | User interface |
| TypeScript | Type-safe application code |
| Tailwind CSS 4 | Styling |
| MongoDB + Mongoose | Database and models |
| Auth.js / next-auth 5 | Credentials authentication and JWT sessions |
| Zod | Request validation |
| bcryptjs | Password hashing |
| Recharts | Dashboard analytics |
| Lucide React | Icons |

## Project Structure

```text
src/
  app/
    admin/              Admin dashboards and management pages
    api/                Server route handlers
    bookings/           Student booking history
    equipment/          Equipment requests and borrow flow
    events/             Tournament and event pages
    facilities/         Facility catalog and facility details
    login/              Login page
    register/           Registration page
    student/            Student dashboard
    teacher/            Teacher dashboards
  components/           Reusable UI components
  lib/                  Database, authentication, environment, and utilities
  models/               Mongoose models
  services/             Business logic and database operations
```

## Requirements

- Node.js 20.9 or newer
- npm
- MongoDB local instance or MongoDB Atlas

## Local Setup

1. Clone the repository:

```bash
git clone https://github.com/Dhruvamaheshwari/Nexo.git
cd Nexo
```

2. Install dependencies:

```bash
npm install
```

3. Create the local environment file:

```bash
cp .env.example .env.local
```

4. Configure `.env.local`:

```text
MONGODB_URI=mongodb://127.0.0.1:27017/courts-after-dark
AUTH_SECRET=replace-with-a-random-secret
AUTH_TRUST_HOST=true
NEXTAUTH_URL=http://localhost:3000
```

Generate a secure auth secret with PowerShell:

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

5. Start MongoDB, then run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

| Variable | Required | Description |
| --- | --- | --- |
| `MONGODB_URI` | Yes | MongoDB connection string |
| `AUTH_SECRET` | Yes | Secret used to sign Auth.js JWT sessions |
| `AUTH_TRUST_HOST` | Optional | Set to `true`; enabled for hosted deployments |
| `NEXTAUTH_URL` | Optional locally | Canonical application URL |

Never commit `.env`, `.env.local`, or real credentials. Only `.env.example` should be committed.

## Available Commands

```bash
npm run dev      # Start local development server
npm run build    # Create an optimized production build
npm run start    # Start the production server
npm run lint     # Run ESLint
```

## Database Setup

### Local MongoDB

Use:

```text
MONGODB_URI=mongodb://127.0.0.1:27017/courts-after-dark
```

Make sure MongoDB is running and the database is accessible.

### MongoDB Atlas

For deployment, use a hosted Atlas connection string:

```text
mongodb+srv://USERNAME:PASSWORD@CLUSTER.mongodb.net/courts-after-dark?retryWrites=true&w=majority
```

Also:

1. Create a database user.
2. Allow network access for Vercel, such as `0.0.0.0/0` on the free plan.
3. URL-encode special characters in the database password.

## Authentication and Roles

The application uses credentials-based login.

| Role | Access |
| --- | --- |
| STUDENT | Student dashboard, facilities, bookings, equipment, tournaments, and profile |
| TEACHER | Teacher dashboard, events, and schedules |
| ADMIN | Facility, user, booking, policy, report, review, and maintenance management |
| EQUIPMENT_MANAGER | Inventory and equipment checkout management |

Public registration normally creates student accounts. Admin and Equipment Manager roles must be assigned through database administration or an existing admin interface.

## User Interfaces

- `/` - Landing page
- `/login` - Sign in
- `/register` - Create account
- `/student/dashboard` - Student dashboard
- `/facilities` - Facility catalog
- `/facilities/:id` - Facility details and availability
- `/bookings` - Bookings and waiting lists
- `/events` - Events and tournaments
- `/equipment` - Equipment catalog
- `/notifications` - Notifications
- `/profile` - User profile
- `/admin/dashboard` - Admin dashboard
- `/teacher/dashboard` - Teacher dashboard
- `/equipment-manager/dashboard` - Equipment manager dashboard

## Health Check

After starting the application:

```text
/api/health/db
```

A successful database response is:

```json
{
  "status": "success",
  "database": "connected"
}
```

## Vercel Deployment

Complete deployment instructions are in [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md).

Required Vercel environment variables:

| Variable | Value |
| --- | --- |
| `MONGODB_URI` | MongoDB Atlas `mongodb+srv://...` URI |
| `AUTH_SECRET` | Random production secret |

Do not use `127.0.0.1` or `localhost` for `MONGODB_URI` on Vercel.

For GitHub deployment:

```bash
git add -A
git commit -m "Prepare project for Vercel deployment"
git push origin main
```

Then import the GitHub repository in Vercel, configure the environment variables, and deploy.

## Demo Facility Behavior

If MongoDB contains no facilities, the application may show demo facilities with IDs such as `fac-1`.

Demo facility bookings and waiting-list entries are stored in the browser's local storage. They are UI/demo records and are not MongoDB booking records. Real facility IDs load live availability and database-backed bookings.

## Troubleshooting

### MongoDB connection failed

- Check `MONGODB_URI`.
- Confirm the local MongoDB service is running.
- Confirm Atlas credentials and network access.
- Confirm the database password does not contain unencoded special characters.

### Login loops or missing secret

- Set `AUTH_SECRET`.
- Set `AUTH_TRUST_HOST=true`.
- Redeploy after changing Vercel environment variables.

### Page not found

- Confirm dynamic routes use valid MongoDB IDs.
- Demo routes use IDs such as `fac-1`.
- Restart the development server after route or environment changes.

### Changes are not visible

- Hard refresh with `Ctrl + F5`.
- Check the dev server terminal.
- Rebuild and restart after dependency or configuration changes.

## License

Private project. No license is currently specified.
