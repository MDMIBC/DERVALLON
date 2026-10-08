import { BODY_MEASUREMENTS, formatLength, otherUnit, type MeasurementDefinition, type StoredMeasurement } from '@shared/fitMeasurements';

type StoredLike = Partial<Record<string, StoredMeasurement>>;

/** The customer's original value and unit, exactly as entered. */
export const enteredLabel = (measurement: Pick<StoredMeasurement, 'value' | 'unit'>) => `${measurement.value} ${measurement.unit}`;
/** Read-only rounded equivalent in the other unit; the stored original is never altered. */
export const equivalentLabel = (measurement: StoredMeasurement) => formatLength(measurement.valueUm, otherUnit(measurement.unit));
export const confirmedDate = (value: Date | string) => new Date(value).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });

export function storedEntries(measurements: StoredLike | null | undefined): { definition: MeasurementDefinition; measurement: StoredMeasurement }[] {
  return BODY_MEASUREMENTS.flatMap((definition) => {
    const measurement = measurements?.[definition.key];
    return measurement ? [{ definition, measurement }] : [];
  });
}
