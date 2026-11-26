# Zero to Deep

A web app for the **Zero to Deep: 36-Week Software Engineering Plan**: a Main track (CPU → OS → networks → browser → JS → backend → React/Next.js → infra → system design) running in parallel with a Java + DSA track.

## What's in it

- **Today**: the sessions planned for today, with Swap with next, Not today and Do it today. Shows this week's hours against your rhythm, a week-based streak (two sessions makes a minimum week), pace (sessions ahead or behind) and the projected finish date, plus where you are on each track and why that phase comes now.
- **Flexible schedule**: each plan week is a list of sessions with hour estimates (from `sessions` in the data, or the original weekday checklist) plus a review, not fixed weekdays. Weeks have stable ids (`id`, default M<n>/J<n>) used by every progress key, so weeks can be inserted, reordered or merged (`aliases`) without losing ticks, and tracks can be any length. On first run you pick your start date, your study days and hours per day (presets include weekend-heavy, every day, weekdays only and weekends only), and what happens when you miss: push everything back, spread the catch-up over your study days, or catch up on days you choose. The app fills your days in order; content is never cut, only the finish date moves. Doing a session early, missing a day, swapping or changing the rhythm reflows the whole plan.
- **Big picture**: every phase of both tracks as a timeline, with what it's for, what it unlocks, its milestone and projected dates; your schedule for the next weeks; and all 36 weeks with progress.
- **72 week pages**: Why this week, sessions with their planned dates, Must know topic tree, Overlooked/niche, resources (⭐ core first), build, Sunday problems, Done-when test, phase milestone and your notes. Everything is tickable, and resource names become links.
- **Problem tracker**: all 161 LeetCode problems from the Java track, linked, with status (Solved / Needed help / Stuck) and automatic re-solve reminders at 3 days and 2 weeks (practice rule 6). You can add your own problems.
- **Journal**: the long-running "What happens when I type a URL" note (one section per phase), a mistakes log with tags, and a patterns note.
- **How it works**: schedule, session template, setup checklist, falling-behind rules, AI-as-tutor rules, practice rules.
- **Glossary** linked to the weeks that cover each term.
- **Self-check quizzes**: 5 questions with model answers per week (356 in all). Rate yourself and missed ones come back on a spaced schedule on the Review page.
- **Problem hints**: every listed LeetCode problem has its pattern and 2-3 hints revealed one at a time.
- **Phase 2 problems** (optional): 116 more problems, mostly DP, graphs and Hards, in sets that pair with the week teaching each topic. None repeat the core list and none need LeetCode Premium. Same statuses, hints and re-solves.
- **Weekly contests** (optional): the next LeetCode weekly contest in your local time, a log of how many you solved, and a reminder on Today from Part C onward.
- **Build briefs**: what "done" means for each week's build, plus a stretch goal.
- **Time and money**: rough time for each week's core resource, and free alternatives wherever a paid book is linked.
- **Search** (press / or Ctrl K): every topic, resource, chapter, build and problem you can see.
- **Study heatmap**: the last six months of days you ticked or wrote something.
- **Settings**: start date (or "I'm on week N", which ticks earlier sessions), weekly rhythm, theme, JSON export/import, Markdown export of all your notes, reset.

## Progress and sync

Progress is local-first (saved in the browser). When cloud sync is configured, signing in with GitHub merges local progress into your account and keeps devices in sync. Every tick is stored with a timestamp and merged last-writer-wins per item, so two devices don't overwrite each other.

Anyone who signs in gets the full app; sign-in is only there to sync your own progress. Sync needs four environment variables (see `.env.example`). Without them the app runs in browser-only mode.

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

Without sign-in configured, the app runs in open mode with every feature on. To try invites locally without Postgres, set `ZTD_LOCAL_DB=/tmp/ztd.json` (members, profiles and progress go in that file; it's ignored when `DATABASE_URL` is set).

## Where the content lives

- `src/data/roadmap.json`: every week of both tracks, extracted from the plan PDF.
- `src/data/guide.ts`: intro sections, schedule, rules, glossary.
- `src/data/quiz-main.ts`, `src/data/quiz-java.ts`, `src/data/hints.ts`, `src/data/briefs.ts`, `src/data/estimates.ts`, `src/data/phase2.ts`: quizzes, hint ladders, build briefs, time estimates and free alternatives.
- `src/data/links.ts`: catalog of real resource URLs and the patterns that link them from the text.
