# Stella reference catalogue implementation plan

**Goal:** Publish 209 separately identifiable manufacturer references in the existing Custom Order fabric step, using the four supplied ZIP archives and their original JPEG bytes, with no invented specifications.

**Source and contract:** `1000TWISTS.zip` (41), `HERITAGE.zip` (61), `KALEIDOLUX.zip` (54), `NEWEMPIRE.zip` (53). Original filename stem is a **source reference**, not a validated SKU, stock or availability claim. Retain all four exact-byte duplicate photograph pairs as eight distinct records. The four pre-existing illustrative directions remain selectable for existing local drafts; new Stella references use namespaced IDs and no inferred colour/composition/season/price.

**Files:** `client/src/content/stellaFabrics.json` contains the immutable source-backed record list and hosted original-image paths; `client/src/content/stellaFabrics.ts` exposes typed records and collection counts; `client/src/lib/orderPreview.ts` accepts the new IDs without changing the previous data contract; `client/src/pages/CustomOrderPage.tsx` adds a compact collection browser with paged swatch cards within the fabric stage; `client/src/pages/custom-order.css` styles only these additions. `client/src/content/stellaFabrics.test.ts` and existing wizard tests cover counts, duplicate references, filtering, images and draft compatibility. An external importer in `/home/ubuntu/drevallon-audit/` archives provenance and storage mappings; original ZIPs remain unchanged.

**Tasks and gates:**
1. Re-audit ZIP CRC, image decode and SHA-256 per member; assert 41+61+54+53, 209 unique (collection, code), four duplicate-image pairs, no accidental cross-collection mapping.
2. Write failing tests for the 209-record catalogue, grouped counts, image provenance and selector behavior.
3. Extract originals outside the WebDev repository; verify each extracted byte hash; upload each reference under a separate storage key, record the returned URL, and verify all 209 image responses and a representative hash (original data unchanged).
4. Generate the static catalogue from the verified register and storage manifest, preserving source archive/member/filename/hash. Integrate a paginated, collection-filtered selector into the existing four-step wizard with legacy draft IDs preserved. Use neutral labels only; never imply order placement or stock.
5. Run focused and full Vitest, TypeScript and a clean production build; verify 209 source mappings and built lazy CSS/JS assets. Exercise the new fabric step and later wizard stages on desktop/mobile preview, then save a checkpoint. **Do not deploy until all checks pass.** If WebDev publishing is unavailable, report the deployment block, leave the current live site untouched, and do not claim production success.

**Non-goals:** No homepage/navigation/account/product/brand edits; no manufacturer connection or inferred properties; no fabric-photo retouching, resizing or substitution; no order submission. Four duplicated images are not merged or 'corrected'.
