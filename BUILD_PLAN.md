# BUILD_PLAN.md

Ordered milestones for the WHOOP dashboard. Work them in order. Stop at each "Done when" and review before moving on. Each milestone is meant to be a single reviewable chunk, not a week of silent building.

---

## M0: Orientation and scaffold

**Goal:** a running, deployed, empty Next + TS app wired to a database, plus a quick orientation on the new pieces.

- Create the Next.js App Router app in TypeScript (strict).
- Add the styling approach (see the mockup for the visual target).
- Init Prisma, connect to Neon, run a first empty migration.
- Add `.env.example` and env validation.
- Deploy the empty app to Vercel and confirm it loads.
- Short orientation from Claude Code: how TS types work in practice here, and what server components vs client components and route handlers are.

**Done when:** the empty app is live on Vercel, connected to Neon, and you understand the file layout.

---

## M1: WHOOP connect (OAuth)

**Goal:** prove you can authorize WHOOP and make one real API call.

- Register the WHOOP app (Client ID, Secret, redirect URI, read scopes for recovery, sleep, workout, cycles, profile, plus offline for refresh tokens).
- Build the OAuth flow: redirect to WHOOP, handle the callback, store access and refresh tokens server-side in `WhoopToken`.
- Add token refresh (tokens expire hourly; use the refresh token).
- A debug route that fetches your latest recovery and prints it.

**Done when:** you click "connect," authorize, and the app fetches and shows your real latest recovery score once.

---

## M2: Sync to Postgres

**Goal:** your WHOOP history lives in your own database and stays current.

- Define the schema (Recovery, Sleep, Workout, and the rest from PRD.md).
- Write mappers from WHOOP payloads to your tables under `lib/whoop/`.
- Backfill: a route that pulls recent history and upserts it.
- Keep-current: a Vercel Cron daily job, plus a webhook route handler for push updates.

**Done when:** your last few weeks of recovery, sleep, and workouts are in Postgres and new days appear automatically.

---

## M3: The dashboard (main screen)

**Goal:** the one view, wired to real data, matching the mockup.

- Build the dashboard from the approved mockup: today's readout, trends chart, training summary, race-prep widgets.
- Replace sample data with real queries.
- Loading and empty states (an empty screen should tell you what to do, not sit blank).

**Done when:** the dashboard shows your real WHOOP data and you would actually open it in the morning.

---

## M4: Weekly checklist (to-do)

**Goal:** the Sunday-reset checklist, in v1.

- `TodoItem` CRUD: add, check, delete, ordered, scoped to the current week.
- Clean sectioned layout with the Notion-like feel from the mockup. No drag-and-drop, no nesting in v1.

**Done when:** you can manage this week's checklist and it persists.

---

## M5: Race-prep logic

**Goal:** the honest numbers, computed not faked.

- Weeks to race day (Aug 16).
- Long-run completion rate over a rolling window, with a warning state when it slips.
- Progression vs plan (actual long-run distance vs the planned target per week).

**Done when:** the race-prep widgets reflect real, computed values and the completion-rate warning fires correctly.

---

## M6: MCP server (Component B)

**Goal:** Claude reads your live data instead of screenshots.

- A separate TypeScript MCP server using the official SDK.
- Tools that expose your data: latest readout, trends over a date range, runs, lift history, race-prep status.
- Register it via `.mcp.json` and connect it to Claude Code and Claude Desktop.
- Test by asking Claude a real question and confirming it pulls live numbers.

**Done when:** in the Claude interface, you ask about your training and it answers from the MCP server with no upload.

---

## M7: Polish and harden

**Goal:** the quality floor.

- Responsive down to mobile.
- Keyboard focus visible, reduced motion respected.
- Error states for failed syncs and expired tokens (explain what happened and how to fix it).
- Tighten the deploy: env handling, secrets, cron reliability.

**Done when:** it works on your phone, fails gracefully, and you trust it.

---

## After v1 (parking lot)

- Custom nutrition quick-log from your staples (your own thing, not Cronometer).
- Extract the sync pipeline into a FastAPI service (the v2 backend learning arc).
- Outlook calendar in-app.
- Multi-user, if anyone else ever wants it.
