# The Vanguard Society — Official Platform

A student-led forum for debate, leadership, research, and public speaking. Officially recognized by NIE Mysuru.

## Tech Stack
- **Frontend**: Vanilla HTML/CSS/JS
- **Backend**: Vercel Serverless Functions (Node.js 22.x)
- **Database**: Supabase (PostgreSQL)
- **File Storage**: Supabase Storage
- **Auth**: JWT sessions (`jose`) + `bcryptjs` for password hashing
- **Email**: Resend (optional, for notifications)
- **Deployment**: Vercel + GitHub Pages (static fallback)

## Project Structure
Overview of the directory layout:
- Root HTML pages (`index.html`, `about.html`, etc.)
- `/api` — Vercel serverless functions
  - `/api/_lib` — shared utilities (not deployed as routes)
  - `/api/admin` — admin-authenticated endpoints
  - `/api/public` — unauthenticated read endpoints
  - `/api/member` — member-authenticated endpoints
- `/css` — stylesheets
- `/js` — JavaScript modules
  - `/js/modules` — shared modules
  - `/js/pages` — page-specific logic
- `/components` — reusable HTML fragments (loaded dynamically)
- `/assets` — images, icons, downloads
- `/scripts` — database setup scripts

## Setup Instructions

### Prerequisites
- Node.js 22.x
- Vercel CLI (`npm i -g vercel`)
- A Supabase project (free tier: [supabase.com](https://supabase.com))

### 1. Clone & Install
```bash
git clone <repo-url>
cd Vanguard
npm install
```

### 2. Create Supabase Project
- Go to [supabase.com](https://supabase.com) and create a new project
- Go to SQL Editor and run the contents of `scripts/setup-db.sql`
- Create a Storage bucket named 'uploads' and set it to public
- Copy your project URL, anon key, and service role key from Settings > API

### 3. Configure Environment Variables
Copy `.env.example` to `.env` and fill in:

| Variable | Purpose | Required |
|---|---|---|
| `ADMIN_CREDENTIALS` | JSON: `{"email":"password",...}` — per-admin login | Yes |
| `ADMIN_SESSION_SECRET` | JWT signing secret, min 32 chars | Yes |
| `SUPABASE_URL` | Supabase project URL | Yes |
| `SUPABASE_ANON_KEY` | Supabase anon/public key | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | Yes |
| `RESEND_API_KEY` | Resend.com API key for email | No |

For Vercel deployment, set these in Project Settings > Environment Variables.

### 4. Local Development
```bash
npm run dev
# Opens at http://localhost:3000
```

### 5. Deploy to Vercel
```bash
vercel
# Follow prompts, then set env vars in dashboard
```

### 6. GitHub Pages (Static Fallback)
The static HTML/CSS/JS works on GitHub Pages without the API backend. Push to a gh-pages branch or enable Pages from main. API-dependent features (events, news, polls, admin, member portal) will show empty states.

## Admin Access
- Navigate to `/admin` (not linked in public navigation)
- Login with credentials from `ADMIN_CREDENTIALS` env var
- If env vars aren't configured, login fails closed (no default access)

## Architecture Notes
- **Admin auth**: per-email passwords in `ADMIN_CREDENTIALS` env var, JWT sessions in httpOnly cookies
- **Member auth**: email + password (set during application), bcrypt-hashed in DB, JWT sessions
- **File uploads**: via Supabase Storage, routed through API endpoints
- **Email**: Resend integration set up but optional — falls back to console logging
- **Search**: server-side full-text search across multiple tables
- **Notifications**: stored in DB, polled by frontend every 60s

## License
© 2026 The Vanguard Society, NIE Mysuru. All rights reserved.
