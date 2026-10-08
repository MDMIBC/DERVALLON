// @vitest-environment jsdom
import React from 'react';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { DeliveryPage, Home, ReturnsPage } from './DrevallonPages';

const clientRoot = existsSync(resolve(process.cwd(), 'src/index.css')) ? process.cwd() : resolve(process.cwd(), 'client');
const stylesheet = readFileSync(resolve(clientRoot, 'src/index.css'), 'utf8');
const documentHtml = readFileSync(resolve(clientRoot, 'index.html'), 'utf8');
const webManifest = readFileSync(resolve(clientRoot, 'public/site.webmanifest'), 'utf8');
const shellSource = readFileSync(resolve(clientRoot, 'src/components/DrevallonShell.tsx'), 'utf8');

beforeEach(() => {
  vi.stubGlobal('matchMedia', () => ({ matches: false, addEventListener: () => {}, removeEventListener: () => {} }));
});
afterEach(() => vi.unstubAllGlobals());

describe('homepage brand centerpiece', () => {
  it('displays the supplied knight logo unchanged in the hero', () => {
    const page = new DOMParser().parseFromString(renderToStaticMarkup(<Home />), 'text/html');
    const hero = page.querySelector('main > .brand-hero');
    expect(hero).not.toBeNull();
    expect(hero?.querySelector('.brand-hero-mark img')?.getAttribute('src')).toMatch(/1000007848.*\.png$/);
    expect(hero?.querySelector('.brand-hero-mark img')?.getAttribute('alt')).toMatch(/knight.*gold crown.*DERVALLON/i);
    expect(hero?.querySelector('h1.brand-hero-line')?.textContent).toContain('A considered presence.');
    expect(hero?.querySelector('img[src*="hero-city-architecture"]')).toBeNull();
    expect(page.querySelector('.site-header')?.classList.contains('header-dark')).toBe(true);
  });

  it('keeps primary navigation visible without a compact logo in the homepage header', () => {
    const page = new DOMParser().parseFromString(renderToStaticMarkup(<Home />), 'text/html');
    const header = page.querySelector('.site-header');
    expect(header?.querySelector('.brand-logo')).toBeNull();
    expect(header?.querySelector('nav[aria-label="Primary navigation"]')).not.toBeNull();
    expect(header?.querySelector('button[aria-label="Open menu"]')).not.toBeNull();
  });

  it('gives top navigation links a subtle hover lift with reduced-motion support', () => {
    expect(stylesheet).toMatch(/\.desktop-primary-nav a\s*\{[^}]*transition:\s*color 180ms var\(--ease-out\), transform 180ms var\(--ease-out\);/);
    expect(stylesheet).toMatch(/\.desktop-primary-nav a:hover[^}]*transform:\s*translateY\(-2px\)/);
    expect(stylesheet).toMatch(/@media \(prefers-reduced-motion: reduce\)[\s\S]*transition-duration:\s*\.01ms/);
  });

  it('uses DERVALLON for the project document and installable app name', () => {
    expect(documentHtml).toContain('<title>DERVALLON — A considered presence</title>');
    expect(webManifest).toContain('"name": "DERVALLON"');
    expect(webManifest).toContain('"short_name": "DERVALLON"');
    expect(documentHtml).not.toContain('<title>DREVALLON');
    expect(webManifest).not.toContain('"DREVALLON"');
  });

  it('keeps the mobile menu header logo-free while retaining its close control', () => {
    expect(shellSource).not.toMatch(/<div className="menu-drawer-top"><Wordmark/);
    expect(shellSource).toMatch(/<div className="menu-drawer-top">\s*<button className="icon-button"[\s\S]*?aria-label="Close menu"/);
    expect(stylesheet).toMatch(/@media \(max-width: 980px\)[\s\S]*?\.desktop-primary-nav\s*\{\s*display:\s*none/);
    expect(stylesheet).toMatch(/\.mobile-menu-button\s*\{[^}]*width:\s*44px[^}]*height:\s*44px/);
  });

  it('keeps footer navigation without implying that unverified social pages are official', () => {
    const page = new DOMParser().parseFromString(renderToStaticMarkup(<Home />), 'text/html');
    const footer = page.querySelector('.site-footer');
    expect(footer?.querySelector('.brand-logo')).toBeNull();
    expect(footer?.querySelector('.footer-signoff p')?.textContent).toContain('A considered presence.');
    expect(footer?.querySelector('a[href="https://www.instagram.com/"]')).toBeNull();
    expect(footer?.querySelector('a[href="https://www.pinterest.com/"]')).toBeNull();
    expect(footer?.querySelector('.footer-group a')).not.toBeNull();
  });

  it('groups footer destinations with clean customer-facing labels and honest information shells', () => {
    const page = new DOMParser().parseFromString(renderToStaticMarkup(<Home />), 'text/html');
    const footerText = page.querySelector('.site-footer')?.textContent ?? '';
    ['Collections', 'The House', 'Client support', 'Contact', 'Delivery', 'Returns', 'Information'].forEach((label) => {
      expect(footerText).toContain(label);
    });
    expect(footerText).not.toMatch(/Privacy shell|Terms shell|Garment care shell/);
  });

  it('provides honest placeholder pages for delivery and returns information', () => {
    const delivery = new DOMParser().parseFromString(renderToStaticMarkup(<DeliveryPage />), 'text/html');
    const returns = new DOMParser().parseFromString(renderToStaticMarkup(<ReturnsPage />), 'text/html');
    expect(delivery.querySelector('h1')?.textContent).toContain('Delivery');
    expect(returns.querySelector('h1')?.textContent).toContain('Returns');
    expect(delivery.body.textContent).toMatch(/delivery arrangements will depend on the confirmed product/i);
    expect(returns.body.textContent).toMatch(/purchasing and returns information will be provided before you commit/i);
    expect(delivery.body.textContent).not.toMatch(/delivery within|returns accepted|refunds issued/i);
  });

  it('does not present an unverified social-profile placeholder in the customer-facing footer', () => {
    const page = new DOMParser().parseFromString(renderToStaticMarkup(<Home />), 'text/html');
    expect(page.querySelector('.footer-social-note')).toBeNull();
  });

  it('keeps the mobile hero within the viewport and uses one consistent CTA height', () => {
    expect(stylesheet).toMatch(/\.home-hero\.brand-hero\s*\{[^}]*overflow:\s*hidden/);
    expect(stylesheet).toMatch(/\.brand-hero-actions \.button-link\s*\{[^}]*min-height:\s*52px/);
    expect(stylesheet).toMatch(/@media \(max-width: 640px\)[\s\S]*?\.brand-hero-actions \.button-link\s*\{[^}]*justify-content:\s*space-between/);
  });

  it('renders grain only as a decorative hero layer', () => {
    const page = new DOMParser().parseFromString(renderToStaticMarkup(<Home />), 'text/html');
    const grain = page.querySelector('.brand-hero-grain');
    expect(grain?.getAttribute('aria-hidden')).toBe('true');
    expect(grain?.getAttribute('style')).toContain('hero-grain-tile_7bd8c5f8.png');
  });

  it('scales the hero logo from 90% to full size in about half a second unless motion is reduced', () => {
    expect(stylesheet).toMatch(/@keyframes hero-logo-entrance\s*\{\s*from\s*\{[^}]*transform:\s*scale\(\.9\)[^}]*\}\s*to\s*\{[^}]*transform:\s*scale\(1\)/);
    expect(stylesheet).toMatch(/@media \(prefers-reduced-motion: no-preference\)\s*\{[\s\S]*?\.brand-hero-mark picture\s*\{\s*animation:\s*hero-logo-entrance 520ms var\(--ease-out\) both;/);
  });

  it('reveals the primary collection CTA after the logo without suppressing its keyboard focus', () => {
    const page = new DOMParser().parseFromString(renderToStaticMarkup(<Home />), 'text/html');
    expect(page.querySelector('.primary-cta-entrance > a[href="/collections"]')).not.toBeNull();
    expect(stylesheet).toMatch(/@media \(prefers-reduced-motion: no-preference\)\s*\{[\s\S]*?\.primary-cta-entrance\s*\{\s*animation:\s*cta-fade-in 420ms var\(--ease-out\) 520ms both;/);
    expect(stylesheet).toMatch(/\.primary-cta-entrance:focus-within\s*\{\s*animation:\s*none;\s*opacity:\s*1;/);
  });

  it('retains both homepage destinations while keeping the promotional copy visually secondary', () => {
    const page = new DOMParser().parseFromString(renderToStaticMarkup(<Home />), 'text/html');
    const hero = page.querySelector('main > .brand-hero');
    expect(hero?.querySelector('a[href="/collections"]')).not.toBeNull();
    expect(hero?.querySelector('a[href="/studio"]')).not.toBeNull();
    expect(hero?.querySelector('.brand-hero-line')?.textContent ?? '').toContain('A considered presence.');
  });
  it('gives all six advertised garment categories distinct, accurately named concept images', () => {
    const page = new DOMParser().parseFromString(renderToStaticMarkup(<Home />), 'text/html');
    const tiles = Array.from(page.querySelectorAll<HTMLAnchorElement>('.collection-tile'));
    expect(tiles).toHaveLength(6);
    const images = tiles.map((tile) => tile.querySelector('img')?.getAttribute('src') ?? '');
    ['suits', 'shirts', 'ties', 'trousers', 'blazers', 'jackets'].forEach((category, index) => {
      expect(tiles[index].getAttribute('href')).toBe(`/category/${category}`);
      expect(images[index]).toContain(`concept-${category}`);
      expect(tiles[index].querySelector('img')?.getAttribute('alt')?.toLowerCase()).toContain(category === 'suits' ? 'suit' : category.slice(0,-1));
    });
    expect(new Set(images).size).toBe(6);
  });
});
