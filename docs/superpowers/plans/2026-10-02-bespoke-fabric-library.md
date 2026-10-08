# DERVALLON Bespoke Fabric Library Implementation Plan

> **For agentic workers:** Implement the first staged milestone only; do not redesign the site or claim supplier connectivity.

**Goal:** Replace the current unstructured fabric studies with a typed, filterable fabric-library foundation and premium selection step for the existing custom-order preview.

**Architecture:** Keep the existing four-step CustomOrderPage and OrderPreview flow. Add a small typed fabric catalogue in `client/src/lib/orderPreview.ts` with customer-safe fields only; retain supplier/manufacturer fields as optional internal-only metadata that is never rendered. Add local filter state and selection behavior inside the existing fabric step, with all records visibly marked as demo/reference data until verified catalogue data is supplied.

**Tech Stack:** React 19, TypeScript, Vitest, existing DERVALLON CSS and responsive custom-order styles.

**Spec:** `/home/ubuntu/upload/pasted_content.txt`, sections 2–3 and implementation order items 1–2.

## Global Constraints

- Do not redesign the entire website or change branding, logo, typography, imagery, navigation, or approved aesthetic.
- Do not undo Fit profile validation.
- Do not invent supplier integrations, credentials, real-time availability, genuine stock, or wholesale/supplier cost claims.
- Demo fabric records must be explicitly labelled as reference/demo data.
- Supplier cost and internal manufacturer codes must never render customer-side.
- Existing save-for-later behavior and local-preview disclosures must remain intact.

## Review Focus

- Filtering must never make unavailable or discontinued demo records appear selectable.
- Customer-facing markup must not expose internal supplier fields or cost fields.
- Resetting filters must preserve the current selection and not silently change the draft.
- Mobile controls must remain large, readable, and keyboard accessible.
- Empty filter results must be calm and actionable, with a reset control.

---

### Task 1: Typed fabric catalogue

**Files:**
- Modify: `client/src/lib/orderPreview.ts`
- Test: `client/src/pages/CustomOrderPage.test.tsx` or focused fabric test

**Produces:** `FabricStudy` type and a small `fabricStudies` array with `reference`, `name`, `colour`, `pattern`, `composition`, `weight`, `season`, `formality`, `garments`, `availability`, `availabilityNote`, `priceBand`, `tone`, `caption`, and optional internal-only fields.

- [ ] Add a failing test proving each demo record has customer-safe metadata and no discontinued/unavailable record is selectable.
- [ ] Run the focused test and confirm the expected failure.
- [ ] Add the typed records and `isFabricSelectable()` helper.
- [ ] Run the focused test and confirm it passes.

### Task 2: Fabric selection and filters

**Files:**
- Modify: `client/src/pages/CustomOrderPage.tsx`
- Modify: `client/src/pages/custom-order.css`
- Test: `client/src/pages/CustomOrderPage.test.tsx`

**Produces:** Filter controls for colour, pattern, season, and formality; reset control; empty state; safe availability badges; selected fabric reference and metadata in the existing step and review.

- [ ] Add failing render assertions for filter labels, demo disclosure, availability text, and reset control.
- [ ] Run the focused test and confirm the expected failure.
- [ ] Implement progressive filter controls and filtered cards without changing the step count or navigation model.
- [ ] Add responsive styling using existing ivory/navy/brass tokens and large mobile tap targets.
- [ ] Run focused tests and confirm they pass.

### Task 3: Verification and checkpoint

**Files:**
- No additional production files unless verification exposes a scoped defect.

- [ ] Run `pnpm exec vitest run --reporter=dot`.
- [ ] Run `pnpm run check`.
- [ ] Run `pnpm run build`.
- [ ] Exercise filters, reset, unavailable-state behavior, selection, and mobile layout in the browser.
- [ ] Review `git diff --check` and confirm no supplier cost/internal code appears in rendered customer markup.
- [ ] Save a WebDev checkpoint describing the demo-only fabric milestone and remaining gaps.

**Explicit gap after this milestone:** No real fabric catalogue import, staff availability editor, retail-price calculation, checkout, secure account storage, DERVALLON internal review workflow, supplier export, or manufacturer integration is included until verified business and supplier data are provided.
