import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { findOptionLabel, studioOptions } from "@/content/siteContent";
import { stellaFabrics } from "@/content/stellaFabrics";
import { fabricStudies, isFabricSelectable, lapels, measurementFields, silhouettes, validateMeasurements } from "@/lib/orderPreview";
import type { BespokeDesignPayload, SavedDesign, SavedDesignPayload, StudioDesignPayload } from "../drizzle/schema";
import { protectedProcedure, router } from "./_core/trpc";
import { createSavedDesign, deleteSavedDesign, getSavedDesign, listSavedDesigns, updateSavedDesign } from "./designsDb";
import { getFitRecordVersion } from "./fitDb";

/*
 * Saved designs belong to the authenticated customer (ctx.user.id) only. The browser never sends an
 * owner, title, price, order or production field: the input is a strict, closed set of selections that
 * already exist on the site. Saving a design never creates, places or transmits an order.
 */
const ids = <T extends readonly { id: string }[]>(options: T) => options.map(({ id }) => id) as [T[number]["id"], ...T[number]["id"][]];
const optionalStudio = (group: keyof typeof studioOptions) => z.enum(ids(studioOptions[group])).optional();

const studioDesign = z.strictObject({
  kind: z.literal("studio"),
  garment: optionalStudio("garment"),
  silhouette: optionalStudio("silhouette"),
  jacketDetail: optionalStudio("jacketDetail"),
  trouserDetail: optionalStudio("trouserDetail"),
  profile: optionalStudio("profile"),
  notes: z.string().max(2000),
});

const fabricIds = new Set<string>([
  ...fabricStudies.filter(isFabricSelectable).map(({ id }) => id),
  ...stellaFabrics.map(({ id }) => id),
]);
const measurementValue = z.string().trim().max(12);
const manualMeasurements = z.strictObject(Object.fromEntries(measurementFields.map(({ key }) => [key, measurementValue])) as Record<(typeof measurementFields)[number]["key"], typeof measurementValue>);

const bespokeDesign = z.strictObject({
  kind: z.literal("bespoke"),
  fabricId: z.string().max(80).refine((id) => fabricIds.has(id), "Choose a fabric from the DERVALLON collections."),
  silhouette: z.enum(ids(silhouettes)),
  lapel: z.enum(ids(lapels)),
  measurementMode: z.enum(["manual", "fit_profile"]),
  measurements: manualMeasurements.optional(),
  fitVersion: z.number().int().positive().optional(),
}).superRefine((design, context) => {
  if (design.measurementMode === "manual") {
    if (!design.measurements) context.addIssue({ code: "custom", path: ["measurements"], message: "Manual measurements are required." });
    else if (Object.keys(validateMeasurements(design.measurements)).length) context.addIssue({ code: "custom", path: ["measurements"], message: "Correct the measurements before saving." });
    if (design.fitVersion !== undefined) context.addIssue({ code: "custom", path: ["fitVersion"], message: "A fit version is only used with a saved fit profile." });
  } else {
    if (design.fitVersion === undefined) context.addIssue({ code: "custom", path: ["fitVersion"], message: "Choose a saved fit profile version." });
    if (design.measurements !== undefined) context.addIssue({ code: "custom", path: ["measurements"], message: "Saved fit designs do not store separate measurements." });
  }
});

const saveInput = z.strictObject({
  id: z.number().int().positive().optional(),
  design: z.discriminatedUnion("kind", [studioDesign, bespokeDesign]),
});
const idInput = z.strictObject({ id: z.number().int().positive() });

const isBespoke = (payload: SavedDesignPayload): payload is BespokeDesignPayload => payload.kind === "bespoke";

function fabricLabel(fabricId: string) {
  const reference = stellaFabrics.find(({ id }) => id === fabricId);
  if (reference) return `${reference.collection} · ${reference.reference}`;
  return fabricStudies.find(({ id }) => id === fabricId)?.name ?? "Fabric no longer listed";
}
const optionLabel = (options: readonly { id: string; label: string }[], id: string) => options.find((option) => option.id === id)?.label ?? "Not selected";

function titleFor(payload: SavedDesignPayload) {
  if (isBespoke(payload)) return `${fabricLabel(payload.fabricId)} direction`;
  return payload.garment ? `${findOptionLabel("garment", payload.garment)} direction` : "Design direction";
}

function detailsFor(payload: SavedDesignPayload) {
  if (isBespoke(payload)) {
    const entered = payload.measurements ? measurementFields.filter(({ key }) => payload.measurements?.[key]?.trim()).length : 0;
    const measurements = payload.measurementMode === "fit_profile"
      ? `My DERVALLON Fit · version ${payload.fitVersion}`
      : entered ? `Entered for this design (${entered} of ${measurementFields.length})` : "Not entered";
    return [
      { label: "Fabric", value: fabricLabel(payload.fabricId) },
      { label: "Silhouette", value: optionLabel(silhouettes, payload.silhouette) },
      { label: "Lapel", value: optionLabel(lapels, payload.lapel) },
      { label: "Measurements", value: measurements },
    ];
  }
  return [
    { label: "Garment", value: findOptionLabel("garment", payload.garment) },
    { label: "Silhouette", value: findOptionLabel("silhouette", payload.silhouette) },
    { label: "Jacket detail", value: findOptionLabel("jacketDetail", payload.jacketDetail) },
    ...(payload.garment === "jacket" ? [] : [{ label: "Trouser detail", value: findOptionLabel("trouserDetail", payload.trouserDetail) }]),
    { label: "Measurement profile", value: findOptionLabel("profile", payload.profile) },
  ];
}

/** Customer-facing shape: never exposes the owner id. Rows saved before `kind` existed are studio designs. */
export function toPublicDesign(row: SavedDesign) {
  const payload: SavedDesignPayload = isBespoke(row.payload) ? row.payload : { ...row.payload, kind: "studio" };
  return {
    id: row.id,
    title: row.title,
    kind: isBespoke(payload) ? "bespoke" as const : "studio" as const,
    payload,
    details: detailsFor(payload),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

async function storedPayload(userId: number, design: z.infer<typeof saveInput>["design"]): Promise<SavedDesignPayload> {
  if (design.kind === "studio") {
    const studio: StudioDesignPayload = {
      kind: "studio", garment: design.garment, silhouette: design.silhouette, jacketDetail: design.jacketDetail,
      trouserDetail: design.trouserDetail, profile: design.profile, notes: design.notes,
    };
    return studio;
  }
  const base = { kind: "bespoke" as const, fabricId: design.fabricId, silhouette: design.silhouette, lapel: design.lapel };
  if (design.measurementMode === "manual") {
    return { ...base, measurementMode: "manual", measurements: { ...design.measurements! } };
  }
  // The fit version must belong to this customer; its confirmation date comes from the server record.
  const record = await getFitRecordVersion(userId, design.fitVersion!);
  if (!record) throw new TRPCError({ code: "BAD_REQUEST", message: "That fit profile version is not available on your account." });
  return { ...base, measurementMode: "fit_profile", fitVersion: record.version, fitConfirmedAt: new Date(record.confirmedAt).toISOString() };
}

export const designsRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => (await listSavedDesigns(ctx.user.id)).map(toPublicDesign)),
  get: protectedProcedure.input(idInput).query(async ({ ctx, input }) => {
    const row = await getSavedDesign(ctx.user.id, input.id);
    if (!row) throw new TRPCError({ code: "NOT_FOUND", message: "This saved design is not available on your account." });
    return toPublicDesign(row);
  }),
  /** Creates a design, or updates one the customer already owns. Never creates or submits an order. */
  save: protectedProcedure.input(saveInput).mutation(async ({ ctx, input }) => {
    const payload = await storedPayload(ctx.user.id, input.design);
    const values = { title: titleFor(payload), payload };
    if (input.id === undefined) return toPublicDesign(await createSavedDesign(ctx.user.id, values));
    const updated = await updateSavedDesign(ctx.user.id, input.id, values);
    if (!updated) throw new TRPCError({ code: "NOT_FOUND", message: "This saved design is not available on your account." });
    return toPublicDesign(updated);
  }),
  delete: protectedProcedure.input(idInput).mutation(({ ctx, input }) => deleteSavedDesign(ctx.user.id, input.id)),
});
