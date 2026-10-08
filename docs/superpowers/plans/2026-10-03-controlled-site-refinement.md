# Controlled DERVALLON Site Refinement Implementation Plan

> **For agentic workers:** Implement this plan task-by-task with TDD and preserve the existing site identity. Do not redesign or add backend systems.

**Goal:** Refine the existing DERVALLON homepage, navigation, footer, and mobile presentation so the experience feels more premium and launch-ready without changing its visual identity or adding unverified functionality.

**Architecture:** Keep the existing React/Wouter shell and page composition. Make targeted JSX and CSS changes in the shared shell, homepage, and global stylesheet; use existing route data and controls rather than introducing new libraries, APIs, accounts, or payment systems. Add regression tests for the exact navigation/footer/link and responsive behaviors being changed.

**Tech Stack:** React 19, TypeScript, Vite, existing custom CSS, Vitest/jsdom, managed WebDev screenshots.

**Spec:** `/home/ubuntu/upload/pasted_content.txt` (controlled refinement brief, 2026-10-03).

## Global Constraints

- Work on the existing DERVALLON website only.
- This is a controlled refinement pass, not a redesign.
- Brand spelling must always be exactly `DERVALLON`.
- Do not return the knight/crown logo to any header, navigation, hamburger, or mobile navigation area.
- Preserve the existing dark restrained luxury aesthetic, typography direction, hierarchy, imagery, and the section featuring tracks/tops/jackets.
- Do not add backend systems, databases, APIs, payments, accounts, Centi/Senti integrations, production-order logic, fake functionality, pricing, stock, reviews, trust badges, or manufacturing claims.
- Preserve responsive image formats and avoid heavy animation or new libraries.
- Keep temporary/review language where functionality is not real; only refine wording when it remains truthful.

## Review Focus

- Mobile widths must not introduce horizontal scrolling, clipped hero imagery, oversized headings, or unusable CTAs.
- Header and mobile drawer must remain logo-free while retaining clear navigation and accessible close/focus behavior.
- Navigation labels and routes must be consistent with the existing route table; no dead links or duplicate destinations.
- Footer groups must remain honest shells where legal/business content has not been provided; do not invent policy copy.
- Button treatments must stay consistent across hero, section links, footer, and mobile layouts without adding promotional clutter.

---

### Task 1: Homepage spacing and CTA consistency

**Files:**
- Modify: `client/src/pages/DrevallonPages.tsx`
- Modify: `client/src/index.css`
- Test: `client/src/pages/HomeHero.test.tsx`

**Produces:** A restrained homepage polish: balanced hero spacing at desktop/mobile widths, consistent CTA sizing and focus/hover states, and no changes to the protected tracks/tops/jackets section.

- [ ] Add failing assertions for the protected section marker, both hero CTA variants, and responsive homepage rules that prevent overflow.
- [ ] Run the focused homepage test and confirm it fails for the missing/incorrect rule.
- [ ] Make only the minimal JSX/CSS changes required for spacing, CTA consistency, and mobile fit.
- [ ] Run the focused test and confirm it passes.

### Task 2: Navigation and footer structure

**Files:**
- Modify: `client/src/components/DrevallonShell.tsx`
- Modify: `client/src/index.css`
- Modify: `client/src/content/siteContent.ts` only if an existing label or route is demonstrably inconsistent
- Test: `client/src/pages/HomeHero.test.tsx` or a focused shell test

**Produces:** Consistent desktop/mobile category naming, accessible clean mobile navigation, and a more intentional footer grouping for Collections, The House/About, Concierge, Delivery, Returns, Garment Care, Privacy, and Terms without fabricated content.

- [ ] Add failing assertions for the exact footer group labels, logo-free mobile drawer, and route targets.
- [ ] Run focused shell tests and confirm the expected failure.
- [ ] Implement semantic footer groups using existing information-shell routes and clearly labelled content shells where no approved policy text exists.
- [ ] Keep the existing search/account/theme interactions and focus restoration intact.
- [ ] Run focused and full tests.

### Task 3: Copy audit and honest review language

**Files:**
- Modify: `client/src/content/siteContent.ts`
- Modify: `client/src/pages/DrevallonPages.tsx` only where existing copy is materially inconsistent
- Test: existing content/page regression tests

**Produces:** Consistent DERVALLON naming and restrained terminology. Temporary language is not removed where it protects against false claims; repeated wording may be tightened without implying real commerce, production, or delivery.

- [ ] Inventory `concept preview`, `review build`, `demonstration`, `illustrative`, and similar terms.
- [ ] Add or update a regression assertion for the protected honest disclosure.
- [ ] Make only copy-level corrections that preserve truthful behavior.
- [ ] Run the full test suite.

### Task 4: Desktop/mobile visual QA and checkpoint

**Files:**
- No additional production files unless QA reveals a scoped defect.

- [ ] Run `pnpm exec vitest run --reporter=dot`.
- [ ] Run `pnpm run check`.
- [ ] Run `pnpm run build`.
- [ ] Capture the homepage at desktop, tablet, and phone widths with managed WebDev screenshots.
- [ ] Verify no horizontal overflow, no navigation logo, working primary links, intact protected section, and intentional footer stacking.
- [ ] Run `git diff --check` and review scope.
- [ ] Save a WebDev checkpoint describing exactly what changed and what was intentionally left unchanged.

## Explicitly Deferred

The following remain outside this controlled pass: secure accounts, database persistence, real fit profiles, checkout/payment methods, live fabric/stock/pricing, Centi/Senti connectivity, production mapping, manufacturing order submission, order tracking, delivery estimates, legal policy authoring, and new campaign imagery.
