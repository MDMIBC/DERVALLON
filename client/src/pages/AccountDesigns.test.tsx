// @vitest-environment jsdom
import { act } from 'react';
import React from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fabricStudies } from '@/lib/orderPreview';

type Query = { data: unknown; isLoading: boolean; isError: boolean };
const state = vi.hoisted(() => ({
  isAuthenticated: true,
  designs: { data: [] as unknown, isLoading: false, isError: false },
  orders: { data: [] as unknown, isLoading: false, isError: false },
  wardrobe: { data: [] as unknown, isLoading: false, isError: false },
  design: { data: undefined as unknown, isLoading: false, isError: false },
  fit: { current: null, history: [], preferences: null } as unknown,
  saveCalls: [] as Array<{ id?: number; design: Record<string, unknown> }>,
  deleteCalls: [] as unknown[],
  saveResult: 'success' as 'success' | 'error',
  getEnabled: [] as unknown[],
  refetch: { designs: vi.fn(), orders: vi.fn(), wardrobe: vi.fn() },
}));
const answer = (query: Query, refetch: () => void, enabled = true) => ({ ...query, data: enabled ? query.data : undefined, isLoading: enabled && query.isLoading, isError: enabled && query.isError, refetch });
vi.mock('@/_core/hooks/useAuth', () => ({
  useAuth: () => ({ user: state.isAuthenticated ? { name: 'Sample Client', email: 'sample@example.com' } : null, loading: false, error: null, isAuthenticated: state.isAuthenticated, logout: vi.fn() }),
}));
vi.mock('@/lib/trpc', () => ({
  trpc: {
    useUtils: () => ({ auth: { me: { invalidate: vi.fn() } } }),
    account: {
      fitProfile: { get: { useQuery: (_input: unknown, options?: { enabled?: boolean }) => ({ data: options?.enabled ? state.fit : undefined, isLoading: false, isError: false, refetch: vi.fn() }) } },
      designs: {
        list: { useQuery: (_input: unknown, options?: { enabled?: boolean }) => answer(state.designs, state.refetch.designs, options?.enabled !== false) },
        get: { useQuery: (_input: unknown, options?: { enabled?: boolean }) => { state.getEnabled.push(options?.enabled); return answer(state.design, vi.fn(), Boolean(options?.enabled)); } },
        save: { useMutation: () => ({ isPending: false, mutate: (input: { id?: number; design: Record<string, unknown> }, callbacks?: { onSuccess?: (data: unknown) => void; onError?: (error: unknown) => void }) => {
          state.saveCalls.push(input);
          if (state.saveResult === 'success') callbacks?.onSuccess?.({ id: input.id ?? 11, title: 'Saved', kind: input.design.kind, payload: input.design, details: [], createdAt: new Date(), updatedAt: new Date() });
          else callbacks?.onError?.(new Error('failed'));
        } }) },
        delete: { useMutation: () => ({ isPending: false, mutate: (input: unknown, callbacks?: { onSuccess?: () => void }) => { state.deleteCalls.push(input); callbacks?.onSuccess?.(); } }) },
      },
      orders: { list: { useQuery: () => answer(state.orders, state.refetch.orders) } },
      wardrobe: { list: { useQuery: () => answer(state.wardrobe, state.refetch.wardrobe) } },
      profile: { update: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) } },
    },
  },
}));

import CustomOrderPage from './CustomOrderPage';
import { AccountPage, StudioPage } from './DrevallonPages';

const studioRow = { id: 7, title: 'Full suit direction', kind: 'studio', payload: { kind: 'studio', garment: 'suit', silhouette: 'precise', jacketDetail: 'notch', trouserDetail: 'clean', profile: 'later', notes: '' }, details: [{ label: 'Garment', value: 'Full suit' }, { label: 'Silhouette', value: 'Precise' }], createdAt: new Date('2026-09-01T00:00:00Z'), updatedAt: new Date('2026-09-02T00:00:00Z') };
const bespokeRow = { id: 9, title: 'HERITAGE · 2701 direction', kind: 'bespoke', payload: { kind: 'bespoke', fabricId: 'stella:HERITAGE:2701', silhouette: 'tailored', lapel: 'peak', measurementMode: 'manual', measurements: { chest: '101', waist: '', seat: '', shoulder: '', sleeve: '', inseam: '' } }, details: [{ label: 'Fabric', value: 'HERITAGE · 2701' }, { label: 'Lapel', value: 'Peak lapel' }], createdAt: new Date('2026-09-03T00:00:00Z'), updatedAt: new Date('2026-09-04T00:00:00Z') };
const midnightNavy = fabricStudies.find(({ name }) => name === 'Midnight navy')!;
const fitProfile = (version: number) => ({
  version, source: 'customer_manual', registryVersion: 1, verification: null, confirmedAt: new Date('2026-09-20T00:00:00Z'),
  measurements: { height: { value: '182', unit: 'cm', valueUm: 1820000 }, chest: { value: '40.5', unit: 'in', valueUm: 1028700 } },
});

let host: HTMLDivElement;
let root: Root;
async function render(element: React.ReactElement) { await act(async () => { root.render(element); }); }
async function press(selector: string) {
  const element = host.querySelector<HTMLElement>(selector);
  expect(element, `${selector} should exist`).not.toBeNull();
  await act(async () => { element?.click(); });
}
async function enter(selector: string, value: string) {
  const field = host.querySelector<HTMLInputElement>(selector);
  expect(field, `${selector} should exist`).not.toBeNull();
  await act(async () => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set?.call(field, value);
    field?.dispatchEvent(new Event('input', { bubbles: true }));
  });
}
const text = () => host.textContent ?? '';

beforeEach(() => {
  (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  vi.stubGlobal('matchMedia', () => ({ matches: false, addEventListener: () => {}, removeEventListener: () => {} }));
  vi.stubGlobal('fetch', vi.fn());
  window.localStorage.clear();
  window.history.replaceState({}, '', '/');
  Object.assign(state, {
    isAuthenticated: true,
    designs: { data: [], isLoading: false, isError: false },
    orders: { data: [], isLoading: false, isError: false },
    wardrobe: { data: [], isLoading: false, isError: false },
    design: { data: undefined, isLoading: false, isError: false },
    fit: { current: null, history: [], preferences: null },
    saveCalls: [], deleteCalls: [], saveResult: 'success', getEnabled: [],
  });
  Object.values(state.refetch).forEach((fn) => fn.mockClear());
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
});
afterEach(async () => {
  await act(async () => { root.unmount(); });
  host.remove();
  window.history.replaceState({}, '', '/');
  vi.unstubAllGlobals();
});

describe('My DERVALLON saved designs', () => {
  it('lists every account design with its details and a link that reopens it', async () => {
    state.designs.data = [studioRow, bespokeRow];
    await render(<AccountPage />);
    const cards = host.querySelectorAll('[data-saved-design]');
    expect(cards).toHaveLength(2);
    expect(cards[0].textContent).toMatch(/Full suit direction/);
    expect(cards[0].textContent).toMatch(/Design Studio/);
    expect(cards[1].textContent).toMatch(/HERITAGE · 2701/);
    expect(cards[1].textContent).toMatch(/Bespoke Studio/);
    expect(host.querySelector('a[href="/studio?design=7"]')).not.toBeNull();
    expect(host.querySelector('a[href="/custom-order?design=9"]')).not.toBeNull();
  });

  it('deletes only the chosen design, by its id', async () => {
    state.designs.data = [studioRow, bespokeRow];
    await render(<AccountPage />);
    await press('button[aria-label="Delete HERITAGE · 2701 direction"]');
    expect(state.deleteCalls).toEqual([{ id: 9 }]);
    expect(state.refetch.designs).toHaveBeenCalled();
  });

  it('never shows an empty state while account records are loading', async () => {
    for (const query of [state.designs, state.orders, state.wardrobe]) Object.assign(query, { data: undefined, isLoading: true });
    await render(<AccountPage />);
    expect(text()).toMatch(/Loading your saved designs/);
    expect(text()).toMatch(/Loading your order history/);
    expect(text()).toMatch(/Loading your wardrobe/);
    expect(text()).not.toMatch(/No saved directions yet|No orders yet|ready for its first piece|0 records|0 pieces/);
  });

  it('shows a retryable error, not an empty state, when account records fail to load', async () => {
    for (const query of [state.designs, state.orders, state.wardrobe]) Object.assign(query, { data: undefined, isError: true });
    await render(<AccountPage />);
    expect(host.querySelectorAll('[role="alert"]').length).toBeGreaterThanOrEqual(3);
    expect(text()).toMatch(/Nothing has been changed/);
    expect(text()).not.toMatch(/No saved directions yet|No orders yet|ready for its first piece|0 records|0 pieces/);
    await press('button[data-retry="designs"]');
    await press('button[data-retry="orders"]');
    await press('button[data-retry="wardrobe"]');
    expect(state.refetch.designs).toHaveBeenCalled();
    expect(state.refetch.orders).toHaveBeenCalled();
    expect(state.refetch.wardrobe).toHaveBeenCalled();
  });

  it('shows honest empty states once loaded with no records', async () => {
    await render(<AccountPage />);
    expect(text()).toMatch(/No saved directions yet/);
    expect(text()).toMatch(/No orders yet/);
    expect(text()).toMatch(/ready for its first piece/);
  });

  it('never moves a device-only design into the account unless the customer chooses to', async () => {
    window.localStorage.setItem('drevallon-saved-design', JSON.stringify({ title: 'Jacket direction', garment: 'jacket', silhouette: 'relaxed', jacketDetail: 'peak', profile: 'later', notes: 'Linen', savedAt: '2026-09-01T00:00:00Z' }));
    await render(<AccountPage />);
    expect(state.saveCalls).toHaveLength(0);
    expect(host.querySelector('[data-device-design]')?.textContent).toMatch(/only on this device/i);
    await press('button[data-action="add-device-design"]');
    expect(state.saveCalls).toEqual([{ design: { kind: 'studio', garment: 'jacket', silhouette: 'relaxed', jacketDetail: 'peak', trouserDetail: undefined, profile: 'later', notes: 'Linen' } }]);
    expect(window.localStorage.getItem('drevallon-saved-design')).toBeNull();
    expect(text()).toMatch(/added to your DERVALLON account/i);
  });

  it('lets the customer remove a device-only design without saving it', async () => {
    window.localStorage.setItem('drevallon-saved-design', JSON.stringify({ title: 'Jacket direction', garment: 'jacket', notes: '' }));
    await render(<AccountPage />);
    await press('button[data-action="remove-device-design"]');
    expect(state.saveCalls).toHaveLength(0);
    expect(window.localStorage.getItem('drevallon-saved-design')).toBeNull();
    expect(host.querySelector('[data-device-design]')).toBeNull();
  });
});

const fullStudioDraft = { garment: 'suit', silhouette: 'precise', jacketDetail: 'notch', trouserDetail: 'clean', profile: 'later', notes: 'For a wedding' };
async function openStudioReview() {
  const steps = host.querySelectorAll<HTMLButtonElement>('.studio-progress button');
  await act(async () => { steps[steps.length - 1].click(); });
}

describe('Design Studio saving', () => {
  it('saves a signed-in design to the account, not only to this device', async () => {
    window.localStorage.setItem('drevallon-studio-draft', JSON.stringify(fullStudioDraft));
    await render(<StudioPage />);
    await openStudioReview();
    await press('button.studio-continue');
    expect(state.saveCalls).toEqual([{ design: { kind: 'studio', ...fullStudioDraft } }]);
    expect(window.localStorage.getItem('drevallon-saved-design')).toBeNull();
    expect(host.querySelector('[data-studio-save-status]')?.textContent).toMatch(/saved to your DERVALLON account/i);
    expect(host.querySelector('[data-studio-save-status]')?.textContent).toMatch(/does not place an order/i);
  });

  it('updates the same account design when saved again instead of duplicating it', async () => {
    window.localStorage.setItem('drevallon-studio-draft', JSON.stringify(fullStudioDraft));
    await render(<StudioPage />);
    await openStudioReview();
    await press('button.studio-continue');
    await press('button.studio-continue');
    expect(state.saveCalls[1]?.id).toBe(11);
  });

  it('reports a failed account save honestly and keeps the choices', async () => {
    state.saveResult = 'error';
    window.localStorage.setItem('drevallon-studio-draft', JSON.stringify(fullStudioDraft));
    await render(<StudioPage />);
    await openStudioReview();
    await press('button.studio-continue');
    expect(host.querySelector('[data-studio-save-status]')?.textContent).toMatch(/could not be saved/i);
    expect(host.querySelector('button.studio-continue')?.textContent).not.toMatch(/^Saved$/);
    expect(window.localStorage.getItem('drevallon-saved-design')).toBeNull();
  });

  it('labels a signed-out save as device-only and offers sign-in', async () => {
    state.isAuthenticated = false;
    window.localStorage.setItem('drevallon-studio-draft', JSON.stringify(fullStudioDraft));
    await render(<StudioPage />);
    await openStudioReview();
    await press('button.studio-continue');
    expect(state.saveCalls).toHaveLength(0);
    expect(window.localStorage.getItem('drevallon-saved-design')).not.toBeNull();
    expect(host.querySelector('[data-studio-save-status]')?.textContent).toMatch(/only on this device/i);
    expect(host.querySelector('[data-studio-save-status] button')?.textContent).toMatch(/sign in/i);
  });

  it('reopens a saved account design from its link and saves changes back to it', async () => {
    window.history.replaceState({}, '', '/studio?design=7');
    state.design.data = studioRow;
    await render(<StudioPage />);
    expect(state.getEnabled).toContain(true);
    expect(host.querySelector('.summary-content')?.textContent).toMatch(/Precise/);
    expect(host.querySelector('.summary-content')?.textContent).toMatch(/Notch lapel/);
    await openStudioReview();
    await press('button.studio-continue');
    expect(state.saveCalls[0]?.id).toBe(7);
  });

  it('says plainly when a saved design link is not available, and saves as a new design', async () => {
    window.history.replaceState({}, '', '/studio?design=99');
    state.design = { data: undefined, isLoading: false, isError: true };
    await render(<StudioPage />);
    expect(host.querySelector('[data-saved-design-unavailable]')?.textContent).toMatch(/not available on your account/i);
    await openStudioReview();
    await press('button.studio-continue');
    expect(state.saveCalls[0]?.id).toBeUndefined();
  });
});

async function advanceToMeasurements() {
  await press('button[aria-label="Select Midnight navy"]');
  await press('button[data-action="continue"]');
  await press('button[aria-label="Select Tailored silhouette"]');
  await press('button[aria-label="Select Notch lapel"]');
  await press('button[data-action="continue"]');
}
async function confirmAndComplete() {
  await press('input[name="review-confirmed"]');
  await press('button[data-action="complete"]');
}

describe('Bespoke Studio saving', () => {
  it('saves the selected fabric, style and manual measurements to the account without placing an order', async () => {
    await render(<CustomOrderPage />);
    await advanceToMeasurements();
    await enter('input[name="chest"]', '102.5');
    await press('button[data-action="continue"]');
    await confirmAndComplete();
    expect(state.saveCalls).toEqual([{ design: {
      kind: 'bespoke', fabricId: midnightNavy.id, silhouette: 'tailored', lapel: 'notch', measurementMode: 'manual',
      measurements: { chest: '102.5', waist: '', seat: '', shoulder: '', sleeve: '', inseam: '' },
    } }]);
    expect(text()).toMatch(/saved to My DERVALLON/i);
    expect(text()).toMatch(/no order was placed or sent/i);
    expect(host.querySelector('.co-complete a[href="/account"]')).not.toBeNull();
    expect(fetch).not.toHaveBeenCalled();
  });

  it('links the confirmed saved fit version instead of copying measurements', async () => {
    state.fit = { current: fitProfile(2), history: [], preferences: null };
    await render(<CustomOrderPage />);
    await advanceToMeasurements();
    await press('input[name="fit-mode"][value="saved"]');
    await press('input[name="fit-still-current"]');
    await press('button[data-action="continue"]');
    await confirmAndComplete();
    expect(state.saveCalls).toEqual([{ design: { kind: 'bespoke', fabricId: midnightNavy.id, silhouette: 'tailored', lapel: 'notch', measurementMode: 'fit_profile', fitVersion: 2 } }]);
  });

  it('stays on review with an honest message if the account save fails', async () => {
    state.saveResult = 'error';
    await render(<CustomOrderPage />);
    await advanceToMeasurements();
    await press('button[data-action="continue"]');
    await confirmAndComplete();
    expect(host.querySelector('button[data-action="restart"]')).toBeNull();
    expect(host.querySelector('[data-design-save-error]')?.textContent).toMatch(/could not be saved/i);
    expect(host.querySelector('[data-design-save-error]')?.textContent).toMatch(/nothing was placed or sent/i);
    expect(host.querySelector('button[data-action="complete"]')).not.toBeNull();
  });

  it('completes a signed-out design without claiming it was saved to an account', async () => {
    state.isAuthenticated = false;
    await render(<CustomOrderPage />);
    await advanceToMeasurements();
    await press('button[data-action="continue"]');
    expect(host.querySelector('button[data-action="complete"]')?.textContent).toMatch(/complete design/i);
    await confirmAndComplete();
    expect(state.saveCalls).toHaveLength(0);
    expect(text()).toMatch(/not saved to an account/i);
    expect(text()).toMatch(/no order was placed or sent/i);
    expect(state.getEnabled.every((value) => value === false)).toBe(true);
  });

  it('reopens a saved Bespoke design from its link and saves changes back to it', async () => {
    window.history.replaceState({}, '', '/custom-order?design=9');
    state.design.data = bespokeRow;
    await render(<CustomOrderPage />);
    expect(host.querySelector('.co-summary-content')?.textContent).toMatch(/HERITAGE · 2701/);
    await press('button[data-action="continue"]');
    await press('button[data-action="continue"]');
    expect(host.querySelector<HTMLInputElement>('input[name="chest"]')?.value).toBe('101');
    await press('button[data-action="continue"]');
    await confirmAndComplete();
    expect(state.saveCalls[0]).toMatchObject({ id: 9, design: { fabricId: 'stella:HERITAGE:2701', lapel: 'peak' } });
  });

  it('says plainly when a saved Bespoke design link is not available, and saves as a new design', async () => {
    window.history.replaceState({}, '', '/custom-order?design=99');
    state.design = { data: undefined, isLoading: false, isError: true };
    await render(<CustomOrderPage />);
    expect(host.querySelector('[data-saved-design-unavailable]')?.textContent).toMatch(/not available on your account/i);
    await advanceToMeasurements();
    await press('button[data-action="continue"]');
    await confirmAndComplete();
    expect(state.saveCalls).toHaveLength(1);
    expect(state.saveCalls[0]?.id).toBeUndefined();
  });
});
