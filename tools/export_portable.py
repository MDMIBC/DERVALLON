#!/usr/bin/env python3
"""Export a fully self-contained Vite build without changing the managed WebDev project."""
from __future__ import annotations
import hashlib
import json
from pathlib import Path
import re
import shutil

source = Path('/home/ubuntu/drevallon-site')
dest = Path('/home/ubuntu/drevallon-delivery/drevallon-portable')
asset_root = Path('/home/ubuntu/webdev-static-assets/drevallon')
photo_root = asset_root / 'category-refresh'
font_root = asset_root / 'fonts'
logo_source = Path('/home/ubuntu/upload/1000007848.png')
if dest.exists(): shutil.rmtree(dest)
shutil.copytree(source, dest, ignore=shutil.ignore_patterns('node_modules', 'dist', '.git', '.manus-logs', 'audits', 'tools', '*.log', '.project-config.json', 'template.json', '__manus__'))
media_dir=dest/'client/public/media'
media_dir.mkdir(parents=True,exist_ok=True)
pattern=re.compile(r'/manus-storage/([\w.\-]+)')
text_files=[dest/'client/index.html',*dest.glob('client/src/**/*.tsx'),*dest.glob('client/src/**/*.ts'),*dest.glob('client/src/**/*.css')]
refs={name for file in text_files for name in pattern.findall(file.read_text())}
manifest=[]
for name in sorted(refs):
    clean = re.sub(r'_[0-9a-f]{8}(?=\.)','',name)
    candidates=[photo_root/clean, asset_root/clean, font_root/clean]
    if clean == '1000007848.png': candidates.insert(0,logo_source)
    local=next((path for path in candidates if path.is_file()),None)
    if local is None: raise FileNotFoundError(f'Missing portable asset {name}: looked for {candidates}')
    target=media_dir/name
    shutil.copy2(local,target)
    manifest.append({'local_url':'/media/'+name,'file':'client/public/media/'+name,'original_name':clean,'size':target.stat().st_size,'sha256':hashlib.sha256(target.read_bytes()).hexdigest(),'role':('generated concept image' if name.startswith('concept-') else 'uploaded original / derivative' if name.startswith('dervallon-') or name.startswith('1000007848') else 'web font' if name.endswith('.woff2') else 'logo-derived social preview' if 'social-preview' in name else 'decorative grain')})
for file in text_files:
    content=file.read_text().replace('/manus-storage/','/media/')
    file.write_text(content)
# Keep the original supplied artwork and a clear distinction between original and previously derived display versions.
brand=dest/'branding';brand.mkdir(exist_ok=True)
for src_name,dst_name in [('dervallon-knight-logo.png','supplied-logo-original-1230.png'),('1000007848.png','supplied-logo-high-resolution-3690.png')]:
    shutil.copy2(Path('/home/ubuntu/upload')/src_name,brand/dst_name)
for basename in ['dervallon-emblem-small-vector.svg','dervallon-emblem-small-dark-vector.svg','dervallon-horizontal-lockup-vector.svg','dervallon-horizontal-lockup-dark-vector.svg']:
    shutil.copy2(asset_root/basename,brand/basename)
for basename in ['OFL-Cormorant.txt']:
    shutil.copy2(asset_root/'refined-brand'/basename,brand/basename)
for icon in ['favicon.ico','favicon.svg','apple-touch-icon.png','icon-192.png','icon-512.png']:
    shutil.copy2(source/'client/public'/icon,brand/icon)
(brand/'README.md').write_text('''# Supplied DREVALLON website logo — unchanged

The two PNG files below are byte-for-byte copies of the owner's uploads. They have not been recolored, lettered, cropped, traced, sharpened, or redrawn:

- `supplied-logo-original-1230.png`: SHA-256 `973fc0c56acbfc17a95631ebc67c6406c07d589d1119beb04e85f7f95a56206a`.
- `supplied-logo-high-resolution-3690.png`: SHA-256 `94219de8d31ee9d4d79cf35ceb78e968236acd51f7d569c9371f79235dc5793b`.

The `dervallon-*.svg` files are previously active header display traces from an earlier site version, restored to the website unchanged. They are *not* a newly approved or print-ready original vector logo. The icon files likewise match the prior website favicon set. The owner's latest instruction superseded the proposed wordmark redesign. The supplied artwork spells **DERVALLON**; ordinary site copy spells **DREVALLON**. We have not edited the logo to close this gap.
''')
(dest/'media-manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
# The managed project uses a developer-only storage proxy and debug hook; exported Vite must work without either.
(dest/'vite.config.ts').write_text('''import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { defineConfig } from "vite";
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { alias: {
    "@": path.resolve(import.meta.dirname, "client", "src"),
    "@shared": path.resolve(import.meta.dirname, "shared"),
    "@assets": path.resolve(import.meta.dirname, "attached_assets"),
  } },
  root: path.resolve(import.meta.dirname, "client"),
  build: { outDir: path.resolve(import.meta.dirname, "dist/public"), emptyOutDir: true },
  server: { host: true, port: 3000 },
});
''')
index=dest/'client/index.html'
index.write_text(re.sub(r'\s*<script\s+defer\s+src="%VITE_ANALYTICS_ENDPOINT%/umami"[^>]*></script>','',index.read_text()))
# The exported source is a local frontend project, not a managed WebDev project.
(dest/'README.md').write_text('''# DREVALLON — portable preview website

A standalone React/Vite preview of the existing DREVALLON menswear website. Every image, logo display asset, icon, social card and font referenced by the site is packaged in `client/public/media/` or `client/public/`. No Manus storage credentials, analytics hook, external font service, or Manus-only build plugin is required.

## Run it

- Requirements: Node 22 and pnpm 10.
- `pnpm install --frozen-lockfile`
- `pnpm check` and `pnpm exec vitest run`
- `pnpm dev` for local development, or `pnpm build && pnpm start` for a production preview.
- Browser routes are SPA routes; deploy with a fallback to `index.html`. The included Express server serves this fallback and negotiates Brotli/gzip for compressible responses.

## Important review boundaries

- This remains a **preview**, not a live shop, order API, payment flow, account service or connected contact/tailor channel.
- The custom-order preview keeps reference photos only in the current browser session and saves measurements/fabric choices to localStorage **only when Save for Later is clicked**. Saved drafts expire after seven days.
- Category visuals are generated **concept imagery**. They are not approved campaign photography or representations of DREVALLON inventory. Owner review and usage approval are required before public launch.
- **Logo exception:** The latest owner instruction was to leave the supplied logo unchanged. The supplied artwork visibly spells **DERVALLON**; the website’s name and text remain **DREVALLON**. The source images have not been retouched. `branding/` contains the unmodified supplied logos and existing site display derivatives, which are not native print-ready vector masters. A corrected wordmark requires the owner’s separate approval.
- The site has no verified social-profile URLs, so generic social-platform links are not published.
- Set a canonical production origin and absolute social-sharing image URL when a final domain is assigned.

`media-manifest.json` lists each of the hosted asset paths rewritten to a portable local URL, with SHA-256 values. The original source and concept-image provenance notes remain in `asset-register.md` and `EXTERNAL-SOURCE-NOTES.md`. See `CUSTOM-ORDER-PREVIEW.md` for wizard scope and privacy constraints.
''')
# Assert no hidden hosted-media dependency remains in active source or index.
missing=[]
for file in text_files:
    body=file.read_text()
    if '/manus-storage/' in body or '%VITE_ANALYTICS_ENDPOINT%' in body: missing.append(file)
    for name in re.findall(r'/media/([\w.\-]+)',body):
        if not (media_dir/name).is_file(): missing.append(file)
if missing: raise RuntimeError(f'Unresolved portable references: {missing}')
print(f'Exported {len(manifest)} active assets ({sum(x["size"] for x in manifest)/1e6:.1f} MB) to {dest}')
print(f'Brand backup: {brand} (supplied art unchanged)')
