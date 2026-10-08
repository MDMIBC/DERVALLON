import { and, desc, eq } from "drizzle-orm";
import type { MySql2Database } from "drizzle-orm/mysql2";
import { fitMeasurementRecords, fitPreferences, fitProfiles, type StoredBodyMeasurements } from "../drizzle/schema";
import { getDb } from "./db";

type Db = MySql2Database<Record<string, unknown>>;
type MeasurementSourceValue = (typeof fitMeasurementRecords.source.enumValues)[number];

/** Every query is filtered by the authenticated customer's user id; nothing is addressable by record id alone. */
export const fitQueries = {
  records: (db: Db, userId: number, limit: number) => db.select().from(fitMeasurementRecords)
    .where(eq(fitMeasurementRecords.userId, userId)).orderBy(desc(fitMeasurementRecords.version)).limit(limit),
  latest: (db: Db, userId: number) => db.select({ version: fitMeasurementRecords.version }).from(fitMeasurementRecords)
    .where(eq(fitMeasurementRecords.userId, userId)).orderBy(desc(fitMeasurementRecords.version)).limit(1),
  version: (db: Db, userId: number, version: number) => db.select().from(fitMeasurementRecords)
    .where(and(eq(fitMeasurementRecords.userId, userId), eq(fitMeasurementRecords.version, version))).limit(1),
  preferences: (db: Db, userId: number) => db.select().from(fitPreferences).where(eq(fitPreferences.userId, userId)).limit(1),
  removeRecords: (db: Db, userId: number) => db.delete(fitMeasurementRecords).where(eq(fitMeasurementRecords.userId, userId)),
  removePreferences: (db: Db, userId: number) => db.delete(fitPreferences).where(eq(fitPreferences.userId, userId)),
  removeLegacyProfile: (db: Db, userId: number) => db.delete(fitProfiles).where(eq(fitProfiles.userId, userId)),
};

export function isDuplicateEntry(error: unknown): boolean {
  const code = (value: unknown) => (value as { code?: unknown } | null)?.code;
  return code(error) === "ER_DUP_ENTRY" || code((error as { cause?: unknown } | null)?.cause) === "ER_DUP_ENTRY";
}

async function requireDb(): Promise<Db> {
  const db = await getDb();
  if (!db) throw new Error("Database is not configured");
  return db;
}

export async function listFitRecords(userId: number, limit: number) {
  return fitQueries.records(await requireDb(), userId, limit);
}

/** One version of the signed-in customer's own fit profile, or null if it is not theirs. */
export async function getFitRecordVersion(userId: number, version: number) {
  const [row] = await fitQueries.version(await requireDb(), userId, version);
  return row ?? null;
}

/** Appends a new version; earlier versions are kept as history and never overwritten. */
export async function appendFitRecord(userId: number, input: { source: MeasurementSourceValue; registryVersion: number; measurements: StoredBodyMeasurements }) {
  const db = await requireDb();
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const [latest] = await fitQueries.latest(db, userId);
    const version = (latest?.version ?? 0) + 1;
    try {
      await db.insert(fitMeasurementRecords).values({ userId, version, source: input.source, registryVersion: input.registryVersion, measurements: input.measurements, verification: null, confirmedAt: new Date() });
    } catch (error) {
      if (isDuplicateEntry(error) && attempt < 2) continue;
      throw error;
    }
    const [created] = await fitQueries.version(db, userId, version);
    return created;
  }
  throw new Error("The fit profile could not be saved");
}

export async function getFitPreferences(userId: number) {
  const [row] = await fitQueries.preferences(await requireDb(), userId);
  return row ?? null;
}

export async function upsertFitPreferences(userId: number, input: { jacketFit: string | null; trouserFit: string | null; notes: string }) {
  const db = await requireDb();
  const values = { jacketFit: input.jacketFit, trouserFit: input.trouserFit, notes: input.notes || null };
  await db.insert(fitPreferences).values({ userId, ...values }).onDuplicateKeyUpdate({ set: values });
  return getFitPreferences(userId);
}

export async function removeFitProfile(userId: number) {
  const db = await requireDb();
  await fitQueries.removeRecords(db, userId);
  await fitQueries.removePreferences(db, userId);
  await fitQueries.removeLegacyProfile(db, userId);
  return { success: true as const };
}
