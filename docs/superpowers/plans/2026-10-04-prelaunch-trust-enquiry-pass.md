# DERVALLON Pre-launch Trust and Enquiry Pass Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove remaining prototype-style public wording, improve the truthful enquiry and information experience, and preserve the approved DERVALLON visual system without adding commerce or backend systems.

**Architecture:** Keep the existing React/Wouter static frontend and local-only behavior. Modify only existing copy and conditional sections in `DrevallonPages.tsx`, shared content in `siteContent.ts`, and focused regression tests. The enquiry form must remain explicitly local-only because no confirmed external destination exists.

**Tech Stack:** React 19, TypeScript, Wouter, Vitest/jsdom, Vite, existing CSS tokens.

**Spec:** `/home/ubuntu/upload/pasted_content.txt`

## Global Constraints

- Preserve the current dark luxury aesthetic, typography, imagery, layouts, navigation, hover behavior, Design Studio, product pages, and mobile logo-free navigation.
- Always spell the brand exactly `DERVALLON`.
- Do not invent pricing, inventory, product specifications, production, delivery, policies, contact destinations, APIs, authentication, databases, checkout, payments, or manufacturer integrations.
- No fake success messages or pretend enquiry submissions.
- Keep the current Start an enquiry and Design Studio/customisation paths.

## Review Focus

- Product/category labels must feel like customer-facing collection browsing, not internal review material.
- Enquiry completion must never imply that a message reached DERVALLON without a verified destination.
- Information must be concise and non-duplicated without inventing legal or operational policies.
- Account must show only currently useful saved-design and fit-direction functions; hide empty order-history scaffolding.
- Phone, tablet, and desktop routes must retain navigation, buttons, forms, wrapping, image scaling, and footer integrity.

---

### Task 1: Public copy and state cleanup

**Files:**
- Modify: `client/src/pages/DrevallonPages.tsx`
- Modify: `client/src/content/siteContent.ts`
- Test: `client/src/pages/PrelaunchTrust.test.tsx`

- [ ] Write failing source/render regressions for removal of `Concept study`, `future conversation`, `Coming later`, `begins accepting orders`, `collection develops`, and duplicated/incomplete Information copy; assert the enquiry form remains explicitly local-only and does not claim delivery.
- [ ] Run the focused test and confirm failure is caused by the current public wording/sections.
- [ ] Replace only the targeted labels and prose with concise emerging-brand language; remove the empty order-history card; keep product descriptions and pathways unchanged.
- [ ] Keep the enquiry confirmation honest: local device note only, no external-send claim.
- [ ] Keep Information to one concise customer-facing notice about approved details being added as they are ready, without listing fabricated policies.
- [ ] Run focused and full Vitest suites.

### Task 2: Verification and responsive trust QA

**Files:**
- Modify: none unless a genuine QA issue is found.
- Test: existing project tests plus browser QA harness.

- [ ] Run `pnpm run check` and `pnpm run build`.
- [ ] Scan active source for the targeted prototype phrases and inconsistent `DERVALLON` spelling.
- [ ] Browser-check `/`, `/collections`, all category routes, `/product/the-assembly-suit`, `/studio`, `/account`, `/contact`, `/information` at 390px, 768px, and 1440px.
- [ ] Confirm no horizontal overflow, broken images, console/page errors, misleading enquiry success, or mobile drawer logo.

### Task 3: Checkpoint

- [ ] Review `git diff --check` and scope.
- [ ] Save a descriptive WebDev checkpoint only after fresh tests, build, and responsive QA pass.
- [ ] Stop after the checkpoint; do not begin commerce, auth, databases, or integrations.
