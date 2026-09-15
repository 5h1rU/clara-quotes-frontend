# Verification record

## Review follow-up, 2026-09-15

- `npm test`: 15 tests across 6 files passed.
- `npm run test:e2e -- --grep-invert 'senior flow'`: 4 desktop/mobile browser checks passed against the rebuilt real API (age boundary, back navigation/personal edits, and invalid credentials). Successful-submission browser cases were excluded because the existing local API intentionally points to public `/status/503`; that setting was preserved. The current backend success/idempotency regression tests use the deterministic insurer boundary.
- `npm run lint` and `npm run build`: passed. The existing approximately 610 kB bundle warning remains nonblocking.
- New Context tests verify sign-in uses `/session`, coverage conflicts refresh EXPIRED/SUBMITTED state, and failed reconciliation preserves the original error.
- A routed component test uses the real Context and screens with a mocked HTTP boundary: coverage save receives 409, GET returns EXPIRED, the app shows the expired summary, and Start a new quote clears the saved ID and opens the personal form.

## Original verification, 2026-09-11

Executed locally on 2026-09-11 against the real backend, PostgreSQL, Kafka, and public HTTP insurer stand-in.

- `npm test`: 10 tests across 5 files passed.
- `npm run lint`: passed.
- `npm run build`: TypeScript and production build passed. Vite reports a nonblocking bundle-size warning (about 610 kB JavaScript before gzip); route splitting is a possible future optimization, not required for this small flow.
- `npm run test:e2e`: 6 checks passed, with desktop and mobile Chromium configurations. Each covers successful senior submission plus refresh/resume, the age boundary plus back navigation/personal edits, and invalid credentials.
- Desktop and mobile screenshots were inspected for the sign-in, personal details and coverage form. No horizontal overflow was observed in the checked mobile journey. This is not a full accessibility audit or actual Safari device test.
- The reference senior quote shows $327.60 and the summary displays the server's calculated result.
- API failure, field-validation and conditional-selection behavior are covered by component tests. A separate backend live check confirmed real external 503, persisted failure, and successful retry of the same quote.

Local URL: http://127.0.0.1:5174. Another project was already listening on localhost port 5173 over IPv6; it was left untouched. The backend CORS origin, scripts and browser tests consistently use the dedicated IPv4 address.

GitHub Actions are optional templates in `docs/ci/` because the existing OAuth login cannot push workflow files. All results above are local validation, not cloud CI. No public site was deployed.
