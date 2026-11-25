export type CalculationMode = 'cancellation' | 'proration' | 'active_credit' | 'overtime';

export interface CancellationInput {
  clientName: string;
  paymentAmount: number;
  lastPaymentDate: string; // YYYY-MM-DD
  coverageStart: string; // YYYY-MM-DD
  billingCycleDays: 28 | 30;
  workingDaysInCycle: number; // default 20 or 22
  lastWorkingDay: string; // YYYY-MM-DD (e.g. 2026-07-17)
  coverageEndMethod: 'Override' | 'Calculated';
  actualCoverageEndOverride: string;
  noticeStart: string;
  noticePeriodDays: number;
  processingFee: number; // e.g. 43.66
  creditsOnFile: number;
  calculationMethod: 'Working Days' | 'Notice Business Days' | 'Unused Calendar Days';
}

export interface ProrationInput {
  clientName: string;
  currentPlanRate: number; // e.g. 1295
  newPlanRate: number; // e.g. 2295
  lastPaymentDate: string; // YYYY-MM-DD (e.g. 2026-07-11)
  coverageStart: string; // YYYY-MM-DD (e.g. 2026-07-09)
  billingCycleDays: 28 | 30;
  workingDaysInCycle: number; // default 20 or 22
  planChangeEffectiveDate: string; // YYYY-MM-DD (e.g. 2026-07-28)
  coverageEndMethod: 'Override' | 'Calculated';
  actualCoverageEndOverride: string;
  creditsOnFile: number;
}

export interface ActiveCreditInput {
  clientName: string;
  billingCycleDays: 28 | 30;
  workingDaysInCycle: number; // default 20 or 22
  planRatePaid: number; // e.g. 1495
  creditUnitType: 'Days' | 'Hours';
  quantityToCredit: number; // Number of Days or Hours
  shiftType: 'Full-Time' | 'Part-Time'; // Full-Time (8 hrs/day) or Part-Time (4 hrs/day)
  destination: 'Direct Refund (Cash)' | 'Invoice Credit Balance';
  processingFee: number; // default 0.00
}

export interface OvertimeInput {
  clientName: string;
  billingCycleDays: 28 | 30;
  workingDaysInCycle: number; // default 20 or 22
  basePlanRate: number; // e.g. 1495
  shiftType: 'Full-Time' | 'Part-Time'; // Full-Time (8 hrs/day) or Part-Time (4 hrs/day)
  regularOtRateType?: '150%' | '100%'; // '150%' (Standard 1.5x) or '100%' (Legacy 1.0x straight-time)
  regularOtHours: number;
  holidayOtHours: number; // 200% multiplier
  straightOtHours?: number; // legacy backwards compatibility
}

export interface Scenario {
  id: string;
  name: string;
  description?: string;
  category?: string;
  mode: CalculationMode;
  inputs: Partial<CancellationInput> & Partial<ProrationInput> & Partial<ActiveCreditInput> & Partial<OvertimeInput>;
  expectedRefund?: number;
  expectedPayment?: number;
}

