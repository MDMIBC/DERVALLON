# DERVALLON website: complete source export

This is the full source code of the DERVALLON luxury menswear website as published at [dervallon.com](https://dervallon.com). It comes from the published release (checkpoint `4e076686`, git commit `4e07668`), with no modifications.

The export also includes copies of every media file the website loads from Manus storage, so you have the complete working site and not just the code.

## What is included

| Folder / file | Contents |
|---|---|
| `client/` | The front end: React 19 + TypeScript (`.tsx`/`.ts`), Vite, Tailwind CSS 4 |
| `client/index.html` | The single HTML entry page; every route is rendered by React from here |
| `client/src/index.css`, `client/src/pages/custom-order.css` | Global theme and page stylesheets (plain CSS with Tailwind 4; the project has no SCSS) |
| `client/src/pages/` | Pages: Home, Collections, Product, Design Studio, Custom Order, My DERVALLON account, Fit profile, information pages |
| `client/src/content/` | Site copy, product content, campaign media map and the 209-reference fabric catalogue (`stellaFabrics.json`) |
| `client/public/` | Favicon, web manifest, robots.txt and other small public files |
| `server/` | Express + tRPC back end: Manus OAuth sign-in, customer accounts, fit profiles, saved designs, orders and wardrobe foundations |
| `drizzle/` | MySQL database schema (`schema.ts`) and SQL migrations |
| `shared/` | Constants and types shared by the client and server |
| `assets/manus-storage/` | **271 media files** (about 158 MB) served at `/manus-storage/...`: fabric swatches, logo/emblem, fonts and campaign imagery. Includes three original source PNG uploads (the logo and two earlier header logos) that only the docs reference |
| `assets/ASSET-MANIFEST.json` | File name, byte size, SHA-256 and storage path for every asset |
| `package.json`, `pnpm-lock.yaml`, `vite.config.ts`, `tsconfig*.json`, `vitest.config.ts`, `drizzle.config.ts`, `components.json`, `.prettierrc` | Build, test and tooling configuration |
| `*.md`, `docs/`, `audits/`, `tools/` | Project notes, brand spec, asset register, Lighthouse audits and QA scripts |

All 209 fabric swatch images in `assets/manus-storage/` match the `sha256` recorded for them in `client/src/content/stellaFabrics.json`. The collections are 1000 TWISTS 41, HERITAGE 61, KALEIDOLUX 54 and NEW EMPIRE 53.

## Requirements

You need Node.js 22, pnpm 10 (`corepack enable`) and a MySQL-compatible database.

## Run locally

```bash
pnpm install
# create a .env file containing the variables listed below
pnpm db:push              # create the database tables
pnpm dev                  # development server on http://localhost:3000
pnpm test                 # 181 Vitest tests
pnpm check                # TypeScript
pnpm build && pnpm start  # production build and server
```

## Environment variables

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | MySQL connection string |
| `JWT_SECRET` | Signs customer session cookies |
| `VITE_APP_ID`, `OAUTH_SERVER_URL`, `VITE_OAUTH_PORTAL_URL` | Manus OAuth sign-in |
| `OWNER_OPEN_ID` | Site owner identity |
| `BUILT_IN_FORGE_API_URL`, `BUILT_IN_FORGE_API_KEY` | Manus storage API used by `/manus-storage/*` |
| `VITE_FRONTEND_FORGE_API_URL`, `VITE_FRONTEND_FORGE_API_KEY` | Front-end Manus API access |
| `PORT` | Optional, defaults to 3000 |

No secret values are included in this export.

## Hosting outside Manus

The code is complete, but three parts depend on Manus services:

1. **Media.** The pages request images and fonts from `/manus-storage/<file>`. On Manus that path is answered by Manus storage (see `server/_core/storageProxy.ts`). To self-host, serve the `assets/manus-storage/` folder at `/manus-storage/` (static files or any CDN). You can do this by replacing `registerStorageProxy(app)` in `server/_core/index.ts` with `app.use("/manus-storage", express.static("assets/manus-storage"))`. File names are unchanged, so no page code needs editing.
2. **Sign-in.** Customer accounts use Manus OAuth (`server/_core/oauth.ts`, `server/_core/sdk.ts`). Another host needs either a Manus OAuth app or a replacement identity provider in those two files.
3. **Database.** Customer data lives in the production MySQL database and is **not** part of this export. Only the schema and migrations are included.

## Security notes

- The session cookie `app_session_id` is deliberately scoped to `Path=/api` (`server/_core/cookies.ts`). This keeps public `/manus-storage` assets working for signed-in customers on the Manus edge.
- Account data is owner-scoped on the server; each customer can read and change only their own records.
- There is no payment, manufacturer or order-transmission integration. Orders and Wardrobe are honest empty-state foundations.
