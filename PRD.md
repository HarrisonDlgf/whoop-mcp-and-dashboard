# PRD: Personal WHOOP Training Dashboard (v1)

*Owner: Harrison Dolgoff. Last updated: June 8, 2026.*

## 1. Summary

A single-user web app that auto-syncs my WHOOP data into my own database, shows one unified daily-and-trend dashboard, and exposes that data to Claude through an MCP server so my coaching context fills itself in instead of me pasting screenshots.

The point is not "AI coaching." I already have that in the Claude interface. The point is three things:

1. **Automation:** WHOOP data syncs itself, no manual screenshotting.
2. **Unification:** one view across recovery, training, and race prep that no single existing app gives me.
3. **Structured memory:** a real database Claude can query precisely (for example, my actual long-run completion rate) instead of eyeballing an image.

If the app does not beat "open the WHOOP app + paste a screenshot into Claude" on those three, it has no reason to exist. That is the bar.

## 2. Core user

Just me. One user, no signup, no multi-tenant auth in v1. The data model keeps a `userId` field so going multi-user later is a migration, not a rewrite.

## 3. Goals and non-goals

**Goals (v1)**
- Authorize my WHOOP account and keep tokens fresh automatically.
- Sync recovery, sleep, workout, and cycle data into Postgres on a schedule and via webhooks.
- Render one dashboard: today's readout, trends, training summary, race-prep widgets, and a weekly checklist.
- Stand up an MCP server so Claude can read my stored data live.

**Non-goals (v1)**
- No Strava integration (redundant with WHOOP, plus its terms restrict AI use of the data).
- No nutrition integration (no reliable Cronometer API for individuals). Nutrition stays screenshots-into-Claude for now.
- No multi-user, no public sharing, no accounts beyond me.
- No embedded chat UI. The AI layer lives in Claude via the MCP server.

## 4. User stories (v1)

- As the user, I connect my WHOOP account once and never re-auth manually.
- As the user, I open the dashboard each morning and see today's recovery, HRV, RHR, sleep, and strain at a glance with a plain-language "today's call."
- As the user, I see 14-day trends for HRV, RHR, and recovery so I can spot patterns.
- As the user, I see my recent runs (pace, HR, zone) and lift tonnage by Push/Pull/Legs.
- As the user, I see my race prep: weeks to race day, progression vs plan, and my long-run completion rate flagged when it is slipping.
- As the user, I manage a weekly checklist tied to my Sunday reset (long run, PPL days, easy runs, sleep and protein targets).
- As the user (via Claude), I ask Claude about my training and it pulls live numbers through the MCP server instead of me uploading anything.

## 5. Key screens and flows

**Connect flow:** OAuth with WHOOP, store access and refresh tokens server-side, redirect back to the dashboard. One time.

**Main dashboard (the one screen that matters):**
- Header: greeting, date, sync status, weeks-to-race eyebrow.
- Today: recovery state block, metric tiles (HRV, RHR, sleep, strain), one coaching line.
- Trends: tabbed line chart (HRV and RHR, or recovery), 14 days.
- Training: recent runs list, lift tonnage by PPL day.
- Race prep: progression vs plan, long-run completion rate with a warning state, weeks to race day (Aug 16).
- This week: checklist with checkable items.

## 6. Data model (v1)

Entities, kept deliberately small:

- **User**: `id`, `name`, created timestamp. (One row in v1.)
- **WhoopToken**: `userId`, `accessToken`, `refreshToken`, `expiresAt`, scopes. Server-side only.
- **Recovery**: `userId`, `date`, `recoveryScore`, `hrv`, `restingHeartRate`, raw payload.
- **Sleep**: `userId`, `date`, `sleepPerformancePct`, `durationMinutes`, `sleepStart`, raw payload.
- **Workout**: `userId`, `whoopId`, `start`, `end`, `sportName`, `strain`, `avgHr`, `maxHr`, `distanceMeters`, `zoneDurations` (json), raw payload.
- **LiftSession** (optional v1, can be derived from Workout "Strength Trainer"): `userId`, `date`, `tonnage`, `reps`, `sets`, `pplType`.
- **Goal**: `userId`, `type` (for example `long_run_completion`, `weekly_protein`), `target`, `current`, `window`.
- **TodoItem**: `userId`, `text`, `done`, `weekOf`, `order`.

Derived (computed, not stored): weeks to race, long-run completion rate, progression vs plan.

## 7. Out of scope (explicit, deferred not killed)

- Strava (skipped entirely).
- Cronometer / any nutrition API (deferred; later a custom quick-log from my staples, my own thing).
- Outlook calendar in-app (v2; for now connect Outlook to Claude as a connector for calendar awareness).
- FastAPI backend (v2 extraction of the sync pipeline).
- Multi-user, auth, sharing.
- Drag-and-drop / nested / rich-text to-dos. v1 to-do is a clean sectioned checklist with a Notion-like feel, not Notion's engine.

## 8. Tech stack

- **App:** Next.js (App Router) + TypeScript, single codebase.
- **Database:** Postgres on Neon, accessed via Prisma.
- **Sync:** WHOOP webhooks into a Next route handler, plus a daily Vercel Cron backfill.
- **Auth:** none in v1, gated by an env secret. `userId` retained in schema.
- **Hosting:** Vercel (app) + Neon (db).
- **Component B:** a TypeScript MCP server (official MCP SDK) reading the same Postgres, registered via `.mcp.json`.

## 9. Success criteria

- I open the dashboard instead of the WHOOP app on at least most mornings.
- I stop pasting WHOOP screenshots into Claude because the MCP server covers it.
- Long-run completion rate is visible and honest enough that it actually nudges my behavior.
