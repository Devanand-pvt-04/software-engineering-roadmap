# Zero to Deep

A web app for the **Zero to Deep: 36-Week Software Engineering Plan**: a Main track (CPU → OS → networks → browser → JS → backend → React/Next.js → infra → system design) running in parallel with a Java + DSA track.

## What's in it

- **Today**: works out the current plan week from your start date, shows today's session (Mon/Wed/Fri/Sat Main, Tue/Thu/Sun Java), Sunday Done-when reviews, progress for both tracks, problems done, streak, re-solves due, and a guided session timer (Open → Recall → Focus → Explain → Close).
- **36-week map**: both tracks side by side with phases/parts, calendar dates, per-week progress and optional buffer weeks.
- **72 week pages**: Why this week, daily checklist, Must know topic tree, Overlooked/niche, resources (⭐ core first), build, Sunday problems, Done-when test, phase milestone and your notes. Everything is tickable, and resource names become links.
- **Problem tracker**: all 161 LeetCode problems from the Java track, linked, with status (Solved / Needed help / Stuck) and automatic re-solve reminders at 3 days and 2 weeks (practice rule 6). You can add your own problems.
- **Journal**: the long-running "What happens when I type a URL" note (one section per phase), a mistakes log with tags, and a patterns note.
- **How it works**: schedule, session template, setup checklist, falling-behind rules, AI-as-tutor rules, practice rules.
- **Glossary** linked to the weeks that cover each term.
- **Settings**: start date, slide the calendar (never cram, never skip), buffer weeks, theme, JSON export/import, reset.

## Progress and sync

Progress is local-first (saved in the browser). When cloud sync is configured, signing in with GitHub merges local progress into your account and keeps devices in sync. Every tick is stored with a timestamp and merged last-writer-wins per item, so two devices don't overwrite each other.

Sync needs four environment variables (see `.env.example`). Without them the app runs in browser-only mode.

## Deploying on Vercel

1. Import this repo in Vercel (framework: Next.js, no build settings to change).
2. **Database**: in the Vercel project, Storage → Create → Neon (Postgres). Connect it to the project; it sets `DATABASE_URL`. The `progress` table is created automatically on first use.
3. **GitHub OAuth app**: GitHub → Settings → Developer settings → OAuth Apps → New OAuth App.
   - Homepage URL: `https://<your-vercel-domain>`
   - Authorization callback URL: `https://<your-vercel-domain>/api/auth/callback/github`
   - Copy the Client ID and generate a Client secret.
4. In Vercel → Settings → Environment Variables, add `AUTH_SECRET` (run `npx auth secret` or `openssl rand -base64 33`), `AUTH_GITHUB_ID`, `AUTH_GITHUB_SECRET`.
5. Redeploy.

## Local development

```bash
npm install
cp .env.example .env.local   # optional, for sync
npm run dev
```

## Where the content lives

- `src/data/roadmap.json`: every week of both tracks, extracted from the plan PDF.
- `src/data/guide.ts`: intro sections, schedule, rules, glossary.
- `src/data/links.ts`: catalog of real resource URLs and the patterns that link them from the text.
