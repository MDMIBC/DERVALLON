/**
 * My DERVALLON Fit — canonical BODY measurement model.
 *
 * These are measurements of the customer's body, never garment or production
 * measurements. Manufacturer codes, ease allowances, size conversions and
 * pattern rules are intentionally absent until verified requirements exist.
 * Manual entries and future scan-derived values share this same model.
 */

export const MEASUREMENT_UNITS = ["cm", "in"] as const;
export type MeasurementUnit = (typeof MEASUREMENT_UNITS)[number];

export const MEASUREMENT_SOURCES = ["customer_manual", "assisted", "future_3d_scan", "future_lidar_scan", "imported_verified"] as const;
export type MeasurementSource = (typeof MEASUREMENT_SOURCES)[number];
export const MEASUREMENT_SOURCE_LABELS: Record<MeasurementSource, string> = {
  customer_manual: "Entered by you",
  assisted: "Taken with assistance",
  future_3d_scan: "3D scan",
  future_lidar_scan: "LiDAR scan",
  imported_verified: "Imported and verified",
};

/** Bump when the registry gains or changes measurements so stored records stay interpretable. */
export const MEASUREMENT_REGISTRY_VERSION = 1;

export const MEASUREMENT_KEYS = [
  "height", "neck", "shoulder", "chest", "stomach", "naturalWaist", "sleeve", "bicep", "wrist",
  "seat", "trouserWaist", "thigh", "knee", "calf", "outseam", "inseam",
] as const;
export type MeasurementKey = (typeof MEASUREMENT_KEYS)[number];

export const MEASUREMENT_GROUPS = [
  { id: "overall", label: "Overall", title: "Begin with", emphasis: "your height." },
  { id: "upper", label: "Upper body", title: "Neck, shoulders", emphasis: "and torso." },
  { id: "arms", label: "Arms", title: "Sleeve, arm", emphasis: "and wrist." },
  { id: "lower", label: "Lower body", title: "Seat, legs", emphasis: "and length." },
] as const;
export type MeasurementGroup = (typeof MEASUREMENT_GROUPS)[number]["id"];

export type MeasurementDefinition = {
  key: MeasurementKey;
  label: string;
  group: MeasurementGroup;
  kind: "length" | "circumference";
  where: string;
  tape: string;
  position: string;
  /** Data-entry check thresholds only: outside them we ask the customer to check. Never a body standard. */
  checkRangeCm: readonly [number, number];
  /** Beyond this the value cannot be a body measurement (for example a missed decimal point). */
  limitCm: number;
  /** Reserved for verified instructional imagery; deliberately empty until approved assets exist. */
  illustration: { src: string; alt: string } | null;
};

export const BODY_MEASUREMENTS: readonly MeasurementDefinition[] = [
  { key: "height", label: "Height", group: "overall", kind: "length", where: "Your standing height, from the floor to the top of your head.", tape: "Rest a flat object level on your head against a wall, then measure straight down to the floor.", position: "Stand barefoot with heels against the wall, looking straight ahead.", checkRangeCm: [140, 215], limitCm: 300, illustration: null },
  { key: "neck", label: "Neck", group: "upper", kind: "circumference", where: "Around the base of your neck, where a shirt collar would sit.", tape: "Keep the tape level and flat, with room to slip one finger beneath it.", position: "Stand tall with shoulders relaxed and head level.", checkRangeCm: [30, 60], limitCm: 120, illustration: null },
  { key: "shoulder", label: "Shoulder width", group: "upper", kind: "length", where: "Across the back, from one shoulder point to the other.", tape: "Follow the natural curve across the top of the back, just below the base of the neck.", position: "Stand relaxed with arms by your sides; ask someone to measure for you.", checkRangeCm: [35, 65], limitCm: 150, illustration: null },
  { key: "chest", label: "Chest", group: "upper", kind: "circumference", where: "Around the fullest part of your chest, under the arms and across the shoulder blades.", tape: "Keep the tape level all the way round, flat and comfortably snug.", position: "Arms relaxed at your sides; breathe normally.", checkRangeCm: [75, 160], limitCm: 400, illustration: null },
  { key: "stomach", label: "Stomach", group: "upper", kind: "circumference", where: "Around the fullest part of your stomach, usually at or just below the navel.", tape: "Keep the tape level and flat without drawing it in.", position: "Stand naturally and breathe out; do not hold your stomach in.", checkRangeCm: [60, 170], limitCm: 400, illustration: null },
  { key: "naturalWaist", label: "Natural waist", group: "upper", kind: "circumference", where: "Around your natural waist, the narrowest point between ribs and hips.", tape: "Keep the tape horizontal and flat against the body.", position: "Stand relaxed and breathe normally.", checkRangeCm: [55, 165], limitCm: 400, illustration: null },
  { key: "sleeve", label: "Sleeve length", group: "arms", kind: "length", where: "From the shoulder point, over a slightly bent elbow, to the wrist bone.", tape: "Run the tape along the outside of the arm, lying flat.", position: "Let your arm hang relaxed with a slight bend at the elbow.", checkRangeCm: [50, 80], limitCm: 150, illustration: null },
  { key: "bicep", label: "Bicep", group: "arms", kind: "circumference", where: "Around the fullest part of the upper arm.", tape: "Keep the tape at right angles to the arm, snug but not pressing in.", position: "Let the arm hang naturally; do not flex.", checkRangeCm: [20, 55], limitCm: 150, illustration: null },
  { key: "wrist", label: "Wrist", group: "arms", kind: "circumference", where: "Around the wrist, just above the wrist bone.", tape: "Wrap the tape flat around the wrist without compressing it.", position: "Keep the hand relaxed.", checkRangeCm: [13, 25], limitCm: 80, illustration: null },
  { key: "seat", label: "Seat / hips", group: "lower", kind: "circumference", where: "Around the fullest part of your seat and hips.", tape: "Keep the tape parallel to the floor around the widest point.", position: "Stand straight with feet together.", checkRangeCm: [75, 165], limitCm: 400, illustration: null },
  { key: "trouserWaist", label: "Trouser waist", group: "lower", kind: "circumference", where: "Around the point where you prefer your trousers to sit.", tape: "Keep the tape level all the way round and lying flat.", position: "Stand naturally; this is often lower than your natural waist.", checkRangeCm: [60, 165], limitCm: 400, illustration: null },
  { key: "thigh", label: "Thigh", group: "lower", kind: "circumference", where: "Around the fullest part of the upper thigh, just below the crotch.", tape: "Keep the tape horizontal around the leg.", position: "Stand with weight even on both feet, legs slightly apart.", checkRangeCm: [40, 90], limitCm: 200, illustration: null },
  { key: "knee", label: "Knee", group: "lower", kind: "circumference", where: "Around the middle of the knee.", tape: "Keep the tape level and flat.", position: "Stand straight with the knee relaxed rather than locked.", checkRangeCm: [30, 60], limitCm: 150, illustration: null },
  { key: "calf", label: "Calf", group: "lower", kind: "circumference", where: "Around the fullest part of the calf.", tape: "Keep the tape horizontal around the leg.", position: "Stand with weight even on both feet.", checkRangeCm: [28, 55], limitCm: 150, illustration: null },
  { key: "outseam", label: "Outseam", group: "lower", kind: "length", where: "Down the outside of the leg, from your trouser waist point to where you would like the hem.", tape: "Follow the side of the leg in a straight line.", position: "Stand straight, ideally in the shoes you expect to wear.", checkRangeCm: [85, 125], limitCm: 200, illustration: null },
  { key: "inseam", label: "Inseam", group: "lower", kind: "length", where: "Down the inside of the leg, from the crotch to where you would like the hem.", tape: "Keep the tape straight along the inner leg.", position: "Stand straight with feet slightly apart; ask someone to help if you can.", checkRangeCm: [60, 100], limitCm: 160, illustration: null },
];

/** Not yet collected: each needs a verified DERVALLON or manufacturer requirement before it is added. */
export const DEFERRED_MEASUREMENTS = [
  { key: "weight", reason: "Not a tape measurement; mass units would be added only if a verified fitting process requires it." },
  { key: "rise", reason: "Difficult to self-measure reliably and usually a garment specification; awaiting a verified requirement." },
  { key: "jacketLength", reason: "A garment length decision for the future production mapping, not a body measurement." },
] as const;

export const CORE_MEASUREMENT_KEYS: readonly MeasurementKey[] = ["height", "chest", "naturalWaist", "seat"];

/** Pairs where the first body measurement is always smaller than the second. */
const CONSISTENCY_PAIRS: readonly (readonly [MeasurementKey, MeasurementKey])[] = [
  ["neck", "chest"], ["wrist", "bicep"], ["knee", "thigh"], ["inseam", "outseam"], ["outseam", "height"],
];

export const measurementDefinition = (key: MeasurementKey) => BODY_MEASUREMENTS.find((definition) => definition.key === key)!;
export const tapeCare = (definition: MeasurementDefinition) => definition.kind === "circumference" ? "Snug, never tight: do not pull the tape in." : "Keep the tape flat and straight; never pull it tight.";

export type EnteredMeasurement = { value: string; unit: MeasurementUnit };
export type MeasurementValues = Partial<Record<MeasurementKey, EnteredMeasurement>>;
export type StoredMeasurement = EnteredMeasurement & { valueUm: number };
export type StoredMeasurements = Partial<Record<MeasurementKey, StoredMeasurement>>;

export type ParseResult =
  | { ok: true; hundredths: number; normalized: string }
  | { ok: false; reason: "empty" | "malformed" | "comma" | "not-positive" };

export function parseMeasurementInput(raw: string): ParseResult {
  const value = raw.trim();
  if (!value) return { ok: false, reason: "empty" };
  if (/^-\d+(?:\.\d+)?$/.test(value)) return { ok: false, reason: "not-positive" };
  if (/^\d+,\d{1,2}$/.test(value)) return { ok: false, reason: "comma" };
  const match = /^(\d{1,5})(?:\.(\d{1,2}))?$/.exec(value);
  if (!match) return { ok: false, reason: "malformed" };
  const hundredths = Number(match[1]) * 100 + Number((match[2] ?? "").padEnd(2, "0"));
  if (hundredths === 0) return { ok: false, reason: "not-positive" };
  return { ok: true, hundredths, normalized: value };
}

/** Exact integer conversion: 0.01 cm = 100 µm and 0.01 in = 254 µm. */
export function toMicrometres(hundredths: number, unit: MeasurementUnit): number {
  return hundredths * (unit === "cm" ? 100 : 254);
}

const trimDecimals = (text: string) => text.replace(/\.?0+$/, "");
export function formatLength(valueUm: number, unit: MeasurementUnit): string {
  if (unit === "cm") {
    const tenths = Math.round(valueUm / 1000);
    return `${trimDecimals((tenths / 10).toFixed(1))} cm`;
  }
  const hundredths = Math.round(valueUm / 254);
  return `${trimDecimals((hundredths / 100).toFixed(2))} in`;
}

export const otherUnit = (unit: MeasurementUnit): MeasurementUnit => unit === "cm" ? "in" : "cm";

/** Validates entries and returns only server-trusted stored values; never converts the original. */
export function buildStoredMeasurements(values: MeasurementValues): StoredMeasurements {
  const stored: StoredMeasurements = {};
  for (const { key } of BODY_MEASUREMENTS) {
    const entry = values[key];
    if (!entry || !entry.value.trim()) continue;
    const parsed = parseMeasurementInput(entry.value);
    if (!parsed.ok) throw new Error(`Invalid ${key} measurement`);
    stored[key] = { value: parsed.normalized, unit: entry.unit, valueUm: toMicrometres(parsed.hundredths, entry.unit) };
  }
  return stored;
}

export type MeasurementIssue = {
  key: MeasurementKey | null;
  keys?: MeasurementKey[];
  code: "required" | "malformed" | "comma" | "not-positive" | "too-large" | "possible-unit-mismatch" | "unusual" | "inconsistent";
  message: string;
  suggestedUnit?: MeasurementUnit;
};

const unitName = (unit: MeasurementUnit) => unit === "cm" ? "centimetres" : "inches";

export function assessMeasurements(values: MeasurementValues, options: { requireCore: boolean }) {
  const errors: MeasurementIssue[] = [];
  const warnings: MeasurementIssue[] = [];
  const canonical: Partial<Record<MeasurementKey, number>> = {};
  for (const definition of BODY_MEASUREMENTS) {
    const { key, label, checkRangeCm, limitCm } = definition;
    const entry = values[key];
    const parsed = parseMeasurementInput(entry?.value ?? "");
    const name = label.toLowerCase();
    if (!parsed.ok) {
      if (parsed.reason === "empty") {
        if (options.requireCore && CORE_MEASUREMENT_KEYS.includes(key)) errors.push({ key, code: "required", message: `Add your ${name} to confirm this profile.` });
        continue;
      }
      const message = parsed.reason === "comma" ? "Use a full stop for decimals, for example 102.5."
        : parsed.reason === "not-positive" ? "Enter a measurement greater than zero."
        : "Enter a number, for example 102 or 102.5.";
      errors.push({ key, code: parsed.reason, message });
      continue;
    }
    const unit = entry!.unit;
    const alternate = otherUnit(unit);
    const cm = toMicrometres(parsed.hundredths, unit) / 10000;
    const alternateCm = toMicrometres(parsed.hundredths, alternate) / 10000;
    const typical = (value: number) => value >= checkRangeCm[0] && value <= checkRangeCm[1];
    if (cm > limitCm) {
      const suggestion = typical(alternateCm) ? alternate : undefined;
      errors.push({ key, code: "too-large", suggestedUnit: suggestion, message: `${parsed.normalized} ${unit} is beyond what we can accept for ${name}.${suggestion ? ` Did you mean ${unitName(suggestion)}?` : " Please check the number and unit."}` });
      continue;
    }
    canonical[key] = toMicrometres(parsed.hundredths, unit);
    if (typical(cm)) continue;
    if (typical(alternateCm)) warnings.push({ key, code: "possible-unit-mismatch", suggestedUnit: alternate, message: `Please check this measurement. ${parsed.normalized} ${unit} is unusual for ${name}, but typical in ${unitName(alternate)}.` });
    else warnings.push({ key, code: "unusual", message: "Please check this measurement. It is outside the range we usually see, which may still be right for you." });
  }
  for (const [smaller, larger] of CONSISTENCY_PAIRS) {
    const a = canonical[smaller];
    const b = canonical[larger];
    if (a === undefined || b === undefined || a < b) continue;
    warnings.push({ key: null, keys: [smaller, larger], code: "inconsistent", message: `Please check these measurements. ${measurementDefinition(smaller).label} is usually smaller than ${measurementDefinition(larger).label.toLowerCase()}.` });
  }
  return { errors, warnings, canonical };
}

export const FIT_PREFERENCE_CHOICES = [
  { id: "closer", label: "Closer / slimmer", note: "A nearer line through the body" },
  { id: "balanced", label: "Balanced / classic", note: "A measured, classic line" },
  { id: "relaxed", label: "More relaxed", note: "More room to move" },
] as const;
export type FitPreferenceChoice = (typeof FIT_PREFERENCE_CHOICES)[number]["id"];
export const FIT_PREFERENCE_CATEGORIES = [
  { key: "jacketFit", label: "Jacket fit" },
  { key: "trouserFit", label: "Trouser fit" },
] as const;
export const preferenceLabel = (choice: string | null | undefined) => FIT_PREFERENCE_CHOICES.find(({ id }) => id === choice)?.label ?? "Not set";
