# My DERVALLON Fit Foundation Implementation Plan

> **For agentic workers:** Execution method supplied by the owner's brief (native, in-session, test-first). Steps use checkbox syntax for tracking.

**Goal:** Turn the existing three-field account fit card into a versioned, unit-aware, scanner-ready body-measurement foundation with separate fit preferences. Reuse it from the existing Custom Order measurement step.

**Architecture:** A pure shared module (`shared/fitMeasurements.ts`) owns the measurement registry, units, deterministic integer conversion, validation and consistency warnings. Client and server both use it. Two additive tables store append-only measurement records and per-customer preferences. Owner-scoped tRPC procedures replace the old `account.fit.get/save`. A dedicated `/account/fit` page hosts the guided flow. The Custom Order step can select, review and confirm the saved profile.

**Tech Stack:** React 19, Wouter, tRPC 11, Zod 4, Drizzle ORM (MySQL), Vitest + jsdom.

**Spec:** `/home/ubuntu/upload/pasted_content.txt` (My DERVALLON Fit / Measurement Foundation brief).

## Audit findings (before modification)

- `fit_profiles` table: one row per user with `height`, `chest`, `waist` (varchar, cm only) and a single `preference` (slim/tailored/regular/relaxed). The live database holds **0 rows**, so there is nothing to migrate.
- `account.fit.get` / `account.fit.save` are protected and owner-scoped through `ctx.user.id`. Their validation ranges are narrow (height 100–250 cm, chest 70–160 cm, waist 55–160 cm), and these hard-reject legitimate bodies.
- `AccountPage` fit card has three inputs plus a preference select. It also auto-migrates the `drevallon-fit-preview` localStorage value into the account.
- Custom Order step 3 has six optional cm-only fields (chest, waist, seat, shoulder, sleeve, inseam). Validation is `> 0` and `≤ 300`. Each field has a guide, a simplified SVG diagram and a local seven-day draft. There is no account integration and no submission.
- The saved-design, orders and wardrobe foundations are unrelated and are preserved unchanged.

## Global Constraints

- Brand spelling: DERVALLON.
- The Stella catalogue is locked: `client/src/content/stellaFabrics.*` and the swatches are not touched. Counts stay 41/61/54/53 = 209.
- No manufacturer codes, ease, formulas, size conversions, tolerances, API fields or scan functionality.
- Body measurements stay separate from future garment/production measurements.
- Units are cm and in. The original entered value and unit are preserved, and conversion is deterministic integer arithmetic.
- Unusual-but-possible values produce a "Please check this measurement" warning. Only clearly impossible or malformed input blocks.
- No changes to homepage, navigation, branding, product pages, fabric catalogue/filters, checkout, payment or unrelated account functionality.

## Review Focus

- A customer types inches while cm is selected (e.g. chest 40). Expect a non-blocking unit hint with a one-click unit switch, never silent conversion.
- A legitimate large or small body. Expect a warning, not a rejection, for anything not physically impossible.
- A returning customer reaches Custom Order review. Expect explicit "still current" confirmation and a visible last-updated date before the profile is used.
- A crafted request with another `userId`, a non-manual `source` or client-side canonical values. Expect the server to ignore them and derive all three itself.
- Switching unit after typing. Expect the number unchanged and only its unit label changed, with the equivalent shown read-only.

## Tasks

1. **Shared measurement model** (`shared/fitMeasurements.ts`, test `shared/fitMeasurements.test.ts`): registry, parse, exact µm conversion, display, validation, unit-confusion hints, consistency warnings, sources and preference options.
2. **Schema + migration** (`drizzle/schema.ts`, generated `drizzle/0001_*.sql`): additive `fit_measurement_records` and `fit_preferences`. The legacy `fit_profiles` table is left untouched.
3. **Owner-scoped persistence** (`server/fitDb.ts`, test `server/fitDb.test.ts`): query builders filtered by `userId`, plus append-only versioning.
4. **Router** (`server/fitRouter.ts`, mounted in `server/routers.ts`, tests `server/fit.router.test.ts` and updated `server/account.router.test.ts`).
5. **Guided page** (`client/src/pages/FitProfilePage.tsx`, `fit-profile.css`, route `/account/fit`, metadata line, test `FitProfilePage.test.tsx`).
6. **Account card summary** (`DrevallonPages.tsx` fit card only; updated `FitProfile.test.tsx`).
7. **Custom Order integration** (`CustomOrderPage.tsx` measurement/review/summary only, appended `custom-order.css`, tests in `CustomOrderPage.test.tsx`).
8. **Verification:** full suite, TypeScript, clean build, catalogue fingerprint, and desktop/mobile browser QA in preview and on the published site after checkpoint.

## Execution log

- Pre-change catalogue fingerprint saved to `/home/ubuntu/drevallon-audit/fit-pre-catalogue.sha256`: `stellaFabrics.json` is `f19d5dd3…c9c4d` and `stellaFabrics.ts` is `565557d1…0a750`.
- Baseline before the work: 14 test files, 82/82 tests passing, clean at `5bf20c2`.
- Live DB (read-only SQL): `fit_profiles` has 0 rows and `users` has 1. Tables: users, fit_profiles, saved_designs, orders, wardrobe_items. `DATABASE_URL` is not set in the shell, so use `webdev_execute_sql` to apply migrations. `drizzle-kit generate` needs a dummy `DATABASE_URL` for its config only.
- Task 1 done: `shared/fitMeasurements.ts` plus `server/fitMeasurements.shared.test.ts`. RED was observed (module missing), then GREEN at 14/14. The test file is under `server/` because the Vitest include list does not cover `shared/`.
- Task 2 done: additive migration `drizzle/0001_gigantic_gargoyle.sql` (two CREATE TABLEs + FK, no DROP/ALTER of existing tables) applied via `webdev_execute_sql`.
- Zod request schemas live in `shared/fitSchemas.ts` (server only) so client bundles do not include zod.
- Tasks 3–4 done: `server/fitDb.ts` (+3 tests) and `server/fitRouter.ts` mounted as `account.fitProfile` (+7 tests). The old `account.fit.get/save` and the narrow cm-only ranges were removed. `account.router.test.ts` was updated. RED, then GREEN.
- Task 5 done: `FitProfilePage.tsx`, `fit-profile.css`, route `/account/fit`, metadata line. 9/9 tests. Legacy `drevallon-fit-preview` values are offered for review (in cm) and never saved silently.
- Task 6 done: the account fit card is now a summary with links to `/account/fit` and `/custom-order`. Its silent legacy-fit auto-migration was removed. 2/2 tests.
- Task 7 in progress: `CustomOrderFit.test.tsx` (4 tests) RED. Design: default mode is manual (existing behaviour unchanged). The `fit-mode` radio offers `saved`, and saved mode requires the `fit-still-current` checkbox before Continue. Review shows `[data-review-fit]` and the summary shows `Fit profile vN`. The confirmation resets on mode switch, version change, restore and restart.
- Task 7 done: GREEN 4/4 and existing Custom Order tests 25/25. The edit script is at `/home/ubuntu/drevallon-audit/apply-custom-order-fit.py`.
- Static verification: full suite 19 files / 119 tests pass, `pnpm run check` clean, clean `pnpm run build` OK (new chunks `FitProfilePage-*.js/css`), no zod in client chunks. Catalogue fingerprint OK, counts 41/61/54/53 = 209.
- Preview browser QA (owner account signed in via real Manus OAuth): the signed-out gate renders, and the signed-out API returns 401. New-customer overview, guided step 1 (height 182 cm shows "about 71.65 in") and step 2 all render. Chest 40 with cm shows "Please check this measurement… typical in inches. Switch to in" without blocking. Test values must be removed from the owner account after QA (use Remove my fit profile).
- Browser QA continued: signed-in DB rows confirmed the original value/unit persist with µm canonical values. The version 2 update kept version 1 in history. Custom Order saved-fit mode was blocked until "still current" was confirmed, and the Review shows "Fit profile v2". The 390px overflow was fixed with `min-width: 0` on the flow column and `minmax(0, 1fr)` on the measurement list. Containment probe at 320/390 across all five sections shows no overflow.
- Found during QA: while the fit query was loading or had failed, the page and the account card showed "Not yet measured" / "No measurements saved yet" for a customer who had a profile. Fixed test-first: a loading status, plus a retryable error with Try again, on `/account/fit`, and loading/error copy on the account card. +3 tests (RED, then GREEN).
- Final static verification: 19 files / 122 tests pass, TypeScript clean, clean production build OK, and `client/src/content/` identical to `3adcb1b`. Stella preview QA shows 41/61/54/53 at 1365 and 390, the first swatch decodes, and HERITAGE:2701 reaches Review with no errors.
- QA data removed through the in-product two-step removal. DB afterwards: fit_measurement_records 0, fit_preferences 0, fit_profiles 0. The users (1) and saved_designs (1) rows are untouched. The temporary QA session token and its mint script were deleted.
