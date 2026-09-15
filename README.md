# Clara Quotes frontend

Three-step insurance quote flow in React, TypeScript, MUI, React Hook Form, Yup, Context and React Router. It calls the [Java/Spring backend](https://github.com/5h1rU/clara-quotes-backend) directly. Both repositories are intentionally private at the candidate’s request, an explicit departure from the brief’s public-repository requirement.

## Run

Start the backend first, including PostgreSQL and Kafka:

```sh
git clone https://github.com/5h1rU/clara-quotes-backend.git
cd clara-quotes-backend
cp .env.example .env
docker compose up --build -d
```

Wait for `Started QuotesApplication` in `docker compose logs -f api`. In another terminal:

```sh
git clone https://github.com/5h1rU/clara-quotes-frontend.git
cd clara-quotes-frontend
npm ci
npm run dev
```

Use Node.js 22.12+ or a current supported release. Open http://127.0.0.1:5174 and sign in with the local demonstration account `reviewer` / `local-review-only`. These match the backend defaults and are configurable there. The browser sends HTTP Basic credentials explicitly with each request. Passwords are held in React memory, never embedded in the build or saved in browser storage. Reloading requires sign-in again. Only the current quote UUID is retained in tab-scoped sessionStorage, allowing the authenticated API to restore saved progress.

`VITE_API_URL` defaults to http://localhost:8080; copy `.env.example` if changing it. Use **127.0.0.1:5174**, matching the backend CORS origin, rather than opening Vite via a different hostname. The backend handles authentication and is required; no mock service is used in the app.

## Checks

```sh
npm test                 # Vitest + React Testing Library
npm run lint             # TypeScript, React Hooks, React Refresh rules
npm run build            # strict TypeScript check and Vite build
npx playwright install chromium
npm run test:e2e          # actual frontend + running backend; desktop and mobile Chromium
```

Unit tests cover personal validation, saving before navigation, the age boundary, conditional clearing of health fields, live estimates, submission errors and API error translation. Only unit tests replace API/context boundaries. Browser tests use real HTTP, PostgreSQL, Kafka and the public insurer stand-in, so they require the backend and internet access. They create clearly named synthetic test quotes and never use real personal data. They intentionally do not delete existing quotes. An optional GitHub Actions template in `docs/ci/github-actions.yml` runs lint, component tests and build. It is not installed as a workflow because the current OAuth token lacks workflow permission. Browser tests are explicitly local because the sibling repository is private.

## Approach

Before coding, I translated the assignment into the backend state machine and an explicit contract; [the plan](docs/PLAN.md) captures the sequence. The frontend follows server-owned milestones: personal details create a draft; coverage is validated and saved by the backend; the summary submits that saved quote. Local forms remain editable without pretending unsaved values are already persisted.

The layout keeps one task visible at a time, with progress, field errors, and a live estimate. It collapses to a single column on small screens. The app includes a skip link, explicit labels, keyboard-operable MUI controls, route focus management, reduced-motion support, and live premium announcements.

## Decisions and their locations

- `QuoteContext.tsx` owns the saved quote and authenticated client. Routes consume it rather than pass state through a long prop chain. Context is sufficient for this small workflow; no global state library is needed. Sign-in checks `/session` without downloading all quotes. A 409 while saving coverage refreshes the saved quote, allowing terminal states to redirect to the summary and offer a new quote.
- `pages/PersonalStep.tsx` validates with Yup and React Hook Form. Re-entering unchanged details reuses the quote. Editing personal data creates a new draft because the fixed contract has no personal-data update endpoint; a visible notice explains this and the previous draft expires naturally. Creating a quote is not idempotent, so a lost create response can leave an abandoned draft.
- `applicantRules.ts` defines the age boundary used by coverage, summary and preview. `pages/CoverageStep.tsx` shows health questions only over 65 and strips those properties entirely for younger applicants. Changing conditions to No clears previous selections. This is usability, not the security boundary: the server independently rejects invalid data.
- `pricing.ts` mirrors the fixed formula for instant preview. It uses integer-scaled factors and rounds at the end. The summary always uses the server's saved price; the browser is never authoritative about the amount.
- `pages/SummaryStep.tsx` reviews every collected field, including medication and spouse coverage, before submission. SUBMITTED and EXPIRED states cannot be edited. Failed submissions can retry. After an interrupted request, Context reloads saved state to reconcile possible server success before displaying an error.
- `api.ts` centralizes explicit authentication, a 12-second browser timeout, consistent error translation, and backend validation messages. There are no hardcoded successful responses.
- React Router gives each step a URL; missing prerequisites redirect safely. Browser refresh restores the quote after sign-in. Unsaved field edits are intentionally not persisted to storage.

## AI use and limitations

OpenAI Codex assisted with the plan, implementation, tests, debugging, documentation and browser verification. Felipe specified the stack, private repository requirement, progressive commits and learning goals. Generated changes were checked with type, lint, component and browser tests. The code tour supports Felipe’s ongoing manual review and interview preparation; dated validation results are recorded below. Commit authorship uses Felipe's Git identity without an AI co-author trailer.

Implementation challenges included the MUI version's `sx` styling API, backend preflight configuration, and restoring state after uncertain submission responses. The application is a take-home demonstration, not an insurance product or real policy purchase. Shared reviewer credentials, USD and US ZIP codes are documented assumptions. API lists have no pagination because the challenge asks for all quotes. Browser tests against the public stand-in may fail when that external service is unavailable.

See [frontend walkthrough](docs/WALKTHROUGH.md), [backend walkthrough and architecture](https://github.com/5h1rU/clara-quotes-backend/blob/main/docs/WALKTHROUGH.md), and [verification evidence](docs/VERIFICATION.md).
