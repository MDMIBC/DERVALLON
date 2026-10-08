import sourceRecords from './stellaFabrics.json';

export const stellaCollections = ['1000 TWISTS', 'HERITAGE', 'KALEIDOLUX', 'NEW EMPIRE'] as const;
export type StellaCollection = typeof stellaCollections[number];
export type StellaFabric = {
  id: string;
  collection: StellaCollection;
  reference: string;
  sourceArchive: string;
  sourceMember: string;
  sourceFilename: string;
  sha256: string;
  imageUrl: string;
};

// Generated from the supplied Stella ZIPs; reference identity is independent of photo uniqueness.
export const stellaFabrics: readonly StellaFabric[] = sourceRecords.map(record => ({
  ...record,
  collection: record.collection as StellaCollection,
}));
