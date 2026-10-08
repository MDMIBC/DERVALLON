// @vitest-environment jsdom
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { renderToStaticMarkup } from 'react-dom/server';
import { Home } from './DrevallonPages';

const clientRoot = existsSync(resolve(process.cwd(), 'src/index.css')) ? process.cwd() : resolve(process.cwd(), 'client');
const source = (relativePath: string) => readFileSync(resolve(clientRoot, relativePath), 'utf8');
const publicSources = [
  source('src/content/siteContent.ts'),
  source('src/components/DrevallonShell.tsx'),
  source('src/pages/DrevallonPages.tsx'),
  source('src/pages/CustomOrderPage.tsx'),
].join('\n');

const internalPhrases = [
  'concept preview',
  'review build',
  'demonstration catalogue',
  'owner visual approval',
  'not verified merchandise',
  'illustrative preview',
  'preview only',
  'future catalogue data',
  'not yet defined',
  'not a purchasable product',
  'outside this review phase',
  'information shells',
  'local preview only',
  'secure account connection',
  'does not send an email',
];

describe('customer-readiness cleanup', () => {
  beforeEach(() => {
    vi.stubGlobal('matchMedia', () => ({ matches: false, addEventListener: () => {}, removeEventListener: () => {} }));
    window.localStorage.clear();
  });

  it('removes internal prototype language from public-facing source', () => {
    for (const phrase of internalPhrases) expect(publicSources.toLowerCase()).not.toContain(phrase);
  });

  it('keeps the homepage concise and customer-facing', () => {
    const page = new DOMParser().parseFromString(renderToStaticMarkup(<Home />), 'text/html');
    const text = page.body.textContent ?? '';
    expect(text).toContain('A considered presence.');
    expect(text).toContain('A new menswear brand');
    expect(text).not.toMatch(/review build|demonstration catalogue|owner visual approval|not verified inventory/i);
  });

  it('does not expose incomplete product specification fields as invented facts', () => {
    const detailSource = source('src/pages/DrevallonPages.tsx');
    expect(detailSource).not.toContain('To be confirmed');
    expect(detailSource).not.toContain('Availability</dt><dd>Not yet defined');
    expect(detailSource).toContain('product-details');
  });

  it('keeps visible labels customer-facing rather than development-facing', () => {
    const pages = source('src/pages/DrevallonPages.tsx');
    const bespoke = source('src/pages/CustomOrderPage.tsx');
    expect(`${pages}\n${bespoke}`).not.toMatch(/Editorial study \/ concept imagery|from concept to review|PERSONAL DESIGN STUDY|FABRIC STUDY|fabric study|fabricated heritage story|PREVIEW COMPLETE/i);
  });

  it('does not duplicate the Contact or Information introductions', () => {
    const pages = source('src/pages/DrevallonPages.tsx');
    expect((pages.match(/Share what you are exploring/g) ?? []).length).toBe(1);
    expect((pages.match(/Product-specific information appears on each garment page/g) ?? []).length).toBe(1);
  });
});
