# DREVALLON accessibility and performance review

**Scope:** Rendered homepage and shared shell, source inspection, live browser DOM probe, production build output, and representative contrast calculations. **Standard:** WCAG 2.1 AA with selected WCAG 2.2 guidance. **Date:** 2026-09-25.

## Executive summary

The current review build has a strong semantic foundation: navigation uses native links and buttons, meaningful imagery has alternative text, decorative gallery duplicates use empty alternatives, visible focus styles exist, and the mobile navigation targets are comfortably sized. The main remediation applied in this pass adds a skip link, makes the hero a semantic high-priority image, adds asynchronous image decoding, and corrects two light-surface contrast risks. The site should not yet be described as fully WCAG-conformant without a Lighthouse or axe run, a keyboard-only pass through every route, and screen-reader testing. The most important remaining accessibility issue is dialog focus management for the search panel and mobile menu.

## Accessibility findings

| Area | Finding | WCAG | Status / recommendation |
|---|---|---|---|
| Text alternatives | The hero was previously a CSS background with no accessible name. It is now a semantic `<img>` with descriptive alt text. | 1.1.1 | **Fixed** |
| Text alternatives | Rendered content images and product cards have descriptive alternatives. Repeated product thumbnails are intentionally `alt=""` because they duplicate the primary image. | 1.1.1 | **Pass by inspection** |
| Keyboard access | Native links, buttons, form controls, details/summary, and the theme toggle are keyboard operable. | 2.1.1 | **Pass by source inspection** |
| Focus visibility | Global `:focus-visible` outlines are present with brass styling; the new skip link is visible when focused. | 2.4.7 | **Pass by source inspection** |
| Bypass blocks | A `Skip to main content` link now precedes the sticky header and targets `#main-content`. | 2.4.1 | **Fixed** |
| Sticky focus | `main:focus` and `:target` receive scroll margin so focused or anchored content is not hidden beneath the sticky header. | 2.4.11 | **Fixed** |
| Dialog behavior | Search and mobile menu use `role="dialog"` and Escape closes search, but focus is not yet trapped inside the dialog or restored to the opener. | 2.1.2, 2.4.3, 4.1.2 | **Major follow-up**: implement focus trap, initial focus, and focus restoration; add `aria-expanded`/`aria-controls` to the menu/search triggers. Trigger state attributes are now present. |
| Contrast | Original muted text `#6F706F` on ivory measured **4.41:1**, below the 4.5:1 AA threshold for normal text. It was changed to `#666666`, measuring **5.09:1**. | 1.4.3 | **Fixed** |
| Contrast | Brass `#A48A60` on navy measured **5.25:1**. A darker `#7A6235` is now used for brass eyebrow text on light surfaces, measuring **5.14:1**. | 1.4.3 | **Fixed** |
| Contrast | Navy/ivory combinations measured **15.33:1**; stone on navy measured **8.04:1**. | 1.4.3 | **Pass for sampled tokens** |
| Motion | Existing reduced-motion media query disables animation and transitions. | 2.3.3 | **Pass by source inspection** |
| Touch targets | Header controls use approximately 44px targets and the mobile bottom navigation is generously sized. | 2.5.8 | **Pass by source inspection** |
| Language and landmarks | Document language is `en`; header uses navigation landmarks and the page now has a main landmark target. | 1.3.1, 3.1.1 | **Pass by source inspection** |

### Priority accessibility improvements

1. **Implement robust dialog focus management.** Use a reusable focus-trap hook or native `<dialog>` pattern for the menu and search overlay. Move focus to the first meaningful control on open, keep Tab within the dialog, return focus to the opener on close, and mark the background inert while open.
2. **Run a keyboard-only route sweep.** Verify every route, Design Studio step, filter/reset flow, save action, search submit/close flow, footer disclosure, and mobile drawer using Tab, Shift+Tab, Enter, Space, and Escape.
3. **Run screen-reader and automated checks.** Validate with NVDA or VoiceOver plus Lighthouse/axe. Confirm heading order, dialog announcements, current-page states, link purpose, and form error messaging.

## Performance findings

The live browser probe was run against the development preview, so HMR/debug resources distort network payloads. It recorded a quick preview navigation of roughly **412ms DOMContentLoaded** and **425ms load**, but these are not production Core Web Vitals. A production build produced approximately **571KB minified JavaScript** and **127KB CSS** before transfer compression; the dev page also loaded large HMR/runtime resources that will not ship in production.

The homepage hero is an approximately **868×1180 JPEG** rendered at roughly **1290×877** on desktop and is the likely LCP candidate. The same concept images are reused across several below-fold sections. Images now use lazy loading and asynchronous decoding where appropriate, while the hero is eager/high-priority and semantic. Image dimensions are constrained by layout CSS, reducing layout-shift risk, but responsive derivatives and modern formats are still the largest likely opportunity.

| Priority | Finding | Expected effect | Recommendation |
|---|---|---|---|
| High | Hero and catalogue images are JPEGs without responsive `srcset`/`sizes` or AVIF/WebP variants. | Lower LCP and bandwidth, especially on mobile. | Generate mobile/desktop AVIF or WebP derivatives, add `srcset`/`sizes`, and keep the hero `fetchpriority="high"`. Use a mobile crop where the composition benefits. |
| High | The production JavaScript bundle is about 571KB minified. | Faster parse/compile and lower INP on low-end devices. | Split the Design Studio and lower-priority page families with route-level dynamic imports; keep the homepage shell in the initial chunk. Audit whether the large UI dependency surface is included unnecessarily. |
| Medium | Google Fonts are loaded from the document head. | Potential font connection and text-render delay. | Keep the existing preconnect only if the font request is confirmed in production; consider self-hosting the two used families with `font-display: swap`, or preload only the exact critical weights. |
| Medium | Repeated concept images are requested across sections. | Duplicate transfer/cache work if URLs or variants diverge. | Reuse stable URLs, set long immutable cache headers for hashed assets, and rely on browser cache; use smaller derivatives for cards. |
| Medium | The preview uses Vite/HMR/debug resources in development. | Dev measurements are not representative. | Run a production preview behind the same compression/CDN setup used for launch before setting a Core Web Vitals baseline. |
| Low | Large below-fold sections render in the initial React tree. | More DOM/style work before interaction. | After measuring, consider `content-visibility: auto` for long below-fold sections and lazy route/page modules; verify anchor navigation and accessibility before keeping it. |

## Measurement limits

No Lighthouse, axe, Chrome performance trace, or real-user Core Web Vitals dataset was available in the connected toolset during this review. The findings above combine source inspection, live DOM/resource probing, production build output, responsive screenshots, and token-level contrast calculations. Before launch, capture mobile and desktop Lighthouse runs against a production deployment and add field monitoring for LCP, INP, CLS, and navigation timing.

## Logo refinement recommendations

The supplied lockup is distinctive and should remain the master brand asset. For a more professional system, keep the original artwork intact while producing controlled derivatives: a simplified crowned-knight emblem for 16–32px favicon and social-avatar contexts; a clean transparent horizontal lockup for navigation; and a one-color navy/ivory mark for embroidery, stamps, and monochrome print. Reduce micro-detail only in the small-size derivative, not in the master artwork.

Consider commissioning a custom modern serif wordmark or testing a high-contrast transitional serif with slightly tighter tracking, while preserving the current ceremonial character. Create explicit optical sizes rather than scaling one lockup everywhere: compact mark, header lockup, footer lockup, and large editorial lockup. Test each at 16px, 32px, 72px, and 180px on ivory and navy backgrounds, with sufficient clear space and no CSS filters applied to the supplied original.


## Implemented in the follow-up pass

The search and mobile menu dialogs now capture the opener before opening, move focus to the first meaningful control, keep Tab and Shift+Tab within the dialog, close on Escape, and restore focus to the opener when it remains visible. If a responsive breakpoint hides the opener while the dialog is open, focus falls back to the first visible header control.

The hero and catalogue imagery now use responsive AVIF/WebP `picture` sources with `srcset`, `sizes`, intrinsic dimensions, asynchronous decoding, and a JPG fallback. The hero remains eager and high priority for LCP. The logo family now includes compact transparent emblems and horizontal transparent lockups for light and dark surfaces; desktop uses the horizontal lockup and mobile uses the compact emblem.
