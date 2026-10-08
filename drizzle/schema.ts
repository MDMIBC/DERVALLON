import { index, int, json, mysqlEnum, mysqlTable, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const fitProfiles = mysqlTable("fit_profiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  height: varchar("height", { length: 16 }),
  chest: varchar("chest", { length: 16 }),
  waist: varchar("waist", { length: 16 }),
  preference: varchar("preference", { length: 32 }).default("tailored").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  userUnique: uniqueIndex("fit_profiles_user_id_unique").on(table.userId),
}));

export type FitProfile = typeof fitProfiles.$inferSelect;

/**
 * My DERVALLON Fit: append-only BODY measurement records. The highest version is
 * the current profile; earlier versions are history. Every entry keeps the
 * customer's original value and unit alongside an exact micrometre canonical
 * value. `verification` is reserved for confidence data supplied by a future
 * scanning or verification system and stays null for manual entries.
 * Garment/production measurements are deliberately not stored here.
 */
export type StoredBodyMeasurement = { value: string; unit: "cm" | "in"; valueUm: number };
export type StoredBodyMeasurements = Partial<Record<string, StoredBodyMeasurement>>;
export const fitMeasurementRecords = mysqlTable("fit_measurement_records", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  version: int("version").notNull(),
  source: mysqlEnum("source", ["customer_manual", "assisted", "future_3d_scan", "future_lidar_scan", "imported_verified"]).default("customer_manual").notNull(),
  registryVersion: int("registryVersion").notNull(),
  measurements: json("measurements").$type<StoredBodyMeasurements>().notNull(),
  verification: json("verification").$type<Record<string, unknown> | null>(),
  confirmedAt: timestamp("confirmedAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  userVersionUnique: uniqueIndex("fit_measurement_records_user_version_unique").on(table.userId, table.version),
}));

export type FitMeasurementRecord = typeof fitMeasurementRecords.$inferSelect;

/** Customer fit preferences, kept separate from body measurements and never converted into production adjustments. */
export const fitPreferences = mysqlTable("fit_preferences", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  jacketFit: varchar("jacketFit", { length: 16 }),
  trouserFit: varchar("trouserFit", { length: 16 }),
  notes: varchar("notes", { length: 500 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  userUnique: uniqueIndex("fit_preferences_user_id_unique").on(table.userId),
}));

export type FitPreferenceRecord = typeof fitPreferences.$inferSelect;

/** Design Studio direction. Rows saved before `kind` existed are studio designs. */
export type StudioDesignPayload = {
  kind?: "studio";
  garment?: string;
  silhouette?: string;
  jacketDetail?: string;
  trouserDetail?: string;
  profile?: string;
  notes: string;
};
/**
 * Bespoke Studio design. Stores only selections that exist on the site. Reference photos stay in
 * the browser tab and are never uploaded, so no photo data is stored. A design is not an order.
 */
export type BespokeDesignPayload = {
  kind: "bespoke";
  fabricId: string;
  silhouette: string;
  lapel: string;
  measurementMode: "manual" | "fit_profile";
  /** Manual entries in centimetres, exactly as typed. */
  measurements?: Record<string, string>;
  /** The customer's own My DERVALLON Fit version, verified server-side. */
  fitVersion?: number;
  fitConfirmedAt?: string;
};
export type SavedDesignPayload = StudioDesignPayload | BespokeDesignPayload;

export const savedDesigns = mysqlTable("saved_designs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 160 }).notNull(),
  payload: json("payload").$type<SavedDesignPayload>().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  userIndex: index("saved_designs_user_id_idx").on(table.userId),
}));

export type SavedDesign = typeof savedDesigns.$inferSelect;

// These tables intentionally contain no status, tracking, manufacturer, or fulfilment fields.
// They are empty foundations until a verified checkout and fulfilment contract exists.
export const orders = mysqlTable("orders", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  userIndex: index("orders_user_id_idx").on(table.userId),
}));

export type Order = typeof orders.$inferSelect;

export const wardrobeItems = mysqlTable("wardrobe_items", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  userIndex: index("wardrobe_items_user_id_idx").on(table.userId),
}));

export type WardrobeItem = typeof wardrobeItems.$inferSelect;
