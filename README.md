# ICQA Workspace — Personalize Dashboard

A production-oriented full-stack dashboard for **ICQA (Inventory Control and Quality Assurance)** operations: **hourly associate feedback and concerns**, **real-time team chat**, **week-view scheduling**, and a **process path** board. Built for deployment on [Vercel](https://vercel.com) with [Supabase](https://supabase.com) as the database and (optional) Realtime for chat.

## Stack

| Layer | Technology |
| --- | --- |
| **Framework** | [Next.js 16](https://nextjs.org) (App Router, React 19) |
| **Styling** | [Tailwind CSS 4](https://tailwindcss.com) |
| **Data** | [Supabase](https://supabase.com) (PostgreSQL + Realtime) |
| **Server logic** | Next.js Server Actions (type-safe, no extra API boilerplate) |

**Why this stack:** Next.js gives a single deployable app with server components, edge-friendly builds on Vercel, and colocated data fetching. Supabase provides managed Postgres, **Auth**, optional Realtime, and the **anon** key used together with **signed-in user JWTs** (via `@supabase/ssr` cookies) and **RLS for the `authenticated` role** so only logged-in users can access workspace data.

## Requirements

- **Node.js** 20+
- A **Supabase** project (free tier is enough to start)
- **npm** (or pnpm / yarn)

## 1. Clone and install

```bash
cd icqa-personalize-dashboard
npm install
```

## 2. Supabase: schema and RLS (run both SQL files in order)

1. In the Supabase dashboard, open **SQL Editor** → **New query**.
2. Run `supabase/migrations/20260421000000_initial_schema.sql` (creates tables, triggers, initial RLS, Realtime publication).
3. Run `supabase/migrations/20260422120000_auth_authenticated_rls.sql` (removes open `anon` policies, adds **`authenticated`-only** policies, adds `chat_messages.created_by` default `auth.uid()`).

Confirm tables exist under **Table Editor**. Without step 3, the app still expects **authenticated** RLS: signed-in users would be denied if old anon policies were removed manually, or data would stay world-open if you never run step 3—**always run step 3** for the shipped app behavior.

**Realtime (chat):** If the publication step in file (1) fails, add `chat_messages` to the `supabase_realtime` publication in the dashboard.

## 3. Supabase Auth configuration

1. **Authentication → Providers → Email**: enable **Email** (password sign-in).
2. **Authentication → URL configuration**:
   - **Site URL:** `http://localhost:3000` for local dev; your production site URL on Vercel for prod.
   - **Redirect URLs** (add both):  
     `http://localhost:3000/auth/callback`  
     `https://YOUR-PROJECT.vercel.app/auth/callback` (your real Vercel URL).
3. Create users: use **Authentication → Users → Add user**, or the app’s **`/signup`** page. If **“Confirm email”** is enabled, users must confirm before signing in; you can disable it for internal testing under **Authentication → Providers → Email**.

## 4. Environment variables

1. In Supabase: **Project Settings → API**, copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

2. In the app root, create `.env.local`:

```bash
cp .env.example .env.local
```

3. Edit `.env.local` with your real values.

4. The same variables must be set in **Vercel → Project → Settings → Environment Variables** for Production (and Preview if you use it).

**Authorization note:** The app uses the **anon** key in the browser and on the server; with a logged-in user, Supabase attaches the user’s **JWT** so **RLS `authenticated` policies** apply. Do **not** put the **service role** key in `NEXT_PUBLIC_*` or client code.

## 5. Local development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). With env vars set, you are sent to **`/login`** until you sign in; then you can use the dashboard (e.g. **`/hourly-notes`**). Without env vars, the Next.js **proxy** (`src/proxy.ts`) does not enforce login so you can open the UI, but saving data will not work until Supabase is configured.

## 6. Production build (same as Vercel)

```bash
npm run build
npm start
```

## 7. Deploy to Vercel

1. Push this folder to a GitHub repository.
2. In [Vercel](https://vercel.com), **Import** the repository.
3. Framework: **Next.js** (auto-detected).
4. Add environment variables: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
5. Deploy.

**Supabase Auth URLs:** Add your production **`https://…/auth/callback`** under **Redirect URLs** (see section 3).

## 8. Replit (optional)

Replit is optional. If you use it for quick testing:

- Use the **Node.js** template, upload this project or connect GitHub.
- Set the same **Secrets** as `.env.local`.
- Run `npm install` then `npm run dev` (set the Replit “Run” command to bind `0.0.0.0` if the template requires it).

Vercel remains the recommended path for production.

## App routes

| Path | Description |
| --- | --- |
| `/login`, `/signup` | Email/password sign-in and registration. |
| `/auth/callback` | OAuth / magic-link code exchange (Supabase redirect). |
| `/hourly-notes?date=YYYY-MM-DD` | Per-hour notes with status, counts, and save to Supabase. |
| `/chat` | Team thread; new messages appear via Realtime when enabled. |
| `/scheduling?week=YYYY-MM-DD` | Week (Monday) calendar of events. |
| `/process-path` | Process items in Pending / In progress / Done columns. |

## Repository layout (GitHub-ready)

```
src/
  proxy.ts             # Next.js 16 request proxy (session refresh + auth redirects)
  app/                 # App Router, layouts, server actions, auth routes
  components/dashboard # UI: sidebar, panels, shared widgets
  components/auth      # Login / signup forms
  lib/                 # Supabase SSR clients, data queries, business helpers
supabase/migrations/   # SQL to apply in Supabase (run in order)
.env.example          # Document required env vars
```

## Scripts

- `npm run dev` — development server
- `npm run build` — production build
- `npm start` — run production build locally
- `npm run lint` — ESLint

## License

This project is provided as-is for your internal use. Adjust branding, security policies, and compliance to your organization’s requirements.
