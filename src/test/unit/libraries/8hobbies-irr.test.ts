import { describe, it, expect } from 'vitest';
import { computeIrr } from '@8hobbies/irr';

describe('@8hobbies/irr library evaluation', () => {
  it('should calculate IRR for energy storage cash flows', () => {
    const cashFlows = [-1000000, 150000, 150000, 150000, 150000, 150000, 150000, 150000, 150000, 150000, 150000];

    const results = computeIrr(cashFlows);

    // @8hobbies/irr returns an array of IRRs (may be multiple valid IRRs)
    expect(results.length).toBeGreaterThan(0);

    const result = results[0]; // Take first IRR
    expect(result).toBeGreaterThan(0);
    expect(result).toBeLessThan(1); // Decimal form

    console.log(`IRR: ${(result * 100).toFixed(2)}% (found ${results.length} IRR(s))`);
  });

  it('should handle edge cases: all negative cash flows', () => {
    const cashFlows = [-100000, -10000, -10000];

    // Should return empty array for invalid IRR
    const results = computeIrr(cashFlows);
    expect(results.length).toBe(0);
    console.log(`IRR for all negative: no valid IRR`);
  });

  it('should handle edge cases: zero initial investment', () => {
    const cashFlows = [0, 50000, 50000];

    const results = computeIrr(cashFlows);

    // May return empty or handle infinite return
    console.log(`IRR for zero investment: ${results.length} valid IRR(s)`);
  });

  it('should match irr-npv result', () => {
    const cashFlows = [-1000000, 150000, 150000, 150000, 150000, 150000, 150000, 150000, 150000, 150000, 150000];

    const results = computeIrr(cashFlows);

    // Should give approximately 8.14% IRR (same as irr-npv)
    const irrPercent = results[0] * 100;
    expect(irrPercent).toBeCloseTo(8.14, 1);

    console.log(`IRR: ${irrPercent.toFixed(2)}%`);
  });
});
