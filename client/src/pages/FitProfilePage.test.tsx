// @vitest-environment jsdom
import { act } from 'react';
import React from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({
  auth: { user: { name: 'Client', email: 'client@example.com' } as unknown, loading: false, error: null, isAuthenticated: true, logout: () => {} },
  fit: { current: null as unknown, history: [] as unknown[], preferences: null as unknown },
  query: { isLoading: false, isError: false },
  refetch: vi.fn(),
  enabled: [] as unknown[],
  confirm: vi.fn(),
  savePreferences: vi.fn(),
  remove: vi.fn(),
  invalidate: vi.fn(),
  startLogin: vi.fn(),
}));
vi.mock('@/_core/hooks/useAuth', () => ({ useAuth: () => state.auth }));
vi.mock('@/const', () => ({ startLogin: state.startLogin }));
vi.mock('@/lib/trpc', () => ({
  trpc: {
    useUtils: () => ({ account: { fitProfile: { get: { invalidate: state.invalidate } } } }),
    account: {
      fitProfile: {
        get: { useQuery: (_input: unknown, options?: { enabled?: boolean }) => { state.enabled.push(options?.enabled); return { data: options?.enabled && !state.query.isLoading && !state.query.isError ? state.fit : undefined, isLoading: Boolean(options?.enabled) && state.query.isLoading, isError: Boolean(options?.enabled) && state.query.isError, refetch: state.refetch }; } },
        confirmMeasurements: { useMutation: () => ({ mutate: state.confirm, isPending: false }) },
        savePreferences: { useMutation: () => ({ mutate: state.savePreferences, isPending: false }) },
        remove: { useMutation: () => ({ mutate: state.remove, isPending: false }) },
      },
    },
  },
}));

import FitProfilePage from './FitProfilePage';

let host: HTMLDivElement;
let root: Root;
async function render() {
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
  await act(async () => { root.render(<FitProfilePage />); });
}
async function click(selector: string) {
  const element = host.querySelector<HTMLElement>(selector);
  expect(element, `${selector} should exist`).not.toBeNull();
  await act(async () => { element?.click(); });
}
async function clickText(text: RegExp) {
  const element = Array.from(host.querySelectorAll<HTMLElement>('button, a')).find((node) => text.test(node.textContent ?? ''));
  expect(element, `control ${text} should exist`).toBeDefined();
  await act(async () => { element?.click(); });
}
async function type(name: string, value: string) {
  const input = host.querySelector<HTMLInputElement | HTMLTextAreaElement>(`[name="${name}"]`);
  expect(input, `${name} should exist`).not.toBeNull();
  await act(async () => {
    const prototype = input instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(prototype, 'value')?.set?.call(input, value);
    input?.dispatchEvent(new Event('input', { bubbles: true }));
    input?.dispatchEvent(new FocusEvent('focusout', { bubbles: true }));
  });
}
const savedRecord = (version: number, confirmedAt: string, source = 'customer_manual') => ({
  version, source, registryVersion: 1, verification: null, confirmedAt: new Date(confirmedAt),
  measurements: {
    height: { value: '182', unit: 'cm', valueUm: 1820000 },
    chest: { value: '40.5', unit: 'in', valueUm: 1028700 },
    naturalWaist: { value: '84', unit: 'cm', valueUm: 840000 },
    seat: { value: '100', unit: 'cm', valueUm: 1000000 },
  },
});

beforeEach(() => {
  (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  vi.stubGlobal('matchMedia', () => ({ matches: false, addEventListener: () => {}, removeEventListener: () => {} }));
  window.localStorage.clear();
  state.auth = { ...state.auth, isAuthenticated: true, loading: false };
  state.fit = { current: null, history: [], preferences: null };
  state.enabled = [];
  state.query = { isLoading: false, isError: false };
  state.refetch.mockReset();
  state.confirm.mockReset();
  state.savePreferences.mockReset();
  state.remove.mockReset();
});
afterEach(async () => {
  await act(async () => { root.unmount(); });
  host.remove();
  vi.unstubAllGlobals();
});

describe('My DERVALLON Fit page', () => {
  it('keeps measurements behind authentication and never queries them while signed out', async () => {
    state.auth = { ...state.auth, isAuthenticated: false, user: null };
    await render();
    expect(state.enabled.every((value) => value === false)).toBe(true);
    expect(host.querySelector('[data-fit-current]')).toBeNull();
    await clickText(/sign in/i);
    expect(state.startLogin).toHaveBeenCalled();
  });

  it('never presents a returning customer as unmeasured while their profile is still loading', async () => {
    state.query = { isLoading: true, isError: false };
    await render();
    const text = host.textContent ?? '';
    expect(text).toMatch(/Loading your fit profile/i);
    expect(text).not.toMatch(/Not yet measured/i);
    expect(host.querySelector('[data-action="begin-measuring"]')).toBeNull();
    expect(Array.from(host.querySelectorAll('button')).some((button) => /Begin measuring|Save preferences/i.test(button.textContent ?? ''))).toBe(false);
  });
  it('shows a retryable error instead of an empty profile when the profile cannot be loaded', async () => {
    state.query = { isLoading: false, isError: true };
    await render();
    const text = host.textContent ?? '';
    expect(text).toMatch(/could not load your fit profile/i);
    expect(text).not.toMatch(/Not yet measured/i);
    expect(Array.from(host.querySelectorAll('button')).some((button) => /Begin measuring|Save preferences|Remove my fit profile/i.test(button.textContent ?? ''))).toBe(false);
    await clickText(/Try again/i);
    expect(state.refetch).toHaveBeenCalledTimes(1);
  });
  it('guides a new customer through each measurement with clear instructions and no invented imagery or scanning', async () => {
    await render();
    expect(host.querySelector('[data-fit-current]')?.textContent).toMatch(/no measurements saved yet/i);
    await clickText(/begin measuring/i);
    const height = host.querySelector('[data-measurement="height"]');
    expect(height?.textContent).toMatch(/Height/);
    expect(height?.textContent).toMatch(/Where/);
    expect(height?.textContent).toMatch(/Tape/);
    expect(height?.textContent).toMatch(/Position/);
    expect(height?.querySelector('[aria-pressed="true"]')?.textContent).toBe('cm');
    expect(height?.querySelector('img, svg[role="img"]')).toBeNull();
    await clickText(/continue/i);
    expect(host.querySelector('[data-measurement="chest"]')?.textContent).toMatch(/never tight/i);
    expect(host.textContent).not.toMatch(/start (a )?scan|scan now|lidar scan/i);
  });

  it('shows the read-only equivalent, flags likely unit confusion and switches the unit without changing the number', async () => {
    await render();
    await clickText(/begin measuring/i);
    await clickText(/continue/i);
    await type('fit-chest', '40');
    const chest = () => host.querySelector('[data-measurement="chest"]');
    expect(chest()?.textContent).toMatch(/please check this measurement/i);
    expect(chest()?.textContent).toMatch(/15\.75 in/);
    await click('[data-measurement="chest"] button[data-switch-unit="in"]');
    expect(host.querySelector<HTMLInputElement>('[name="fit-chest"]')?.value).toBe('40');
    expect(chest()?.querySelector('[aria-pressed="true"]')?.textContent).toBe('in');
    expect(chest()?.textContent).toMatch(/101\.6 cm/);
    expect(chest()?.textContent).not.toMatch(/please check this measurement/i);
  });

  it('blocks malformed values but lets unusual, possible values continue with a warning', async () => {
    await render();
    await clickText(/begin measuring/i);
    await type('fit-height', '182,5');
    await clickText(/continue/i);
    expect(host.querySelector('[data-measurement="height"]')?.textContent).toMatch(/full stop/i);
    expect(host.querySelector('[name="fit-height"]')?.getAttribute('aria-invalid')).toBe('true');
    expect(host.querySelector('[data-measurement="chest"]')).toBeNull();
    await type('fit-height', '132');
    expect(host.querySelector('[data-measurement="height"]')?.textContent).toMatch(/please check this measurement/i);
    await clickText(/continue/i);
    expect(host.querySelector('[data-measurement="chest"]')).not.toBeNull();
  });

  it('requires the core measurements and an explicit check before confirming, then sends original values only', async () => {
    await render();
    await clickText(/begin measuring/i);
    await type('fit-height', '182');
    await click('button[data-step="review"]');
    const confirm = () => host.querySelector<HTMLButtonElement>('button[data-action="confirm-fit"]');
    expect(host.textContent).toMatch(/add your chest/i);
    expect(confirm()?.disabled).toBe(true);
    await click('button[data-step="upper"]');
    await type('fit-chest', '40.5');
    await click('[data-measurement="chest"] button[data-unit="in"]');
    expect(host.querySelector('[data-measurement="naturalWaist"] [aria-pressed="true"]')?.textContent).toBe('in');
    await click('[data-measurement="naturalWaist"] button[data-unit="cm"]');
    await type('fit-naturalWaist', '84');
    await click('button[data-step="lower"]');
    expect(host.querySelector('[data-measurement="seat"] [aria-pressed="true"]')?.textContent).toBe('cm');
    await type('fit-seat', '100');
    await click('button[data-step="review"]');
    expect(host.querySelector('[data-review="chest"]')?.textContent).toMatch(/40\.5 in/);
    expect(host.textContent).toMatch(/cannot guarantee tailoring accuracy/i);
    expect(confirm()?.disabled).toBe(true);
    await click('input[name="fit-review-confirmed"]');
    expect(confirm()?.disabled).toBe(false);
    await click('button[data-action="confirm-fit"]');
    expect(state.confirm).toHaveBeenCalledWith({ measurements: {
      height: { value: '182', unit: 'cm' }, chest: { value: '40.5', unit: 'in' }, naturalWaist: { value: '84', unit: 'cm' }, seat: { value: '100', unit: 'cm' },
    } }, expect.any(Object));
  });

  it('shows a returning customer the current version, date, source, original units and history, and prefills updates', async () => {
    state.fit = { current: savedRecord(2, '2026-09-20T00:00:00Z'), history: [savedRecord(1, '2026-03-02T00:00:00Z', 'assisted')], preferences: null };
    await render();
    const current = host.querySelector('[data-fit-current]');
    expect(current?.textContent).toMatch(/version 2/i);
    expect(current?.textContent).toMatch(/2026/);
    expect(current?.textContent).toMatch(/entered by you/i);
    expect(current?.textContent).toMatch(/40\.5 in/);
    expect(current?.textContent).toMatch(/102\.9 cm/);
    expect(host.querySelector('[data-fit-history]')?.textContent).toMatch(/version 1.*taken with assistance/i);
    await clickText(/update measurements/i);
    expect(host.querySelector<HTMLInputElement>('[name="fit-height"]')?.value).toBe('182');
  });

  it('stores fit preferences separately from measurements', async () => {
    await render();
    await click('input[name="jacketFit"][value="closer"]');
    await type('fit-notes', 'Left shoulder sits slightly lower.');
    await clickText(/save preferences/i);
    expect(state.savePreferences).toHaveBeenCalledWith({ jacketFit: 'closer', trouserFit: null, notes: 'Left shoulder sits slightly lower.' }, expect.any(Object));
    expect(state.confirm).not.toHaveBeenCalled();
  });

  it('offers a two-step removal of the customer’s own fit data', async () => {
    state.fit = { current: savedRecord(1, '2026-09-20T00:00:00Z'), history: [], preferences: null };
    await render();
    await clickText(/remove my fit profile/i);
    expect(state.remove).not.toHaveBeenCalled();
    await clickText(/remove permanently/i);
    expect(state.remove).toHaveBeenCalled();
  });

  it('offers earlier on-device values for review instead of saving them silently', async () => {
    window.localStorage.setItem('drevallon-fit-preview', JSON.stringify({ height: '180', chest: '101', waist: '86', preference: 'tailored' }));
    await render();
    expect(state.confirm).not.toHaveBeenCalled();
    await clickText(/begin measuring/i);
    expect(host.querySelector<HTMLInputElement>('[name="fit-height"]')?.value).toBe('180');
    expect(host.textContent).toMatch(/saved on this device/i);
  });
});
