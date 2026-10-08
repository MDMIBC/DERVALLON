import { stellaFabrics } from '@/content/stellaFabrics';

export type MeasurementKey = 'chest' | 'waist' | 'seat' | 'shoulder' | 'sleeve' | 'inseam';
export type OrderStep = 'fabric' | 'style' | 'measurements' | 'review';
export type Measurements = Record<MeasurementKey, string>;
export type OrderPreview = {
  fabricId: string;
  silhouette: string;
  lapel: string;
  measurements: Measurements;
};
export type FabricAvailability = 'Reference' | 'Available' | 'Limited availability' | 'Special order' | 'Temporarily unavailable' | 'Discontinued';
export type FabricStudy = {
  id: string;
  reference: string;
  name: string;
  note: string;
  colour: string;
  pattern: string;
  composition: string;
  weight: string;
  season: string;
  formality: string;
  garments: string[];
  availability: FabricAvailability;
  availabilityNote: string;
  priceBand: string;
  tone: string;
  caption: string;
};

export const orderSteps: { id: OrderStep; label: string; subtitle: string }[] = [
  { id: 'fabric', label: 'Fabric', subtitle: 'Set the tone' },
  { id: 'style', label: 'Style', subtitle: 'Define the line' },
  { id: 'measurements', label: 'Measurements', subtitle: 'Add your notes' },
  { id: 'review', label: 'Review', subtitle: 'See it together' },
];

// These are visual fabric directions; final composition, availability, and pricing are confirmed separately.
export const fabricStudies: FabricStudy[] = [
  { id: 'midnight', reference: 'DERVALLON / FABRIC-01', name: 'Midnight navy', note: 'Plain weave · deep navy', colour: 'Navy', pattern: 'Plain', composition: 'Composition to be confirmed', weight: 'Midweight', season: 'All season', formality: 'Formal', garments: ['Two-piece suit', 'Three-piece suit', 'Jacket', 'Trousers'], availability: 'Reference', availabilityNote: 'Collection details will be shared once confirmed.', priceBand: 'To be confirmed', tone: 'midnight', caption: 'A composed, all-purpose foundation.' },
  { id: 'graphite', reference: 'DERVALLON / FABRIC-02', name: 'Graphite', note: 'Twill · charcoal', colour: 'Charcoal', pattern: 'Twill', composition: 'Composition to be confirmed', weight: 'Midweight', season: 'All season', formality: 'Formal', garments: ['Two-piece suit', 'Jacket', 'Trousers'], availability: 'Reference', availabilityNote: 'Collection details will be shared once confirmed.', priceBand: 'To be confirmed', tone: 'graphite', caption: 'Quiet depth with a soft diagonal line.' },
  { id: 'stone', reference: 'DERVALLON / FABRIC-03', name: 'Warm stone', note: 'Textured · pale neutral', colour: 'Stone', pattern: 'Textured', composition: 'Composition to be confirmed', weight: 'Lightweight', season: 'Spring / summer', formality: 'Relaxed formal', garments: ['Jacket', 'Trousers'], availability: 'Reference', availabilityNote: 'Collection details will be shared once confirmed.', priceBand: 'To be confirmed', tone: 'stone', caption: 'A lighter note with subtle dimension.' },
  { id: 'pinstripe', reference: 'DERVALLON / FABRIC-04', name: 'Ink pinstripe', note: 'Stripe · navy', colour: 'Navy', pattern: 'Pinstripe', composition: 'Composition to be confirmed', weight: 'Midweight', season: 'Autumn / winter', formality: 'Formal', garments: ['Two-piece suit', 'Three-piece suit'], availability: 'Reference', availabilityNote: 'Collection details will be shared once confirmed.', priceBand: 'To be confirmed', tone: 'pinstripe', caption: 'An understated, directional rhythm.' },
];
export function isFabricSelectable(fabric: FabricStudy) {
  return fabric.availability !== 'Temporarily unavailable' && fabric.availability !== 'Discontinued';
}

export const silhouettes = [
  { id: 'tailored', label: 'Tailored', note: 'A closer, more defined line' },
  { id: 'balanced', label: 'Balanced', note: 'A measured everyday shape' },
  { id: 'relaxed', label: 'Relaxed', note: 'More room to move' },
] as const;
export const lapels = [
  { id: 'notch', label: 'Notch lapel', note: 'Quiet and versatile' },
  { id: 'peak', label: 'Peak lapel', note: 'A sharper point of emphasis' },
] as const;

export const measurementFields: { key: MeasurementKey; label: string; help: string; guide: string; guideLine: [number, number, number, number] }[] = [
  { key: 'chest', label: 'Chest', help: 'Around the fullest part of your chest.', guide: 'Stand naturally. Wrap the tape around the fullest part of your chest, under your arms. Keep it level and comfortably snug; do not pull tight.', guideLine: [34, 64, 76, 64] },
  { key: 'waist', label: 'Waist', help: 'Around your natural waistline.', guide: 'Find the narrowest part of your natural waist above your hips. Keep the tape horizontal and breathe normally without tightening your stomach.', guideLine: [38, 88, 72, 88] },
  { key: 'seat', label: 'Seat', help: 'Around the fullest part of your hips.', guide: 'With your feet together, wrap the tape around the fullest part of your seat and hips. Keep the tape parallel to the floor.', guideLine: [35, 105, 75, 105] },
  { key: 'shoulder', label: 'Shoulder', help: 'Across the back, shoulder point to point.', guide: 'Ask someone to measure across your back from one shoulder bone to the other, following the natural curve just below the base of your neck.', guideLine: [32, 47, 78, 47] },
  { key: 'sleeve', label: 'Sleeve', help: 'From shoulder point to wrist.', guide: 'Relax your arm with a slight bend. Measure from the shoulder point down the outside of your arm to your wrist bone.', guideLine: [78, 47, 87, 107] },
  { key: 'inseam', label: 'Inseam', help: 'From crotch seam to ankle.', guide: 'Wear shoes or stand barefoot consistently. Measure from the crotch seam down the inside of your leg to your chosen trouser hem or ankle; note the desired finish for a tailor.', guideLine: [54, 117, 54, 180] },
];

export const defaultOrderPreview: OrderPreview = {
  fabricId: '', silhouette: '', lapel: '',
  measurements: { chest: '', waist: '', seat: '', shoulder: '', sleeve: '', inseam: '' },
};

export function validateMeasurements(values: Measurements): Partial<Record<MeasurementKey, string>> {
  const errors: Partial<Record<MeasurementKey, string>> = {};
  for (const { key } of measurementFields) {
    const value = values[key].trim();
    if (!value) continue;
    if (!/^\d+(?:\.\d{1,2})?$/.test(value)) errors[key] = 'Enter a number in centimetres.';
    else if (Number(value) <= 0) errors[key] = 'Enter a value greater than zero.';
    else if (Number(value) > 300) errors[key] = 'Enter no more than 300 cm.';
  }
  return errors;
}

export function canAdvanceOrderPreview(step: OrderStep, state: OrderPreview): boolean {
  if (step === 'fabric') return fabricStudies.some(({ id }) => id === state.fabricId) || stellaFabrics.some(({ id }) => id === state.fabricId);
  if (step === 'style') return silhouettes.some(({ id }) => id === state.silhouette) && lapels.some(({ id }) => id === state.lapel);
  if (step === 'measurements') return Object.keys(validateMeasurements(state.measurements)).length === 0;
  return true;
}
