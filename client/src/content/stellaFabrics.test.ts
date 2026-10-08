import { describe, expect, it } from 'vitest';
import { stellaFabrics, stellaCollections } from './stellaFabrics';
import { canAdvanceOrderPreview, defaultOrderPreview } from '@/lib/orderPreview';

const expectedCounts = {
  '1000 TWISTS': 41,
  HERITAGE: 61,
  KALEIDOLUX: 54,
  'NEW EMPIRE': 53,
} as const;

const expectedDuplicatePairs = [
  ['HERITAGE:2709A', 'HERITAGE:2710'],
  ['HERITAGE:4511A', 'HERITAGE:4512'],
  ['HERITAGE:4511B', 'HERITAGE:4513'],
  ['NEW EMPIRE:6720', 'NEW EMPIRE:6722'],
];

describe('Stella original swatch references', () => {
  it('retains all 209 separately identifiable source references in the four supplied collections', () => {
    expect(stellaFabrics).toHaveLength(209);
    expect(stellaCollections).toEqual(Object.keys(expectedCounts));
    for (const [collection, count] of Object.entries(expectedCounts)) {
      expect(stellaFabrics.filter(item => item.collection === collection)).toHaveLength(count);
    }
    expect(new Set(stellaFabrics.map(item => item.id)).size).toBe(209);
  });

  it('maps each original file and checksum to one record without inventing fabric specifications', () => {
    for (const item of stellaFabrics) {
      expect(item.id).toBe(`stella:${item.collection}:${item.reference}`);
      expect(item.sourceMember.split('/').at(-1)).toBe(item.sourceFilename);
      expect(item.sourceFilename.split('.')[0]).toBe(item.reference);
      expect(item.imageUrl).toMatch(/^\/manus-storage\/[^/]+\.jpg$/);
      expect(item.sha256).toMatch(/^[a-f0-9]{64}$/);
      for (const key of ['colour', 'weave', 'composition', 'season', 'availability', 'price', 'manufacturerId']) {
        expect(item).not.toHaveProperty(key);
      }
    }
  });

  it('preserves separate identities for four known exact-image duplicate pairs', () => {
    const grouped = new Map<string, string[]>();
    for (const item of stellaFabrics) grouped.set(item.sha256, [...(grouped.get(item.sha256) ?? []), `${item.collection}:${item.reference}`]);
    expect([...grouped.values()].filter(group => group.length > 1).map(group => group.sort()).sort())
      .toEqual(expectedDuplicatePairs.map(group => group.sort()).sort());
    expect(grouped.size).toBe(205);
  });

  it('accepts a source-backed reference without invalidating existing locally saved example directions', () => {
    expect(canAdvanceOrderPreview('fabric', { ...defaultOrderPreview, fabricId: stellaFabrics[0].id })).toBe(true);
    expect(canAdvanceOrderPreview('fabric', { ...defaultOrderPreview, fabricId: 'midnight' })).toBe(true);
    expect(canAdvanceOrderPreview('fabric', { ...defaultOrderPreview, fabricId: 'unknown' })).toBe(false);
  });
});
