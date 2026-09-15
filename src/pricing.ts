import { isSenior } from './applicantRules';
import type { CoverageType, HealthDetails } from './types';
export const coverageOptions: { value: CoverageType; label: string; base: number }[] = [
  { value: 'BASIC', label: 'Basic', base: 50 },
  { value: 'STANDARD', label: 'Standard', base: 100 },
  { value: 'PREMIUM', label: 'Premium', base: 200 },
];
export const conditionOptions = [
  { value: 'DIABETES', label: 'Diabetes' },
  { value: 'HEART_DISEASE', label: 'Heart disease' },
  { value: 'HYPERTENSION', label: 'Hypertension' },
  { value: 'CANCER_HISTORY', label: 'Cancer history' },
  { value: 'OTHER', label: 'Other' },
] as const;
const moneyFormatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
export const money = (amount: number) => moneyFormatter.format(amount);
export function estimatePremium(
  coverage: CoverageType,
  age: number,
  health: Partial<HealthDetails>,
): number {
  const cents = (coverageOptions.find((option) => option.value === coverage)?.base ?? 0) * 100;
  const senior = isSenior(age);
  const factors = [
    senior ? 15 : 10,
    senior && health.hasPreexistingConditions && health.conditions?.length ? 13 : 10,
    senior && health.usesTobacco ? 12 : 10,
    senior && health.needsSpouseCoverage ? 14 : 10,
  ];
  return Math.round(factors.reduce((total, factor) => total * factor, cents) / 10000) / 100;
}
