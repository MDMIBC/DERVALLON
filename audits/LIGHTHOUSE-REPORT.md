# DREVALLON Lighthouse audit

**Audit date:** 2026-09-25 07:34 UTC  
**Target:** Current DREVALLON preview homepage  
**Lighthouse:** 12.8.2  
**Categories:** Performance, Accessibility, Best Practices, SEO

## Scores

| Category | Score | Interpretation |
|---|---:|---|
| Performance | 50 | Poor in this preview run; strongly affected by the development server, debug runtime, and uncompressed preview resources. |
| Accessibility | 90 | Good foundation, with remaining contrast and discernible-link findings to inspect. |
| Best Practices | 82 | Main finding is one deprecated API warning; validate again against a production build. |
| SEO | 92 | Good baseline; the preview's invalid robots.txt response is the main reported issue. |

## Core metrics

| Metric | Result | Assessment |
|---|---:|---|
| First Contentful Paint | 11.7 s | Poor in the preview run |
| Largest Contentful Paint | 20.6 s | Poor in the preview run |
| Cumulative Layout Shift | 0.001 | Excellent |
| Total Blocking Time | 270 ms | Needs improvement |
| Speed Index | 11.7 s | Poor in the preview run |
| INP | Not reported by Lighthouse | Requires field data or an interaction trace |

## Highest-impact diagnostics

1. **Render-blocking resources:** estimated 1,290 ms savings. Re-run against the production deployment before changing the source; the preview injects Vite/development resources that will not ship.
2. **Preload the LCP image:** estimated 1,650 ms savings. The hero now has `fetchPriority="high"` and responsive AVIF/WebP sources; add an explicit responsive preload in production only after the final campaign hero asset is approved.
3. **Main-thread work:** 3.5 s. The current JavaScript bundle is approximately 577 KB minified and includes a broad client-side route/module surface. Route-level code splitting and deferring Design Studio code are the highest-impact fixes.
4. **Unused JavaScript:** estimated 887 KiB. Separate rarely visited routes and remove unnecessary development/runtime code from the production deployment.
5. **Text compression:** estimated 2,658 KiB. Configure Brotli or gzip at the production edge/server; this is primarily an infrastructure/deployment issue.
6. **Modern image formats:** estimated 244 KiB. Responsive AVIF/WebP sources are now wired for the hero and catalogue assets. The remaining finding is likely from other PNG/JPG assets and the preview's resource graph; validate after approved campaign photography replaces the concept imagery.
7. **Back/forward cache:** one failure reason. Inspect the production response and unload/page lifecycle behavior; the current preview/runtime may be responsible.

## Accessibility findings

Lighthouse scored accessibility at **90**. It reported a color-contrast audit failure and a discernible-link-name failure. The source already contains accessible image alternatives, a skip link, native controls, active navigation semantics, focus-visible styling, and the new dialog focus trap/restoration. The remaining findings should be localized with a production axe/Lighthouse run after the campaign images and final content are in place, especially the footer social/icon links and low-opacity editorial text.

## SEO and best-practice findings

SEO scored **92**. Lighthouse reported an invalid robots.txt response with 96 errors; this is expected to be corrected in the production static deployment with a valid `robots.txt` file rather than by changing React page content. Best Practices scored **82**, with one deprecated API warning. Inspect the production browser console to identify the exact API before making a targeted change.

## Important limitation

This is a **preview-server audit**, not a production baseline. The preview includes Vite development modules, debug tooling, source modules, and preview response behavior. The extreme FCP/LCP values should not be used as a launch SLA. Run the same Lighthouse command against the compressed production deployment after approved campaign photography is integrated, then compare scores and metrics using the same device/network settings.

## Implemented in this pass

The hero now uses a smooth 680ms opacity fade once its optimized responsive image fires `load`; errors reveal the fallback rather than leaving the hero invisible. The reduced-motion media query still shortens transitions for users who request reduced motion. The updated source passes TypeScript and production build checks.

## Pending campaign photography replacement

No approved high-resolution campaign photography was available in the uploaded or staged asset directories during this pass. The site still uses clearly labelled concept imagery. Replace the three source slots—hero, suit/catalogue, and interior/editorial—with the approved files, then regenerate the responsive AVIF/WebP derivatives and rerun Lighthouse.
