import { z } from "zod";
import { FIT_PREFERENCE_CHOICES, MEASUREMENT_KEYS, MEASUREMENT_UNITS, type FitPreferenceChoice } from "./fitMeasurements";

/** Server request schemas, kept apart from the model so client bundles do not include zod. */
export const enteredMeasurementSchema = z.object({ value: z.string().trim().max(16), unit: z.enum(MEASUREMENT_UNITS) }).strict();
export const measurementInputSchema = z.partialRecord(z.enum(MEASUREMENT_KEYS), enteredMeasurementSchema);

const preferenceChoice = z.enum(FIT_PREFERENCE_CHOICES.map(({ id }) => id) as [FitPreferenceChoice, ...FitPreferenceChoice[]]);
/** Customer preferences only. They are not converted into production adjustments. */
export const fitPreferencesSchema = z.object({
  jacketFit: preferenceChoice.nullable().optional(),
  trouserFit: preferenceChoice.nullable().optional(),
  notes: z.string().trim().max(500).optional(),
}).strict();
export type FitPreferencesInput = z.infer<typeof fitPreferencesSchema>;
