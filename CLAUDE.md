# CLAUDE.md

Project memory for Claude Code. Read this at the start of every session.

## What this is

A single-user personal web app that auto-syncs my WHOOP data into Postgres, shows one unified dashboard, and exposes the data to Claude through an MCP server. See PRD.md for full scope. The owner is Harrison, the only user.

## Learning mode (important)

The owner is new to TypeScript and Next.js. He knows React and Vue, so the React mental model transfers; the new parts are the TypeScript type system and the Next App Router (server components, route handlers).

- When you introduce a new TS or Next concept, explain it in two or three plain sentences before or right after the code.
- Work in small, reviewable steps. Stop at milestone boundaries (see BUILD_PLAN.md) and let the owner review before moving on.
- Prefer the clear version over the clever version.
- Do not assume expertise in a library just because the owner can code. Name what is new.

## Stack

- Next.js (App Router) + TypeScript, strict mode on. One codebase.
- Postgres on Neon, accessed via Prisma.
- WHOOP API v2 (OAuth 2.0, webhooks). Free developer tier.
- MCP server in TypeScript (official `@modelcontextprotocol/sdk`), separate process, reads the same Postgres.
- Hosting: Vercel (app) + Neon (db). Daily sync via Vercel Cron plus WHOOP webhooks.

## Architecture decisions

- v1 is a monolith. The Next app owns the UI and the API (route handlers). Do not split into a separate backend service in v1.
- The WHOOP sync pipeline is a candidate to extract into a FastAPI service in v2. Keep sync logic isolated (a clear `lib/whoop/` module) so that extraction is easy later. Do not extract it now.
- No auth in v1. The app is single-user and gated behind one env secret. Every table still carries a `userId` so multi-user is a future migration, not a rewrite.
- The MCP server is a separate package/process. It does not import the Next app. It talks to Postgres directly (or via a small shared data module). Keep them decoupled.

## Conventions

- TypeScript strict. No `any` without a written reason.
- Server components by default. Use client components only where interactivity needs them, and mark them with `"use client"`.
- API lives in route handlers under `app/api/`.
- Data access goes through a single `lib/db` (Prisma client singleton). No raw Prisma calls scattered in components.
- WHOOP logic lives under `lib/whoop/` (auth, fetch, mappers). Nothing WHOOP-specific leaks into UI components.
- Env vars are validated at startup. Never reference `process.env` directly in components.
- Use Prisma migrations for every schema change. No manual DB edits.
- Sentence case in UI copy. Active voice. Name things by what the user controls, not by how the system works.

## Don't do X

- Do not add Mongo or MongoDB. The data is relational and time-series. Postgres only.
- Do not add Express or a separate Node server in v1. Next route handlers cover it.
- Do not add Strava. Skipped on purpose (redundant with WHOOP, and its terms restrict AI use of the data).
- Do not build a nutrition integration or scrape Cronometer. Nutrition stays out of v1.
- Do not build auth, login, or multi-user features in v1.
- Never expose the WHOOP client secret, access tokens, or the DB connection string to the client. Server-side only.
- Do not commit `.env` or any secret. Provide `.env.example` instead.
- Do not add a dependency without flagging it and saying why. Keep the tree small.
- Do not embed an AI chat UI in the app. The AI layer is Claude via the MCP server.
- Do not over-build the to-do. v1 is a clean sectioned checklist, not drag-and-drop nesting or rich text.

## Commands

(Fill in as the project is scaffolded. Expected:)
- `npm run dev` — local dev server
- `npm run build` — production build
- `npx prisma migrate dev` — apply a schema change locally
- `npx prisma studio` — inspect the DB

## Key files

- `PRD.md` — scope and data model, source of truth.
- `BUILD_PLAN.md` — ordered milestones. Work them in order.
- `.env.example` — required env vars.
- `lib/whoop/` — all WHOOP integration.
- `prisma/schema.prisma` — the data model.
