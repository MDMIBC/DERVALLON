import { describe, expect, it } from 'vitest';
import { computeCropPlan } from './referenceEditor';

describe('browser-local reference photo crop planning', () => {
  it('rotates the working dimensions and centers a square crop without stretching', () => {
    const plan = computeCropPlan(200, 100, 90, 'square', 1, 50, 50);
    expect(plan.rotatedWidth).toBe(100);
    expect(plan.rotatedHeight).toBe(200);
    expect(plan.source).toEqual({ x: 0, y: 50, width: 100, height: 100 });
    expect(plan.output).toEqual({ width: 100, height: 100 });
  });

  it('supports portrait crop, zoom, and controllable focal position inside the image', () => {
    const plan = computeCropPlan(200, 100, 0, 'portrait', 2, 100, 0);
    expect(plan.source.width / plan.source.height).toBeCloseTo(4 / 5);
    expect(plan.source.x).toBeCloseTo(160);
    expect(plan.source.y).toBe(0);
    expect(plan.output.width / plan.output.height).toBeCloseTo(4 / 5, 1);
  });

  it('caps export dimensions and clamps out-of-range controls to the available image', () => {
    const plan = computeCropPlan(4000, 3000, 270, 'original', 99, -20, 150, 1600);
    expect(plan.output.width).toBeLessThanOrEqual(1600);
    expect(plan.output.height).toBeLessThanOrEqual(1600);
    expect(plan.source.x).toBeGreaterThanOrEqual(0);
    expect(plan.source.y).toBeGreaterThanOrEqual(0);
    expect(plan.source.x + plan.source.width).toBeLessThanOrEqual(plan.rotatedWidth);
    expect(plan.source.y + plan.source.height).toBeLessThanOrEqual(plan.rotatedHeight);
  });
});
