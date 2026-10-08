import { defaultOrderPreview, fabricStudies, lapels, measurementFields, silhouettes, validateMeasurements, type MeasurementKey, type OrderPreview } from './orderPreview';
import { stellaFabrics } from '@/content/stellaFabrics';

export const ORDER_DRAFT_KEY = 'drevallon-custom-order-preview-v1';
export const ORDER_DRAFT_TTL_MS = 7 * 24 * 60 * 60 * 1000;
export type DraftStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;
export type StoredOrderDraft = { draft: OrderPreview; stepIndex: number; expiresAt: number };

type DraftEnvelope = StoredOrderDraft & { version: 1 };
const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);
const allowed = (value: unknown, choices: readonly { id: string }[]) => typeof value === 'string' && (value === '' || choices.some(({ id }) => id === value));

function cleanDraft(input: unknown): OrderPreview | null {
  if (!isRecord(input) || !isRecord(input.measurements)) return null;
  if (!(allowed(input.fabricId, fabricStudies) || allowed(input.fabricId, stellaFabrics)) || !allowed(input.silhouette, silhouettes) || !allowed(input.lapel, lapels)) return null;
  const measurements = { ...defaultOrderPreview.measurements };
  for (const { key } of measurementFields) {
    const value = input.measurements[key];
    if (typeof value !== 'string' || value.length > 16) return null;
    measurements[key as MeasurementKey] = value;
  }
  if (Object.keys(validateMeasurements(measurements)).length) return null;
  return { fabricId: input.fabricId as string, silhouette: input.silhouette as string, lapel: input.lapel as string, measurements };
}

export function saveOrderDraft(storage: DraftStorage, draft: OrderPreview, stepIndex: number, now = Date.now()): boolean {
  const clean = cleanDraft(draft);
  if (!clean || !Number.isInteger(stepIndex) || stepIndex < 0 || stepIndex > 3) return false;
  try {
    const value: DraftEnvelope = { version: 1, draft: clean, stepIndex, expiresAt: now + ORDER_DRAFT_TTL_MS };
    storage.setItem(ORDER_DRAFT_KEY, JSON.stringify(value));
    return true;
  } catch { return false; }
}

export function loadOrderDraft(storage: DraftStorage, now = Date.now()): StoredOrderDraft | null {
  try {
    const raw = storage.getItem(ORDER_DRAFT_KEY);
    if (!raw) return null;
    const value: unknown = JSON.parse(raw);
    const clean = isRecord(value) ? cleanDraft(value.draft) : null;
    if (!isRecord(value) || value.version !== 1 || !clean || !Number.isInteger(value.stepIndex) || (value.stepIndex as number) < 0 || (value.stepIndex as number) > 3 || typeof value.expiresAt !== 'number' || !Number.isFinite(value.expiresAt) || value.expiresAt <= now || value.expiresAt > now + ORDER_DRAFT_TTL_MS) {
      clearOrderDraft(storage);
      return null;
    }
    return { draft: clean, stepIndex: value.stepIndex as number, expiresAt: value.expiresAt };
  } catch {
    clearOrderDraft(storage);
    return null;
  }
}

export function clearOrderDraft(storage: DraftStorage): boolean {
  try { storage.removeItem(ORDER_DRAFT_KEY); return true; }
  catch { return false; }
}
