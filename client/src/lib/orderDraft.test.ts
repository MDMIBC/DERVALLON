import { describe, expect, it } from 'vitest';
import { clearOrderDraft, loadOrderDraft, saveOrderDraft, ORDER_DRAFT_KEY, ORDER_DRAFT_TTL_MS } from './orderDraft';
import { defaultOrderPreview } from './orderPreview';
import { stellaFabrics } from '@/content/stellaFabrics';

function storageFixture() {
  const data = new Map<string, string>();
  const storage = {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => { data.set(key, value); },
    removeItem: (key: string) => { data.delete(key); },
  };
  return { storage, data };
}

const example = { ...defaultOrderPreview, fabricId: 'midnight', silhouette: 'tailored', lapel: 'notch', measurements: { ...defaultOrderPreview.measurements, chest: '102.5' } };

describe('opt-in local custom-order draft', () => {
  it('restores a separately identified Stella reference without changing earlier saved directions', () => {
    const { storage } = storageFixture();
    const reference = stellaFabrics.find(item => item.collection === 'KALEIDOLUX');
    expect(reference).toBeDefined();
    expect(saveOrderDraft(storage, { ...example, fabricId: reference!.id }, 1, 1_000)).toBe(true);
    expect(loadOrderDraft(storage, 1_001)?.draft.fabricId).toBe(reference!.id);
  });

  it('stores only choices, measurements and expiry; never photo or review data', () => {
    const { storage, data } = storageFixture();
    expect(saveOrderDraft(storage, { ...example, photoUrl: 'blob:private', reviewConfirmed: true } as typeof example, 2, 1_000)).toBe(true);
    const raw = data.get(ORDER_DRAFT_KEY) ?? '';
    expect(raw).toContain('102.5');
    expect(raw).not.toMatch(/photoUrl|blob:private|reviewConfirmed/);
    expect(loadOrderDraft(storage, 1_001)?.draft.measurements.chest).toBe('102.5');
    expect(loadOrderDraft(storage, 1_001)?.stepIndex).toBe(2);
  });

  it('expires after seven days and removes corrupted or invalid draft data', () => {
    const { storage, data } = storageFixture();
    saveOrderDraft(storage, example, 3, 1_000);
    expect(loadOrderDraft(storage, 1_000 + ORDER_DRAFT_TTL_MS - 1)).not.toBeNull();
    expect(loadOrderDraft(storage, 1_000 + ORDER_DRAFT_TTL_MS)).toBeNull();
    expect(data.has(ORDER_DRAFT_KEY)).toBe(false);
    data.set(ORDER_DRAFT_KEY, '{bad json');
    expect(loadOrderDraft(storage, 1_000)).toBeNull();
    expect(data.has(ORDER_DRAFT_KEY)).toBe(false);
    data.set(ORDER_DRAFT_KEY, JSON.stringify({ version: 1, expiresAt: 5000, stepIndex: 3, draft: { ...example, fabricId: 'invented' } }));
    expect(loadOrderDraft(storage, 1_000)).toBeNull();
    expect(data.has(ORDER_DRAFT_KEY)).toBe(false);
  });

  it('rejects malformed and invalid measurements rather than persisting them', () => {
    const { storage, data } = storageFixture();
    expect(saveOrderDraft(storage, { ...example, measurements: { ...example.measurements, waist: '0' } }, 2, 1_000)).toBe(false);
    expect(data.has(ORDER_DRAFT_KEY)).toBe(false);
  });

  it('handles disabled browser storage without an uncaught error and can forget a saved draft', () => {
    const { storage, data } = storageFixture();
    saveOrderDraft(storage, example, 1, 1_000);
    expect(clearOrderDraft(storage)).toBe(true);
    expect(data.has(ORDER_DRAFT_KEY)).toBe(false);
    const disabled = { getItem: () => { throw new Error('denied'); }, setItem: () => { throw new Error('denied'); }, removeItem: () => { throw new Error('denied'); } };
    expect(saveOrderDraft(disabled, example, 1, 1_000)).toBe(false);
    expect(loadOrderDraft(disabled, 1_000)).toBeNull();
    expect(clearOrderDraft(disabled)).toBe(false);
  });
});
