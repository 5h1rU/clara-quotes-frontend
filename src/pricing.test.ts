import { describe, expect, it, vi } from 'vitest';
import { estimatePremium } from './pricing';
describe('preview pricing', () => {
  it('formats repeated amounts with one shared currency formatter', async () => {
    vi.resetModules();
    const NumberFormatter = Intl.NumberFormat;
    const constructor = vi
      .spyOn(Intl, 'NumberFormat')
      .mockImplementation(function (locales, options) {
        return new NumberFormatter(locales, options);
      });
    try {
      const { money } = await import('./pricing');
      expect([50, 100, 327.6].map(money)).toEqual(['$50.00', '$100.00', '$327.60']);
      expect(constructor).toHaveBeenCalledTimes(1);
    } finally {
      constructor.mockRestore();
    }
  });
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
