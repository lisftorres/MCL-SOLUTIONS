# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

MCL Solutions is a French-language single-page app for managing technical maintenance across fitness clubs (Fitness Park sites): tickets/incidents, periodic regulatory checks, maintenance events, general planning, contractor contacts, financial/technical documents, and equipment specifications. It originated as a Google AI Studio scaffold and is deployed to Vercel as a static Vite build.

Stack: React 19 + TypeScript, Vite, Tailwind CSS (loaded via CDN, not the npm build pipeline), Supabase (optional persistence), Google Gemini (`@google/genai`) for AI-assisted ticket triage and notification drafting.

## Commands

```bash
npm install       # install dependencies
npm run dev       # start Vite dev server on port 3000
npm run build     # production build to dist/
npm run preview   # serve the built dist/ locally
npm start         # alias for `vite preview`
```

There is no lint script, no test script, and no test framework configured in this repo.

### Environment variables

Set these in `.env.local` (not committed):
- `GEMINI_API_KEY` (or `VITE_API_KEY`) — read by `vite.config.ts` and injected as `process.env.API_KEY`, which `services/geminiService.ts` and `services/notificationService.ts` require when constructing `GoogleGenAI` clients.
- `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` — read by `services/supabase.ts`. If either is missing, `supabase` is exported as `null` and the app runs in demo/mock mode instead of erroring.

`vite.config.ts` explicitly maps each var into `process.env.*` (rather than exposing the whole `env` object) because the `@google/genai` SDK strictly expects `process.env.API_KEY`.

## Architecture

### Centralized state in `App.tsx`, no router/state library

There is no Redux/Zustand/Context provider and no `react-router`. `App.tsx` is the single owner of all domain state (`tickets`, `checks`, `maintenanceEvents`, `planningEvents`, `financialDocs`, `technicalDocs`, `artisans`, `specifications`, `clubs`, `users`, `notifications`) via plain `useState`, and passes data + handler callbacks down as props to each feature component in `components/`. "Routing" is a `switch (activeTab)` in `App.tsx`'s `renderContent()`; `activeTab` is a string persisted to `localStorage` (`mcl_activeTab`) and changed via `Layout`'s sidebar menu.

Note: `components/GeneralPlanning.tsx` exists and `types.ts` defines `PlanningEvent`/`MOCK_PLANNING_EVENTS`, but `App.tsx` does not import `GeneralPlanning` or have a `'planning'` case in `renderContent()` — the Planning menu entry currently has nowhere to render.

### Data layer: Supabase-or-mock, with a single sync helper

`fetchData()` in `App.tsx` runs once on mount: if `services/supabase.ts` exported a real client, it pulls every table (`clubs`, `tickets`, `checks`, `maintenance`, `planning`, `financial_documents`, `technical_documents`, `artisans`, `users`, `specifications`) and sets `dbStatus` to `'CONNECTED'`; otherwise it falls back to the `MOCK_*` fixtures in `constants.ts` and sets `dbStatus` to `'DEMO'`. This status drives the banner shown at the top of the authenticated app.

All writes go through one generic helper, `syncOperation(table, method, data, id)`, which calls the matching Supabase `insert`/`update`/`delete` and returns a boolean. Every handler in `App.tsx` follows the same pattern: call `syncOperation`, and only update local React state if it succeeds. When adding a new mutation, follow this pattern rather than calling Supabase directly from a component or updating state before the sync confirms.

Deletion is soft: `Ticket`, `PeriodicCheck`, `MaintenanceEvent`, and `PlanningEvent` all carry a `deleted?: boolean` flag; "deleting" sets `deleted: true` via `syncOperation('update', ...)` rather than removing the row. `components/RecycleBin.tsx` lists everything with `deleted === true` and offers restore (flip back to `false`) or permanent delete (`syncOperation('delete', ...)`). `Artisan` and `Specification`/document records use real deletes instead (no `deleted` field on those types).

### Auth and authorization are client-side only, not a real backend

`handleLogin` in `App.tsx` matches on `users.find(u => u.email === email)` and checks against a hardcoded `userPasswords` map (only `admin_fixed` has a real entry; every other user implicitly falls back to `"123456"`). There is no backend session/token — auth state (`mcl_isAuthenticated`, `mcl_currentUser`, `mcl_activeTab`) lives in `localStorage` and `handleLogout` just clears it. Treat this as unauthenticated-app-with-a-login-screen, not a secure auth system; don't assume Supabase RLS or any server-side check backs it up.

Authorization is role-based menu filtering only: `UserRole` is `ADMIN | MANAGER | TECHNICIAN`, and `Layout.tsx`'s `menuItems` each declare a `roles` array used to hide/show sidebar entries. Several feature components also re-check `currentUser.role` internally. A `User.clubIds` array scopes which clubs a MANAGER/TECHNICIAN should see, but this is enforced ad hoc per component, not centrally.

### Domain model and demo data

`types.ts` is the single source of truth for the domain model — enums (`UserRole`, `TicketStatus`, `Urgency`, `CheckStatus`, `TradeType`) and interfaces (`Ticket`, `PeriodicCheck`, `MaintenanceEvent`, `PlanningEvent`, `DocumentFile`, `Artisan`, `Specification`, `Club`, `User`, `AppNotification`). Every component and service imports its shapes from here — update this file first when changing the model, then follow references through `constants.ts`, `App.tsx`, and the relevant `components/*Manager.tsx`.

`constants.ts` holds the `MOCK_*` fixtures (clubs, users, tickets, checks, maintenance, docs, artisans, specs, planning events, and a shared `MOCK_FAILURE_TYPES` lookup keyed by `TradeType`) used both as demo-mode data and as the shape reference for what Supabase rows are expected to look like.

### Gemini usage

`services/geminiService.ts` (`analyzeTicketDescription`) and `services/notificationService.ts` (`sendTicketEmail`) each independently instantiate their own `GoogleGenAI` client and call `ai.models.generateContent` with `model: "gemini-3-flash-preview"` and a structured `responseSchema`/`responseMimeType: "application/json"`, then `JSON.parse(response.text)`. `sendTicketEmail` is invoked from `handleCreateTicket` in `App.tsx` on every new ticket, but "sending" is simulated — the generated email is only `console.log`'d, not actually delivered. `services/firebase.ts` is an intentional no-op stub (`auth`/`db`/`storage` all `null`) kept for a possible future Firebase integration; it isn't wired into the app.

### Styling and asset loading quirks

Tailwind is loaded via a `<script src="https://cdn.tailwindcss.com">` tag in `index.html` with the brand palette (`brand.dark/darker/light/yellow/white`) configured inline there — not through the `tailwindcss`/`postcss`/`autoprefixer` devDependencies via a build step. `index.html` also declares an `importmap` (esm.sh URLs for react, react-dom, lucide-react, recharts, @google/genai, @supabase/supabase-js) inherited from the AI Studio scaffold, alongside the normal Vite/npm dependency resolution used by `npm run dev`/`build`. If either the CDN Tailwind or the import map ever needs replacing with the npm-installed equivalents, both index.html and the build config need to change together.

### Deployment

`vercel.json` configures a static Vite build (`npm run build` → `dist/`) with an SPA rewrite (`/(.*)`→`/index.html`). `server.js` and `Dockerfile` are both intentionally empty — `server.js` exists only so Vercel doesn't mistake this for a Node server project; there is no containerized deployment path currently in use.
