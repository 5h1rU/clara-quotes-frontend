# Verification record

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
