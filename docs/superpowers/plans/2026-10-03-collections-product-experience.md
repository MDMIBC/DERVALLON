# DERVALLON Collections and Product Experience Implementation Plan

> **For agentic workers:** Implement this plan task-by-task with TDD. Preserve the approved DERVALLON identity and do not add backend or commerce systems.

**Goal:** Upgrade Collections, category browsing, reusable product cards, and product-detail presentation into a restrained luxury retail experience that is ready for future made-to-measure work without claiming live commerce.

**Architecture:** Extend the existing `Product` content model with optional, customer-safe presentation fields. Refine the existing `CollectionsPage`, `CategoryPage`, `ProductCard`, and `ProductPage` structures instead of introducing a new store template. Use front-end-only filter state and existing concept imagery; omit unverified price, stock, material, supplier, delivery, and production data.

**Tech Stack:** React 19, TypeScript, Wouter, existing CSS design system, Vitest/jsdom, managed WebDev screenshots.

**Spec:** `/home/ubuntu/upload/pasted_content.txt` (2026-10-03 Collections/Product stage).

## Global Constraints

- Brand spelling is exactly `DERVALLON`.
- Preserve the dark restrained luxury aesthetic, current typography, navigation, footer, homepage, hero, approved editorial areas, tracks/tops/jackets area, About, Account/Fit, Concierge, Information, and Design Studio.
- Keep the knight/crown logo out of all header and mobile navigation areas.
- Front-end presentation only: no checkout, cart backend, payment, authentication, database, permanent accounts, inventory, pricing engine, shipping, order tracking, Senti/Centi integration, factory codes, production logic, or Private Digital Tailor logic.
- Do not invent prices, materials, mills, stock, reviews, production times, remakes, returns, shipping guarantees, or manufacturer claims.
- Preserve honest concept/demo labeling wherever product data is unverified.

## Review Focus

- Optional product fields must be omitted or visibly marked as unverified; empty metadata must not render as fabricated facts.
- Filters must be clearly presentation-only and must not imply live inventory.
- Product cards and CTAs must remain usable at small phone widths without wrapping or overflow.
- Product detail must distinguish saving a study, customising a concept, and future purchasing.
- Related products must use existing concept products and avoid aggressive upselling.

---

### Task 1: Safe product presentation model and reusable card

**Files:** `client/src/content/siteContent.ts`, `client/src/pages/DrevallonPages.tsx`, `client/src/pages/ProductPage.test.tsx` or a new focused card test.

Add optional customer-safe fields such as `fabricName`, `colour`, `pattern`, `fitSummary`, `customisable`, and `supportingImages` only where verified or intentionally absent. Refine the shared `ProductCard` to render image, name, category, short description, optional metadata, a restrained concept/customisable indicator, and a clear `View garment` destination. Never render invented values.

- [ ] Write failing tests for optional-field omission, concept labeling, and a clear view-product CTA.
- [ ] Run the focused tests and confirm the expected failure.
- [ ] Implement the smallest typed model/card change.
- [ ] Run focused and full tests.

### Task 2: Collections page and category browsing

**Files:** `client/src/pages/DrevallonPages.tsx`, `client/src/index.css`, `client/src/pages/CollectionsPage.test.tsx` or existing page tests.

Refine Collections hierarchy, category access, spacing, image proportions, and card layout using the current six categories and imagery. Add a compact front-end-only filter strip to category pages for appropriate facets such as Colour, Fabric, Pattern, Season, Fit, and Occasion. Filters may update visible study cards only when matching data exists; otherwise they remain clearly labelled as review controls and must not imply live stock.

- [ ] Add failing tests for all six category links, filter labels, concept disclosure, and no stock/pricing claims.
- [ ] Verify the tests fail for the missing structure.
- [ ] Implement the editorial browsing and filter presentation without changing the homepage or approved navigation.
- [ ] Run focused and full tests.

### Task 3: Product-detail structure and customisation path

**Files:** `client/src/pages/DrevallonPages.tsx`, `client/src/index.css`, `client/src/pages/ProductPage.test.tsx`.

Extend the existing product page with reusable areas for supporting images, safe optional fabric/colour/pattern metadata, fit guidance, care, delivery/returns placeholders, save-study behavior, related concept studies, and a clearly labelled `Customise this suit` path for suitable garments. The CTA leads to the existing Design Studio or custom-order preview only; it must not imply an order, payment, live availability, or factory submission.

- [ ] Add failing tests for the customisation CTA target, safe metadata omission, supporting-image slots, save-study distinction, and related products.
- [ ] Verify expected failures.
- [ ] Implement the existing editorial structure with honest fallbacks.
- [ ] Run focused and full tests.

### Task 4: Responsive/accessibility QA and checkpoint

**Files:** `client/src/index.css`, tests, and only directly affected page files.

- [ ] Run `pnpm exec vitest run --reporter=dot`.
- [ ] Run `pnpm run check`.
- [ ] Run `pnpm run build`.
- [ ] Capture Collections, one category page, and one product page at phone, tablet, and desktop widths.
- [ ] Verify no horizontal overflow, readable headings, touch-sized controls, correct image loading, visible focus states, and no header/mobile logo regression.
- [ ] Run `git diff --check` and review scope.
- [ ] Save a WebDev checkpoint describing functional versus demo-only behavior.

## Deferred to Manus Max

Backend catalog integration, live fabric library, Senti/Centi IDs, factory mappings, pricing, inventory, checkout, payments, carts, authentication, persistent wardrobe, order submission, shipping, returns guarantees, order tracking, and Private Digital Tailor logic.
