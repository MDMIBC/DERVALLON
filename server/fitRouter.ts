import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  MEASUREMENT_REGISTRY_VERSION,
  assessMeasurements,
  buildStoredMeasurements,
} from "@shared/fitMeasurements";
import { fitPreferencesSchema, measurementInputSchema } from "@shared/fitSchemas";
import type { FitMeasurementRecord, FitPreferenceRecord } from "../drizzle/schema";
import { protectedProcedure, router } from "./_core/trpc";
import { appendFitRecord, getFitPreferences, listFitRecords, removeFitProfile, upsertFitPreferences } from "./fitDb";

const HISTORY_LIMIT = 10;

/** Customer-facing shape: never exposes the owner id or internal row id. */
const toPublicRecord = (record: FitMeasurementRecord) => ({
  version: record.version,
  source: record.source,
  registryVersion: record.registryVersion,
  measurements: record.measurements,
  verification: record.verification ?? null,
  confirmedAt: record.confirmedAt,
});
const toPublicPreferences = (row: FitPreferenceRecord | null) => row ? {
  jacketFit: row.jacketFit,
  trouserFit: row.trouserFit,
  notes: row.notes ?? "",
  updatedAt: row.updatedAt,
} : null;

export const fitProfileRouter = router({
  get: protectedProcedure.query(async ({ ctx }) => {
    const [records, preferences] = await Promise.all([listFitRecords(ctx.user.id, HISTORY_LIMIT + 1), getFitPreferences(ctx.user.id)]);
    const [current, ...history] = records.map(toPublicRecord);
    return { current: current ?? null, history, preferences: toPublicPreferences(preferences) };
  }),
  /**
   * Manual entry only. Owner, source, canonical values and verification are set by
   * the server; future scan imports will use a separate, verified ingestion path.
   */
  confirmMeasurements: protectedProcedure
    .input(z.object({ measurements: measurementInputSchema }).strict())
    .mutation(async ({ ctx, input }) => {
      const { errors } = assessMeasurements(input.measurements, { requireCore: true });
      if (errors.length) throw new TRPCError({ code: "BAD_REQUEST", message: errors[0].message });
      const created = await appendFitRecord(ctx.user.id, {
        source: "customer_manual",
        registryVersion: MEASUREMENT_REGISTRY_VERSION,
        measurements: buildStoredMeasurements(input.measurements),
      });
      return toPublicRecord(created);
    }),
  savePreferences: protectedProcedure.input(fitPreferencesSchema).mutation(async ({ ctx, input }) => {
    const saved = await upsertFitPreferences(ctx.user.id, { jacketFit: input.jacketFit ?? null, trouserFit: input.trouserFit ?? null, notes: input.notes ?? "" });
    return toPublicPreferences(saved);
  }),
  remove: protectedProcedure.mutation(({ ctx }) => removeFitProfile(ctx.user.id)),
});
