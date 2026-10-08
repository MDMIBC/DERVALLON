# DREVALLON current asset register

**Status:** Review build. This register describes what the active site actually renders; older asset studies are not launch approval.

## Supplied logo — unchanged

| Asset | Active use | Source / status |
|---|---|---|
| `/manus-storage/1000007848_3a47cba1.png` | Homepage full-resolution PNG fallback | The user's 3690×3834 upload; retained byte-for-byte. |
| `/manus-storage/dervallon-exact-master-800_1cb8bbf6.webp`, `...1500_ea847867.webp`, `...lossless_3ec5a643.webp` | Responsive homepage sizes | Downsampled or lossless WebP encodes of the supplied PNG; no creative retouching. |
| `/manus-storage/dervallon-horizontal-lockup-vector_0ea99f59.svg` and `...dark-vector_368fc851.svg` | Existing light/dark header display | Prior site SVG traces of the supplied art, restored unchanged after the owner's most recent instruction. |
| `/manus-storage/dervallon-emblem-small-vector_9cc8ff3e.svg` and `...dark-vector_6b14ff10.svg` | Existing mobile header emblem | Prior compact SVG traces, retained. These are display derivatives, not native print masters. |
| `client/public/favicon.svg`, `.ico`, `apple-touch-icon.png`, `icon-192.png`, `icon-512.png` | Browser/mobile icons | Restored to the previous approved favicon set without altering the logo. |
| `/manus-storage/drevallon-social-preview_15be03c2.png` | Open Graph/Twitter preview | Prior approved preview, retained; use an absolute URL once a production domain exists. |

Both original upload files are also preserved in the portable project's `branding/` directory. **The supplied image reads DERVALLON, while regular website copy reads DREVALLON.** The owner explicitly requested no artwork changes. A newly spelled logo cannot be presented as approved until the owner changes that instruction and approves the artwork; no experimental altered vector was activated or packaged. The original logo SHA-256 is recorded in `branding/` exports and `media-manifest.json`.

## Garment-specific concept photos — NOT launch-approved

| Visual role | Source image | Where shown |
|---|---|---|
| Complete suits | `concept-suits.jpg` | Suits tile, category, product study, Studio summary |
| Shirts | `concept-shirts.jpg` | Shirts tile, category, standalone shirt study |
| Ties | `concept-ties.jpg` | Ties tile, category, six patterned ties study |
| Trousers | `concept-trousers.jpg` | Trousers tile, category, full-shape trouser study |
| Blazers | `concept-blazers.jpg` | Blazers tile, category, standalone blazer study |
| Jackets | `concept-jackets.jpg` | Jackets tile, category, distinct short-jacket study |
| Polo | `concept-polo.jpg` | Individual shirt/polo study, not reused for the shirt tile |
| Workroom | `concept-workroom.jpg` | Supporting editorial workroom image |

These eight images were generated specifically as **visual concepts**; they do **not** depict verified DREVALLON inventory or owner-approved campaign photography. Each has an individually optimized 640px and 1280px AVIF/WebP version plus a JPG fallback. Hosted URLs and truthful alt text live in `client/src/content/campaignMedia.ts`. Fallback and derivative source files are staged in `/home/ubuntu/webdev-static-assets/drevallon/category-refresh/`; a portable copy contains exactly the active variants. The previous stock Shirt/Tie references are no longer used.

**Launch replacement requirement:** Supply six approved garment-category photographs (suit with jacket and trousers, shirt without jacket, multiple distinct ties, full-length trousers, standalone blazer, separate jacket), plus distinct item images where actual catalogue entries differ; provide owner rights/credits and product facts. Replace the eight concept families or approve them explicitly before going public.

## Fonts and portability

Cormorant Garamond and DM Sans Latin WOFF2 files are self-hosted. The portable export rewrites **all active `/manus-storage/` paths** to files under `client/public/media/`; see its `media-manifest.json` for 53 path-to-file mappings, byte sizes and checksums. The managed WebDev project keeps hosted paths to comply with its media rules. No private storage key belongs in source or export.
