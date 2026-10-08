// @vitest-environment jsdom
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AccountPage } from './DrevallonPages';
const accountMocks = vi.hoisted(() => ({
  fit: { current: null, history: [], preferences: null } as unknown,
  fitState: { isLoading: false, isError: false },
  query: (data: unknown) => ({ data, isLoading: false, isError: false, refetch: vi.fn() }),
  mutation: () => ({ mutate: vi.fn(), isPending: false }),
}));
vi.mock('@/_core/hooks/useAuth', () => ({
  useAuth: () => ({ user: { name: 'Sample Client', email: 'sample@example.com' }, loading: false, error: null, isAuthenticated: true, logout: vi.fn() }),
}));
vi.mock('@/lib/trpc', () => ({
  trpc: {
    useUtils: () => ({ auth: { me: { invalidate: vi.fn() } } }),
    account: {
      fitProfile: { get: { useQuery: () => ({ ...accountMocks.query(accountMocks.fitState.isLoading || accountMocks.fitState.isError ? undefined : accountMocks.fit), ...accountMocks.fitState }) } },
      designs: { list: { useQuery: () => accountMocks.query([]) }, save: { useMutation: accountMocks.mutation }, delete: { useMutation: accountMocks.mutation } },
      orders: { list: { useQuery: () => accountMocks.query([]) } },
      wardrobe: { list: { useQuery: () => accountMocks.query([]) } },
      profile: { update: { useMutation: accountMocks.mutation } },
    },
  },
}));
const render = () => new DOMParser().parseFromString(renderToStaticMarkup(<AccountPage />), 'text/html');
beforeEach(() => {
  vi.stubGlobal('matchMedia', () => ({ matches: false, addEventListener: () => {}, removeEventListener: () => {} }));
  window.localStorage.clear();
  accountMocks.fit = { current: null, history: [], preferences: null };
  accountMocks.fitState = { isLoading: false, isError: false };
});
describe('My DERVALLON Fit account card', () => {
  it('invites a new customer into the guided measurement flow without inline inputs', () => {
    const page = render();
    const card = page.querySelector('[data-fit-profile]');
    expect(card).not.toBeNull();
    expect(card?.querySelector('input, select')).toBeNull();
    expect(card?.textContent).toMatch(/no measurements saved yet/i);
    expect(card?.querySelector('a[href="/account/fit"]')?.textContent).toMatch(/begin/i);
    expect(page.body.textContent).not.toMatch(/local preview|secure account connection/i);
  });
  it('summarises a returning customer’s current version, date and preferences in their original units', () => {
    accountMocks.fit = {
      current: { version: 3, source: 'customer_manual', registryVersion: 1, verification: null, confirmedAt: new Date('2026-09-20T00:00:00Z'), measurements: {
        height: { value: '182', unit: 'cm', valueUm: 1820000 }, chest: { value: '40.5', unit: 'in', valueUm: 1028700 },
        naturalWaist: { value: '84', unit: 'cm', valueUm: 840000 }, seat: { value: '100', unit: 'cm', valueUm: 1000000 },
      } },
      history: [], preferences: { jacketFit: 'closer', trouserFit: 'balanced', notes: '', updatedAt: new Date('2026-09-20T00:00:00Z') },
    };
    const card = render().querySelector('[data-fit-profile]');
    expect(card?.textContent).toMatch(/version 3/i);
    expect(card?.textContent).toMatch(/2026/);
    expect(card?.textContent).toMatch(/40\.5 in/);
    expect(card?.textContent).toMatch(/Closer/);
    expect(card?.querySelector('a[href="/account/fit"]')?.textContent).toMatch(/review or update/i);
    expect(card?.querySelector('a[href="/custom-order"]')).not.toBeNull();
  });
  it('does not tell a customer they have no measurements while their profile is loading or unavailable', () => {
    for (const fitState of [{ isLoading: true, isError: false }, { isLoading: false, isError: true }]) {
      accountMocks.fitState = fitState;
      const card = render().querySelector('[data-fit-profile]');
      expect(card?.textContent).not.toMatch(/no measurements saved yet/i);
      expect(card?.textContent).not.toMatch(/begin your fit profile/i);
      expect(card?.textContent).toMatch(fitState.isLoading ? /loading your fit profile/i : /could not load your fit profile/i);
      if (fitState.isError) expect(card?.querySelector('a[href="/account/fit"]')).not.toBeNull();
    }
  });
});
