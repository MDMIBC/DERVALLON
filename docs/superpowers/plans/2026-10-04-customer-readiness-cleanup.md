# DERVALLON Customer-Readiness Cleanup Implementation Plan

> **For agentic workers:** Use the native execution approach in this session. Steps use checkbox syntax for tracking.

**Goal:** Remove internal prototype/review language from the public DERVALLON experience while preserving the approved visual system, layouts, imagery, navigation behavior, and truthful product boundaries.

**Architecture:** Keep the existing React/Wouter static frontend and existing page components. Make copy-only changes where customer-facing wording can be truthful; hide incomplete product/account/policy fields where wording would otherwise expose missing business information. Do not add backend, auth, payments, inventory, supplier, or order-routing systems.

**Tech Stack:** React 19, TypeScript, Vite, Wouter, Vitest, CSS tokens in `client/src/index.css`, WebDev preview QA.

**Spec:** `/home/ubuntu/upload/pasted_content.txt`

## Global Constraints

- Always spell the brand exactly `DERVALLON`.
- Preserve the current DERVALLON visual identity, dark refined aesthetic, typography, imagery, section structure, layouts, hover behavior, brand tone, and Design Studio direction.
- Do not invent product specifications, prices, fabric compositions, delivery times, production capabilities, supplier claims, policy text, contact channels, or availability.
- Do not implement checkout, payments, authentication, supplier integrations, order routing, real-time pricing, fabric databases, inventory, or backend infrastructure.
- Do not restore the removed knight/crown logo to the header or mobile navigation.
- Preserve tracks / tops / jackets presentation.

## Review Focus

- Public wording must not expose review-build, prototype, or internal approval language.
- Incomplete product details must be hidden or expressed only as confirmed information, never fabricated.
- Account and contact surfaces must not imply secure auth or external message delivery.
- Policy pages must not present unapproved legal/operational content.
- Desktop, tablet, and phone layouts must retain current structure with no overflow or broken navigation.

## Tasks

### Task 1: Copy inventory and regression coverage

**Files:**
- Modify: `client/src/pages/HomeHero.test.tsx`
- Create: `client/src/pages/CustomerReadiness.test.tsx`

- [ ] Add assertions that public rendered source excludes the targeted internal phrases from homepage, shell, collections, category, product, studio, account, contact, and information copy.
- [ ] Add assertions for truthful customer-facing replacements: brand positioning, browse language, exploratory Design Studio language, and contact guidance without an invented channel.
- [ ] Run focused tests and confirm they fail before production edits.

### Task 2: Homepage, shell, collections, and category cleanup

**Files:**
- Modify: `client/src/content/siteContent.ts`
- Modify: `client/src/components/DrevallonShell.tsx`
- Modify: `client/src/pages/DrevallonPages.tsx`

- [ ] Replace review-build/concept-preview/demonstration wording with concise young-brand customer language.
- [ ] Remove approval/disclaimer notices that are internal rather than useful to customers.
- [ ] Replace category review-filter language with quiet “Refine this edit” controls; keep unavailable facets disabled without exposing implementation language.
- [ ] Keep imagery labels useful and non-fabricated, e.g. “Editorial image” or “Garment study”.

### Task 3: Product, Studio, account, contact, and information cleanup

**Files:**
- Modify: `client/src/pages/DrevallonPages.tsx`
- Modify: `client/src/pages/CustomOrderPage.tsx`
- Modify: `client/src/content/siteContent.ts`

- [ ] Hide unconfirmed product specification rows and replace internal disclaimers with concise, truthful “details will be confirmed with the collection” wording only where needed.
- [ ] Keep Design Studio exploratory, but remove technical/local-preview wording and avoid implying order submission.
- [ ] Simplify Account to working saved-design and fit-exploration surfaces; remove technical storage/auth explanations and hide order history until real data exists.
- [ ] Replace the non-functional contact form with an elegant enquiry message that does not pretend to send; do not invent email or phone details.
- [ ] Hide unapproved policy accordions and leave a concise information message rather than displaying content-shell language.

### Task 4: Verification and responsive QA

**Files:**
- No new production files beyond Tasks 2–3.

- [ ] Run focused and full Vitest suites.
- [ ] Run TypeScript check and production build.
- [ ] Scan public source for forbidden internal phrases and brand spelling variants.
- [ ] Capture desktop, tablet, and phone screenshots for homepage, collections, category, product, studio, account, contact, and information routes.
- [ ] Inspect navigation, overflow, image loading, buttons, section transitions, mobile menu, and footer alignment.
- [ ] Save a WebDev checkpoint only after all checks pass.
