import { describe, expect, it } from "vitest";
import {
  BODY_MEASUREMENTS,
  CORE_MEASUREMENT_KEYS,
  MEASUREMENT_SOURCES,
  assessMeasurements,
  buildStoredMeasurements,
  formatLength,
  parseMeasurementInput,
  toMicrometres,
} from "../shared/fitMeasurements";
import { fitPreferencesSchema, measurementInputSchema } from "../shared/fitSchemas";

const codes = (issues: { code: string; key: string | null }[]) => issues.map(({ code, key }) => `${key}:${code}`);

describe("body measurement registry", () => {
  it("defines unique body measurements with customer guidance and no manufacturer fields", () => {
    const keys = BODY_MEASUREMENTS.map(({ key }) => key);
    expect(new Set(keys).size).toBe(keys.length);
    for (const definition of BODY_MEASUREMENTS) {
      expect(definition.where.length).toBeGreaterThan(10);
      expect(definition.tape.length).toBeGreaterThan(10);
      expect(definition.position.length).toBeGreaterThan(10);
      expect(Object.keys(definition)).not.toEqual(expect.arrayContaining(["manufacturerCode", "ease", "garmentValue"]));
    }
    expect(CORE_MEASUREMENT_KEYS).toEqual(["height", "chest", "naturalWaist", "seat"]);
  });

  it("prepares future scan sources without making them a default", () => {
    expect(MEASUREMENT_SOURCES).toEqual(["customer_manual", "assisted", "future_3d_scan", "future_lidar_scan", "imported_verified"]);
  });
});

describe("parsing entered values", () => {
  it("accepts plain decimals up to two places and reports exact hundredths", () => {
    expect(parseMeasurementInput("102.5")).toEqual({ ok: true, hundredths: 10250, normalized: "102.5" });
    expect(parseMeasurementInput(" 40 ")).toEqual({ ok: true, hundredths: 4000, normalized: "40" });
  });

  it("explains empty, malformed, comma-decimal and non-positive input", () => {
    expect(parseMeasurementInput("")).toEqual({ ok: false, reason: "empty" });
    expect(parseMeasurementInput("wide")).toEqual({ ok: false, reason: "malformed" });
    expect(parseMeasurementInput("1.234")).toEqual({ ok: false, reason: "malformed" });
    expect(parseMeasurementInput("1e2")).toEqual({ ok: false, reason: "malformed" });
    expect(parseMeasurementInput("102,5")).toEqual({ ok: false, reason: "comma" });
    expect(parseMeasurementInput("-3")).toEqual({ ok: false, reason: "not-positive" });
    expect(parseMeasurementInput("0.00")).toEqual({ ok: false, reason: "not-positive" });
  });
});

describe("deterministic units", () => {
  it("converts both units to exact integer micrometres", () => {
    expect(toMicrometres(10250, "cm")).toBe(1025000);
    expect(toMicrometres(4025, "in")).toBe(1022350);
  });

  it("formats equivalents without changing the stored original", () => {
    expect(formatLength(1022350, "in")).toBe("40.25 in");
    expect(formatLength(1022350, "cm")).toBe("102.2 cm");
    expect(formatLength(1025000, "in")).toBe("40.35 in");
    const stored = buildStoredMeasurements({ chest: { value: "40.25", unit: "in" }, height: { value: "182", unit: "cm" } });
    expect(stored).toEqual({
      chest: { value: "40.25", unit: "in", valueUm: 1022350 },
      height: { value: "182", unit: "cm", valueUm: 1820000 },
    });
  });

  it("refuses to build stored values from invalid input", () => {
    expect(() => buildStoredMeasurements({ chest: { value: "wide", unit: "cm" } })).toThrow(/chest/);
  });
});

describe("assessing measurements", () => {
  it("blocks only clearly invalid values", () => {
    const result = assessMeasurements({ chest: { value: "0", unit: "cm" }, waistline: { value: "80", unit: "cm" } } as never, { requireCore: false });
    expect(codes(result.errors)).toEqual(["chest:not-positive"]);
  });

  it("warns, rather than blocks, for unusual but possible bodies", () => {
    const result = assessMeasurements({ stomach: { value: "190", unit: "cm" }, height: { value: "132", unit: "cm" } }, { requireCore: false });
    expect(result.errors).toEqual([]);
    expect(codes(result.warnings)).toEqual(["height:unusual", "stomach:unusual"]);
    expect(result.warnings[0].message).toMatch(/please check this measurement/i);
    expect(result.warnings.map(({ message }) => message).join(" ")).not.toMatch(/impossible/i);
  });

  it("detects likely centimetre and inch confusion and suggests the other unit", () => {
    const inchesTypedAsCm = assessMeasurements({ chest: { value: "40", unit: "cm" } }, { requireCore: false });
    expect(inchesTypedAsCm.errors).toEqual([]);
    expect(inchesTypedAsCm.warnings[0]).toMatchObject({ key: "chest", code: "possible-unit-mismatch", suggestedUnit: "in" });
    const cmTypedAsInches = assessMeasurements({ chest: { value: "102", unit: "in" } }, { requireCore: false });
    expect(cmTypedAsInches.warnings[0]).toMatchObject({ key: "chest", code: "possible-unit-mismatch", suggestedUnit: "cm" });
    const clearlyTooLarge = assessMeasurements({ chest: { value: "160", unit: "in" } }, { requireCore: false });
    expect(clearlyTooLarge.errors[0]).toMatchObject({ key: "chest", code: "too-large", suggestedUnit: "cm" });
  });

  it("requires the core set only when a profile is being confirmed", () => {
    expect(codes(assessMeasurements({}, { requireCore: true }).errors)).toEqual([
      "height:required", "chest:required", "naturalWaist:required", "seat:required",
    ]);
    expect(assessMeasurements({}, { requireCore: false }).errors).toEqual([]);
  });

  it("flags inconsistent pairs using canonical values across mixed units", () => {
    const inconsistent = assessMeasurements({ inseam: { value: "90", unit: "cm" }, outseam: { value: "85", unit: "cm" } }, { requireCore: false });
    expect(inconsistent.warnings).toEqual([expect.objectContaining({ key: null, code: "inconsistent", keys: ["inseam", "outseam"] })]);
    const mixed = assessMeasurements({ inseam: { value: "80", unit: "cm" }, outseam: { value: "40", unit: "in" } }, { requireCore: false });
    expect(mixed.warnings).toEqual([]);
  });
});

describe("request schemas", () => {
  it("accepts known measurement keys and units only", () => {
    expect(measurementInputSchema.safeParse({ chest: { value: "102", unit: "cm" } }).success).toBe(true);
    expect(measurementInputSchema.safeParse({ chest: { value: "102", unit: "mm" } }).success).toBe(false);
    expect(measurementInputSchema.safeParse({ jacketLength: { value: "75", unit: "cm" } }).success).toBe(false);
  });

  it("stores fit preferences as named customer choices, separate from measurements", () => {
    expect(fitPreferencesSchema.parse({ jacketFit: "balanced", trouserFit: "closer", notes: "  Left shoulder sits lower.  " })).toEqual({
      jacketFit: "balanced", trouserFit: "closer", notes: "Left shoulder sits lower.",
    });
    expect(fitPreferencesSchema.safeParse({ jacketFit: "drop-6" }).success).toBe(false);
    expect(fitPreferencesSchema.safeParse({ chest: "102" }).success).toBe(false);
  });
});
