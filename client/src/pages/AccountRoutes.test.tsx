// @vitest-environment jsdom
import { act } from 'react';
import React from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Vitest compiles JSX with the classic runtime; App.tsx relies on the automatic
// runtime used by the production Vite build, so provide React as a global here.
(globalThis as typeof globalThis & { React?: typeof React }).React = React;

type Query = { data: unknown; isLoading: boolean; isError: boolean };
const state = vi.hoisted(() => ({
  isAuthenticated: false,
  designs: { data: [] as unknown, isLoading: false, isError: false },
  orders: { data: [] as unknown, isLoading: false, isError: false },
  wardrobe: { data: [] as unknown, isLoading: false, isError: false },
  queriesEnabled: [] as Array<{ name: string; enabled: unknown }>,
  saveCalls: [] as unknown[],
}));
const answer = (name: string, query: Query, options?: { enabled?: boolean }) => {
  state.queriesEnabled.push({ name, enabled: options?.enabled });
  const enabled = options?.enabled !== false;
  return { ...query, data: enabled ? query.data : undefined, isLoading: enabled && query.isLoading, isError: enabled && query.isError, refetch: vi.fn() };
};
vi.mock('@/_core/hooks/useAuth', () => ({
  useAuth: () => ({ user: state.isAuthenticated ? { name: 'Sample Client', email: 'sample@example.com' } : null, loading: false, error: null, isAuthenticated: state.isAuthenticated, logout: vi.fn() }),
}));
vi.mock('@/lib/trpc', () => ({
  trpc: {
    useUtils: () => ({ auth: { me: { invalidate: vi.fn() } } }),
    account: {
      fitProfile: { get: { useQuery: (_input: unknown, options?: { enabled?: boolean }) => answer('fit', { data: { current: null, history: [], preferences: null }, isLoading: false, isError: false }, options) } },
      designs: {
        list: { useQuery: (_input: unknown, options?: { enabled?: boolean }) => answer('designs', state.designs, options) },
        get: { useQuery: (_input: unknown, options?: { enabled?: boolean }) => answer('design', { data: undefined, isLoading: false, isError: false }, { enabled: Boolean(options?.enabled) }) },
        save: { useMutation: () => ({ isPending: false, mutate: (input: unknown) => { state.saveCalls.push(input); } }) },
        delete: { useMutation: () => ({ isPending: false, mutate: vi.fn() }) },
      },
      orders: { list: { useQuery: (_input: unknown, options?: { enabled?: boolean }) => answer('orders', state.orders, options) } },
      wardrobe: { list: { useQuery: (_input: unknown, options?: { enabled?: boolean }) => answer('wardrobe', state.wardrobe, options) } },
      profile: { update: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) } },
    },
  },
}));
import App from '../App';

const SUB_ROUTES = [
  { path: '/account/saved-designs', section: 'saved-designs', heading: 'Directions in progress' },
  { path: '/account/orders', section: 'orders', heading: 'Order history.' },
  { path: '/account/wardrobe', section: 'wardrobe', heading: 'Pieces kept close.' },
] as const;

let host: HTMLDivElement;
let root: Root;
const scrolled: Element[] = [];
const text = () => host.textContent ?? '';
async function renderAt(path: string) {
  window.history.replaceState({}, '', path);
  await act(async () => { root.render(<App />); });
  await vi.waitFor(() => expect(host.querySelector('.route-loading')).toBeNull(), { timeout: 5000 });
  await act(async () => { await new Promise((resolve) => setTimeout(resolve, 0)); });
}

beforeEach(() => {
  (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  vi.stubGlobal('matchMedia', () => ({ matches: false, addEventListener: () => {}, removeEventListener: () => {} }));
  vi.stubGlobal('fetch', vi.fn());
  scrolled.length = 0;
  Element.prototype.scrollIntoView = function scrollIntoView(this: Element) { scrolled.push(this); };
  window.localStorage.clear();
  Object.assign(state, {
    isAuthenticated: false,
    designs: { data: [], isLoading: false, isError: false },
    orders: { data: [], isLoading: false, isError: false },
    wardrobe: { data: [], isLoading: false, isError: false },
    queriesEnabled: [], saveCalls: [],
  });
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
});
afterEach(async () => {
  await act(async () => { root.unmount(); });
  host.remove();
  vi.unstubAllGlobals();
});

describe('My DERVALLON account sub-routes', () => {
  for (const route of SUB_ROUTES) {
    it(`${route.path} shows the protected sign-in experience while signed out, not the 404`, async () => {
      await renderAt(route.path);
      expect(text()).not.toContain('is elsewhere');
      expect(text()).toContain('Sign in to DERVALLON');
      expect(text()).toContain('Account data is protected by your authenticated session.');
      expect(text()).not.toContain(route.heading);
      // No account record is requested for a signed-out visitor.
      expect(state.queriesEnabled.filter(({ name }) => ['designs', 'orders', 'wardrobe', 'fit'].includes(name)).every(({ enabled }) => enabled === false)).toBe(true);
    });

    it(`${route.path} opens the existing account page at its section when signed in`, async () => {
      state.isAuthenticated = true;
      await renderAt(route.path);
      expect(text()).not.toContain('is elsewhere');
      expect(text()).not.toContain('Sign in to DERVALLON');
      const section = host.querySelector<HTMLElement>(`[data-account-section="${route.section}"]`);
      expect(section, `${route.section} section should exist`).not.toBeNull();
      expect(section?.textContent).toContain(route.heading);
      expect(scrolled).toContain(section);
      expect(document.activeElement).toBe(section);
      // It is the one existing account page: every section is present, nothing duplicated.
      expect(host.querySelectorAll('[data-account-section]').length).toBe(3);
      expect(host.querySelectorAll('[data-fit-profile]').length).toBe(1);
    });
  }

  it('waits for account records to finish loading before bringing the section into view', async () => {
    state.isAuthenticated = true;
    state.designs = { data: undefined, isLoading: true, isError: false };
    await renderAt('/account/orders');
    expect(text()).toContain('Loading your saved designs');
    // Content above the section is still loading and will change height, so nothing is scrolled yet.
    expect(scrolled).toEqual([]);
    state.designs = { data: [], isLoading: false, isError: false };
    await act(async () => { root.render(<App />); });
    await act(async () => { await new Promise((resolve) => setTimeout(resolve, 0)); });
    const section = host.querySelector<HTMLElement>('[data-account-section="orders"]');
    expect(scrolled).toEqual([section]);
    expect(document.activeElement).toBe(section);
    // A later re-render of already-loaded records does not move the customer again.
    await act(async () => { root.render(<App />); });
    expect(scrolled.length).toBe(1);
  });

  it('shows genuine empty Orders and Wardrobe states and creates nothing', async () => {
    state.isAuthenticated = true;
    await renderAt('/account/orders');
    expect(text()).toContain('Order history.');
    expect(text()).toContain('Pieces kept close.');
    expect(state.saveCalls).toEqual([]);
    await renderAt('/account/wardrobe');
    expect(state.saveCalls).toEqual([]);
  });

  it('keeps /account itself unchanged: no section is forced into view', async () => {
    state.isAuthenticated = true;
    await renderAt('/account');
    expect(text()).toContain('Directions in progress');
    expect(scrolled).toEqual([]);
  });

  it('still sends unknown account paths to the branded 404', async () => {
    await renderAt('/account/not-a-section');
    expect(text()).toContain('is elsewhere');
  });
});
