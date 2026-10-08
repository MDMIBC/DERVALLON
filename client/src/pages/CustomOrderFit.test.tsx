// @vitest-environment jsdom
import { act } from 'react';
import React from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({
  isAuthenticated: true,
  fit: { current: null, history: [], preferences: null } as unknown,
  enabled: [] as unknown[],
}));
vi.mock('@/_core/hooks/useAuth', () => ({
  useAuth: () => ({ user: state.isAuthenticated ? { name: 'Client' } : null, loading: false, error: null, isAuthenticated: state.isAuthenticated, logout: vi.fn() }),
}));
vi.mock('@/lib/trpc', () => ({
  trpc: {
    account: {
      fitProfile: {
        get: { useQuery: (_input: unknown, options?: { enabled?: boolean }) => { state.enabled.push(options?.enabled); return { data: options?.enabled ? state.fit : undefined, isLoading: false, isError: false }; } },
      },
      designs: { get: { useQuery: () => ({ data: undefined, isLoading: false, isError: false }) }, save: { useMutation: () => ({ mutate: vi.fn((_input: unknown, options?: { onSuccess?: (value: unknown) => void }) => options?.onSuccess?.({ id: 1 })), isPending: false }) } },
    },
  },
}));

import CustomOrderPage from './CustomOrderPage';

const profile = (version: number) => ({
  version, source: 'customer_manual', registryVersion: 1, verification: null, confirmedAt: new Date('2026-09-20T00:00:00Z'),
  measurements: {
    height: { value: '182', unit: 'cm', valueUm: 1820000 },
    chest: { value: '40.5', unit: 'in', valueUm: 1028700 },
    naturalWaist: { value: '84', unit: 'cm', valueUm: 840000 },
    seat: { value: '100', unit: 'cm', valueUm: 1000000 },
  },
});
let host: HTMLDivElement;
let root: Root;
async function render() { await act(async () => { root.render(<CustomOrderPage />); }); }
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
async function advanceToMeasurements() {
  await press('button[aria-label="Select Midnight navy"]');
  await press('button[data-action="continue"]');
  await press('button[aria-label="Select Tailored silhouette"]');
  await press('button[aria-label="Select Notch lapel"]');
  await press('button[data-action="continue"]');
}
beforeEach(async () => {
  (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  vi.stubGlobal('matchMedia', () => ({ matches: false, addEventListener: () => {}, removeEventListener: () => {} }));
  vi.stubGlobal('fetch', vi.fn());
  window.localStorage.clear();
  state.isAuthenticated = true;
  state.fit = { current: null, history: [], preferences: null };
  state.enabled = [];
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
});
afterEach(async () => {
  await act(async () => { root.unmount(); });
  host.remove();
  vi.unstubAllGlobals();
});

describe('Custom Order and My DERVALLON Fit', () => {
  it('lets a returning customer use their saved profile only after confirming it is still current', async () => {
    state.fit = { current: profile(2), history: [], preferences: null };
    await render();
    await advanceToMeasurements();
    const panel = () => host.querySelector('[data-saved-fit]');
    expect(panel()?.textContent).toMatch(/version 2/i);
    expect(panel()?.textContent).toMatch(/2026/);
    expect(panel()?.textContent).toMatch(/entered by you/i);
    expect(host.querySelector('input[name="chest"]')).not.toBeNull();
    await press('input[name="fit-mode"][value="saved"]');
    expect(host.querySelector('input[name="chest"]')).toBeNull();
    expect(panel()?.textContent).toMatch(/40\.5 in/);
    expect(panel()?.querySelector('a[href="/account/fit"]')).not.toBeNull();
    await press('button[data-action="continue"]');
    expect(host.textContent).toMatch(/confirm that your saved measurements are still current/i);
    expect(host.querySelector('[data-review-fit]')).toBeNull();
    await press('input[name="fit-still-current"]');
    await press('button[data-action="continue"]');
    const review = host.querySelector('[data-review-fit]');
    expect(review?.textContent).toMatch(/40\.5 in/);
    expect(review?.textContent).toMatch(/version 2/i);
    expect(review?.textContent).toMatch(/still current/i);
    expect(host.querySelectorAll('[data-review-measurement]')).toHaveLength(0);
    expect(host.querySelector('.co-summary-content')?.textContent).toMatch(/fit profile v2/i);
    await press('input[name="review-confirmed"]');
    expect(host.querySelector('button[data-action="complete"]')?.hasAttribute('disabled')).toBe(false);
    await press('button[data-action="complete"]');
    expect(host.textContent).toMatch(/no order was placed or sent/i);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('keeps manual entries intact when switching between the saved profile and manual entry', async () => {
    state.fit = { current: profile(2), history: [], preferences: null };
    await render();
    await advanceToMeasurements();
    await enter('input[name="chest"]', '101');
    await press('input[name="fit-mode"][value="saved"]');
    await press('input[name="fit-still-current"]');
    await press('input[name="fit-mode"][value="manual"]');
    expect(host.querySelector<HTMLInputElement>('input[name="chest"]')?.value).toBe('101');
    await press('input[name="fit-mode"][value="saved"]');
    expect(host.querySelector<HTMLInputElement>('input[name="fit-still-current"]')?.checked).toBe(false);
  });

  it('requires a fresh confirmation if the saved profile changes to a newer version', async () => {
    state.fit = { current: profile(2), history: [], preferences: null };
    await render();
    await advanceToMeasurements();
    await press('input[name="fit-mode"][value="saved"]');
    await press('input[name="fit-still-current"]');
    state.fit = { current: profile(3), history: [], preferences: null };
    await render();
    expect(host.querySelector('[data-saved-fit]')?.textContent).toMatch(/version 3/i);
    expect(host.querySelector<HTMLInputElement>('input[name="fit-still-current"]')?.checked).toBe(false);
  });

  it('invites a signed-in customer without a profile, and never queries fit data while signed out', async () => {
    await render();
    await advanceToMeasurements();
    expect(host.querySelector('[data-saved-fit]')).toBeNull();
    expect(host.querySelector('.co-fit-invite a[href="/account/fit"]')?.textContent).toMatch(/My DERVALLON Fit/);
    await act(async () => { root.unmount(); });
    root = createRoot(host);
    state.isAuthenticated = false;
    state.enabled = [];
    await render();
    await advanceToMeasurements();
    expect(state.enabled.every((value) => value === false)).toBe(true);
    expect(host.querySelector('.co-fit-invite a[href="/account/fit"]')?.textContent).toMatch(/sign in/i);
    expect(host.querySelector('input[name="chest"]')).not.toBeNull();
  });
});
