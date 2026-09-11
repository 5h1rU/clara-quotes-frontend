import { describe, expect, it } from 'vitest';
import { estimatePremium } from './pricing';
describe('preview pricing', () => {
  it('matches the provided 327.60 example', () =>
    expect(
      estimatePremium('STANDARD', 70, {
        hasPreexistingConditions: true,
        conditions: ['DIABETES'],
        takesPrescriptionMedication: true,
        usesTobacco: true,
        needsSpouseCoverage: true,
      }),
    ).toBe(327.6));
  it('ignores health data at age 65 and medication for seniors', () => {
    expect(estimatePremium('BASIC', 65, { usesTobacco: true })).toBe(50);
    expect(estimatePremium('BASIC', 66, { takesPrescriptionMedication: true })).toBe(75);
  });
});
