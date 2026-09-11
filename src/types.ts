export type CoverageType = 'BASIC' | 'STANDARD' | 'PREMIUM';
export type Condition = 'DIABETES' | 'HEART_DISEASE' | 'HYPERTENSION' | 'CANCER_HISTORY' | 'OTHER';
export type QuoteStatus = 'DRAFT' | 'SUBMISSION_FAILED' | 'SUBMITTED' | 'EXPIRED';
export interface PersonalInfo {
  name: string;
  email: string;
  age: number;
  zipCode: string;
}
export interface HealthDetails {
  hasPreexistingConditions: boolean;
  conditions: Condition[];
  takesPrescriptionMedication: boolean;
  usesTobacco: boolean;
  needsSpouseCoverage: boolean;
}
export type CoverageRequest = { coverageType: CoverageType } & Partial<HealthDetails>;
export interface Quote extends PersonalInfo {
  id: string;
  status: QuoteStatus;
  coverageType: CoverageType | null;
  hasPreexistingConditions: boolean | null;
  conditions: Condition[];
  takesPrescriptionMedication: boolean | null;
  usesTobacco: boolean | null;
  needsSpouseCoverage: boolean | null;
  estimatedMonthlyPremium: number | null;
  createdAt: string;
  updatedAt: string;
  submittedAt: string | null;
}
export interface Credentials {
  username: string;
  password: string;
}
