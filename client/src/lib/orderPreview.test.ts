import { describe, expect, it } from 'vitest';
import {
  fabricStudies,
  defaultOrderPreview,
  measurementFields,
  canAdvanceOrderPreview,
  validateMeasurements,
} from './orderPreview';

describe('custom-order preview state', () => {
  it('presents multiple clearly illustrative fabric choices, not purchasable inventory', () => {
    expect(fabricStudies).toHaveLength(4);
    expect(fabricStudies.map((fabric) => fabric.id)).toEqual([
      'midnight', 'graphite', 'stone', 'pinstripe',
    ]);
    expect(fabricStudies.every((fabric) => fabric.note.length > 0 && fabric.availability === 'Reference')).toBe(true);
  });

  it('requires a fabric and two style choices before progressing to measurement input', () => {
    expect(canAdvanceOrderPreview('fabric', defaultOrderPreview)).toBe(false);
    const fabric = { ...defaultOrderPreview, fabricId: 'midnight' };
    expect(canAdvanceOrderPreview('fabric', fabric)).toBe(true);
    expect(canAdvanceOrderPreview('style', fabric)).toBe(false);
    expect(canAdvanceOrderPreview('style', { ...fabric, silhouette: 'tailored', lapel: 'notch' })).toBe(true);
  });

  it('allows all measurements to be skipped and never requires contact details', () => {
    expect(measurementFields).toHaveLength(6);
    expect(validateMeasurements(defaultOrderPreview.measurements)).toEqual({});
    expect(canAdvanceOrderPreview('measurements', defaultOrderPreview)).toBe(true);
    expect(Object.keys(defaultOrderPreview)).toEqual(['fabricId', 'silhouette', 'lapel', 'measurements']);
  });

  it('rejects invalid nonempty measurements and accepts reasonable centimetre values', () => {
    const values = {
      ...defaultOrderPreview.measurements,
      chest: '102.5', waist: '0', shoulder: '999', sleeve: 'not a number',
    };
    const errors = validateMeasurements(values);
    expect(errors.chest).toBeUndefined();
    expect(errors.waist).toMatch(/greater than zero/i);
    expect(errors.shoulder).toMatch(/300 cm/i);
    expect(errors.sleeve).toMatch(/number/i);
    expect(canAdvanceOrderPreview('measurements', { ...defaultOrderPreview, measurements: values })).toBe(false);
  });
});
