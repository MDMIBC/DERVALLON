// @vitest-environment jsdom
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ContactPage, ProductPage } from './DrevallonPages';

beforeEach(() => {
  vi.stubGlobal('matchMedia', () => ({ matches: false, addEventListener: () => {}, removeEventListener: () => {} }));
  window.localStorage.clear();
});

describe('product page confidence layer', () => {
  it('shows concise garment guidance and related studies without unfinished claims', () => {
    const page = new DOMParser().parseFromString(renderToStaticMarkup(<ProductPage />), 'text/html');

    expect(page.querySelector('.product-details')).not.toBeNull();
    expect(page.querySelector('[data-product-detail="silhouette"]')?.textContent).toMatch(/structured/i);
    expect(page.querySelector('[data-product-detail="material"]')).toBeNull();
    expect(page.querySelector('[data-product-detail="care"]')).toBeNull();
    expect(page.querySelector('a[href="/custom-order"]')?.textContent).toMatch(/fit direction/i);
    expect(page.querySelector('.complete-the-look')).not.toBeNull();
    expect(page.querySelectorAll('.related-product-card').length).toBeGreaterThan(0);
    expect(page.body.textContent).not.toMatch(/not a purchasable product|outside this review/i);
  });

  it('hides unconfirmed fabric and construction fields rather than inventing specifications', () => {
    const page = new DOMParser().parseFromString(renderToStaticMarkup(<ProductPage />), 'text/html');
    expect(page.querySelector('.product-specification-grid')).toBeNull();
    expect(page.body.textContent).not.toMatch(/to be confirmed|not yet defined/i);
    expect(page.querySelector('.customise-path a[href="/studio"]')?.textContent).toMatch(/Customise this suit/i);
  });

  it('carries product context into the truthful enquiry draft', () => {
    window.history.pushState({}, '', '/contact?context=The%20Assembly%20Suit');
    const page = new DOMParser().parseFromString(renderToStaticMarkup(<ContactPage />), 'text/html');
    expect(page.querySelector('textarea[name="message"]')?.textContent).toContain('I’m enquiring about The Assembly Suit.');
  });
});
