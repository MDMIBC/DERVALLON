# DERVALLON Authenticated Customer Account System

## Capability map

| Module | Responsibility | Depends on |
|---|---|---|
| identity | Manus OAuth sign-in, sign-out, protected account shell, profile updates | — |
| fit | Customer-owned fit profile and validation | identity |
| designs | Customer-owned saved Design Studio directions | identity |
| orders | Empty, customer-owned order foundation with no fabricated order data | identity |
| wardrobe | Empty, customer-owned wardrobe foundation for future confirmed garments | identity |
| repair | `/custom-order` runtime diagnosis and production-safe loading | — |

Build order: identity → fit/designs/orders/wardrobe → account UI → custom-order repair → verification.

## Assumptions

1. Authentication uses the existing Manus OAuth integration already supplied by the WebDev full-stack upgrade; account creation is the first successful OAuth sign-in.
2. Customer data is stored in the supplied MySQL/TiDB database through Drizzle and protected by server-side ownership checks using the authenticated `ctx.user.id`.
3. No password collection, manufacturer integration, order transmission, inventory sync, tracking, or payment processing is included in this milestone.
4. Existing local Fit and Design Studio values are migrated opportunistically after sign-in, only into the current authenticated user's records, and then remain server-backed.

## Data model

- `fitProfiles`: one row per user, validated centimetre measurements and fit preference.
- `savedDesigns`: many rows per user, serialized Design Studio choices and optional note; no product/order claims.
- `orders`: future-safe user-owned records only; no UI rows are created until a real order flow exists.
- `wardrobeItems`: future-safe user-owned records only; no UI rows are created until a confirmed garment exists.

Every table includes a required `userId` foreign-key-like owner column and indexes for owner lookup. Procedures never accept a user id from the client; they derive ownership from `ctx.user.id`.

## Account experience

The existing DERVALLON Account page remains visually intact and becomes a protected My DERVALLON area with sections for:

- profile identity and sign-out
- My DERVALLON Fit
- Saved Designs
- My Orders
- My DERVALLON Wardrobe

Empty states explicitly say when no real data exists. No fake orders, statuses, tracking, manufacturer details, delivery dates, or fabric availability are rendered.

## Testing and verification

- Server unit tests cover protected access, owner-scoped reads/writes, profile validation, design CRUD, and empty orders/wardrobe results.
- Client tests cover the protected account shell and empty states.
- The custom-order page is verified directly at `/custom-order` in the dev server and after `pnpm run build` plus production start.
- Required commands: `pnpm exec vitest run`, `pnpm run check`, `pnpm run build`, and browser checks for public home/hero preservation, account auth gating, and `/custom-order`.

## Boundaries

- Always: validate input with Zod, use protected tRPC procedures, derive ownership server-side, preserve the crowned-knight homepage hero, and keep customer-facing copy truthful.
- Ask first: adding a different auth provider, changing the approved brand system, or enabling manufacturer/payment/order transmission.
- Never: expose service credentials, trust a client-supplied user id, fabricate business records, or connect to SentiCentoria/manufacturer systems.
