import { and, desc, eq } from "drizzle-orm";
import type { MySql2Database } from "drizzle-orm/mysql2";
import { savedDesigns, type SavedDesignPayload } from "../drizzle/schema";
import { getDb } from "./db";

type Db = MySql2Database<Record<string, unknown>>;
type DesignInput = { title: string; payload: SavedDesignPayload };
const LIST_LIMIT = 50;

/** Every query is filtered by the authenticated customer's user id; a design id alone never addresses a row. */
export const designQueries = {
  list: (db: Db, userId: number) => db.select().from(savedDesigns)
    .where(eq(savedDesigns.userId, userId)).orderBy(desc(savedDesigns.updatedAt), desc(savedDesigns.id)).limit(LIST_LIMIT),
  get: (db: Db, userId: number, id: number) => db.select().from(savedDesigns)
    .where(and(eq(savedDesigns.userId, userId), eq(savedDesigns.id, id))).limit(1),
  update: (db: Db, userId: number, id: number, input: DesignInput) => db.update(savedDesigns)
    .set({ title: input.title, payload: input.payload })
    .where(and(eq(savedDesigns.userId, userId), eq(savedDesigns.id, id))),
  remove: (db: Db, userId: number, id: number) => db.delete(savedDesigns)
    .where(and(eq(savedDesigns.userId, userId), eq(savedDesigns.id, id))),
};

async function requireDb(): Promise<Db> {
  const db = await getDb();
  if (!db) throw new Error("Database is not configured");
  return db;
}

const affected = (result: unknown) => Number((result as [{ affectedRows?: number }] | undefined)?.[0]?.affectedRows ?? 0);

export async function listSavedDesigns(userId: number) {
  return designQueries.list(await requireDb(), userId);
}

export async function getSavedDesign(userId: number, id: number) {
  const [row] = await designQueries.get(await requireDb(), userId, id);
  return row ?? null;
}

export async function createSavedDesign(userId: number, input: DesignInput) {
  const db = await requireDb();
  const result = await db.insert(savedDesigns).values({ userId, title: input.title, payload: input.payload });
  const id = Number(result[0].insertId);
  const [created] = await designQueries.get(db, userId, id);
  return created;
}

/** Returns null when the design does not exist for this customer; nothing else is touched. */
export async function updateSavedDesign(userId: number, id: number, input: DesignInput) {
  const db = await requireDb();
  const [existing] = await designQueries.get(db, userId, id);
  if (!existing) return null;
  await designQueries.update(db, userId, id, input);
  const [updated] = await designQueries.get(db, userId, id);
  return updated ?? null;
}

export async function deleteSavedDesign(userId: number, id: number) {
  const result = await designQueries.remove(await requireDb(), userId, id);
  return { removed: affected(result) > 0 };
}
