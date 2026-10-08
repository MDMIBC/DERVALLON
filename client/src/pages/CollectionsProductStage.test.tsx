// @vitest-environment jsdom
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CategoryPage, CollectionsPage } from './DrevallonPages';

beforeEach(() => {
  vi.stubGlobal('matchMedia', () => ({ matches: false, addEventListener: () => {}, removeEventListener: () => {} }));
  window.localStorage.clear();
});

describe('Collections and category browsing', () => {
  it('presents all six collection directions with clear garment-view CTAs', () => {
    const page = new DOMParser().parseFromString(renderToStaticMarkup(<CollectionsPage />), 'text/html');
    ['Suits', 'Blazers', 'Jackets', 'Shirts', 'Trousers', 'Ties'].forEach((category) => {
      expect(page.body.textContent).toContain(category);
    });
    expect(page.querySelectorAll('a[href^="/product/"]')).not.toHaveLength(0);
    expect(page.querySelectorAll('.product-card .product-card-cta')).not.toHaveLength(0);
    expect(page.body.textContent).toMatch(/editorial image/i);
    expect(page.body.textContent).not.toMatch(/\$|£|€|in stock|available now/i);
  });

  it('keeps category browsing focused without exposing internal catalogue controls', () => {
    const page = new DOMParser().parseFromString(renderToStaticMarkup(<CategoryPage />), 'text/html');
    expect(page.querySelector('.filter-search')).not.toBeNull();
    expect(page.querySelector('.review-filter-bar')).toBeNull();
    expect(page.body.textContent).toMatch(/editorial image/i);
    expect(page.body.textContent).not.toMatch(/live stock|in stock|available now/i);
  });
});
