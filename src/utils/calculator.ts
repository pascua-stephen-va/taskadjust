import { CancellationInput, ProrationInput, ActiveCreditInput, OvertimeInput } from '../types';
import { parseLocalDate, addDays, diffDays, networkDays, formatLocalDate } from './date';

export function calculateCancellation(input: CancellationInput, holidays: string[] = []) {
  const workingDaysInCycle = input.workingDaysInCycle > 0 ? input.workingDaysInCycle : (input.billingCycleDays === 28 ? 20 : 22);
  const dailyRate = input.paymentAmount > 0 
    ? Math.round((input.paymentAmount / workingDaysInCycle) * 100) / 100 
    : 0;
  
  let calculatedCoverageEnd = '';
  let effectiveCoverageEnd = '';
  let noticeEnd = '';
  let coverageSpanCalendarDays = 0;
  let workingDaysWorked = 0;
  let unusedWorkingDays = 0;
  let businessDaysInNotice = 0;
  let netDays = 0;
  
  if (input.coverageStart) {
    const coverageStart = parseLocalDate(input.coverageStart);
    const end = addDays(coverageStart, input.billingCycleDays - 1);
    calculatedCoverageEnd = formatLocalDate(end);
    
    // Effective end date (Last working day or override)
    effectiveCoverageEnd = input.lastWorkingDay 
      ? input.lastWorkingDay 
      : (input.coverageEndMethod === 'Override' && input.actualCoverageEndOverride 
          ? input.actualCoverageEndOverride 
          : calculatedCoverageEnd);

    if (effectiveCoverageEnd) {
      const effEndDt = parseLocalDate(effectiveCoverageEnd);
      coverageSpanCalendarDays = Math.max(0, diffDays(coverageStart, effEndDt) + 1);
      workingDaysWorked = Math.max(0, networkDays(coverageStart, effEndDt, holidays));
      unusedWorkingDays = Math.max(0, workingDaysInCycle - workingDaysWorked);
    }
  }
  
  if (input.noticeStart) {
    const noticeStart = parseLocalDate(input.noticeStart);
    const noticeEndDt = addDays(noticeStart, Math.max(0, input.noticePeriodDays - 1));
    noticeEnd = formatLocalDate(noticeEndDt);
    businessDaysInNotice = networkDays(noticeStart, noticeEndDt, holidays);
  }
  
  // Method calculations
  if (input.calculationMethod === 'Working Days') {
    netDays = -unusedWorkingDays;
  } else if (input.calculationMethod === 'Unused Calendar Days' && input.coverageStart && effectiveCoverageEnd) {
    const covStartDt = parseLocalDate(input.coverageStart);
    const effEndDt = parseLocalDate(effectiveCoverageEnd);
    netDays = (diffDays(covStartDt, effEndDt) + 1) - input.billingCycleDays;
  } else if (input.calculationMethod === 'Notice Business Days' && calculatedCoverageEnd && effectiveCoverageEnd && noticeEnd) {
    const effEndDt = parseLocalDate(effectiveCoverageEnd);
    const calcEndDt = parseLocalDate(calculatedCoverageEnd);
    const noticeEndDt = parseLocalDate(noticeEnd);
    if (input.coverageEndMethod === 'Override' || input.lastWorkingDay) {
      netDays = -(networkDays(addDays(effEndDt, 1), calcEndDt, holidays));
    } else {
      netDays = networkDays(addDays(calcEndDt, 1), noticeEndDt, holidays);
    }
  }

  // Exact Breakdown Values
  const planUsedAmount = Math.round(workingDaysWorked * dailyRate * 100) / 100;
  const grossRefund = Math.max(0, Math.round((input.paymentAmount - planUsedAmount) * 100) / 100);
  const processingFee = input.processingFee || 0;
  const creditsOnFile = input.creditsOnFile || 0;

  const netDaysValue = Math.round(netDays * dailyRate * 100) / 100;
  
  // Final Refund vs Payment Due
  let refundToClient = 0;
  let paymentDue = 0;

  if (input.calculationMethod === 'Working Days') {
    const netDiff = Math.round((grossRefund - processingFee - creditsOnFile) * 100) / 100;
    if (netDiff >= 0) {
      refundToClient = netDiff;
      paymentDue = 0;
    } else {
      refundToClient = 0;
      paymentDue = Math.abs(netDiff);
    }
  } else {
    const netCreditCharge = Math.round((netDaysValue - processingFee - creditsOnFile) * 100) / 100;
    refundToClient = netCreditCharge < 0 ? Math.abs(netCreditCharge) : 0;
    paymentDue = netCreditCharge > 0 ? netCreditCharge : 0;
  }

  const earnedRevenue = planUsedAmount;
  const netCreditCharge = refundToClient > 0 ? -refundToClient : paymentDue;

  return {
    workingDaysInCycle,
    dailyRate,
    calculatedCoverageEnd,
    effectiveCoverageEnd,
    noticeEnd,
    coverageSpanCalendarDays,
    workingDaysWorked,
    unusedWorkingDays,
    planUsedAmount,
    grossRefund,
    processingFee,
    businessDaysInNotice,
    netDays,
    netDaysValue,
    netCreditCharge,
    refundToClient,
    paymentDue,
    earnedRevenue
  };
}

export function calculateProration(input: ProrationInput) {
  const workingDaysInCycle = input.workingDaysInCycle > 0 ? input.workingDaysInCycle : (input.billingCycleDays === 28 ? 20 : 22);
  const currentDailyRate = input.currentPlanRate > 0 
    ? Math.round((input.currentPlanRate / workingDaysInCycle) * 100) / 100 
    : 0;
  const newDailyRate = input.newPlanRate > 0 
    ? Math.round((input.newPlanRate / workingDaysInCycle) * 100) / 100 
    : 0;
  
  let calculatedCoverageEnd = '';
  let effectiveCoverageEnd = '';
  let daysOnOldPlan = 0;
  let daysOnNewPlan = 0;
  let oldPlanUsageValue = 0;
  let remainingCredit = 0;
  let newCoverageStart = '';
  let newCoverageEnd = '';
  let recurringBillingDate = '';
  
  if (input.coverageStart) {
    const coverageStart = parseLocalDate(input.coverageStart);
    const end = addDays(coverageStart, input.billingCycleDays - 1);
    calculatedCoverageEnd = formatLocalDate(end);
    
    effectiveCoverageEnd = input.coverageEndMethod === 'Override' && input.actualCoverageEndOverride
      ? input.actualCoverageEndOverride
      : calculatedCoverageEnd;
  }
  
  if (input.coverageStart && input.planChangeEffectiveDate) {
    const covStart = parseLocalDate(input.coverageStart);
    const planChange = parseLocalDate(input.planChangeEffectiveDate);
    const dayBeforeChange = addDays(planChange, -1);
    
    // Working days on old plan (e.g. July 9 to July 27 = 13 working days)
    daysOnOldPlan = Math.max(0, networkDays(covStart, dayBeforeChange));
    oldPlanUsageValue = Math.round(daysOnOldPlan * currentDailyRate * 100) / 100;
    remainingCredit = Math.max(0, Math.round(((input.currentPlanRate || 0) - oldPlanUsageValue) * 100) / 100);

    // New Plan Forward Period (e.g. July 28 to August 25)
    newCoverageStart = input.planChangeEffectiveDate;
    const newCovEndDt = addDays(planChange, input.billingCycleDays - 1);
    newCoverageEnd = formatLocalDate(newCovEndDt);
    // Recurring billing begins 2 days before coverage ends
    const recurDate = addDays(newCovEndDt, -2);
    recurringBillingDate = formatLocalDate(recurDate);

    // Also compute remaining days in previous cycle if based on cycle
    if (effectiveCoverageEnd) {
      const effEnd = parseLocalDate(effectiveCoverageEnd);
      daysOnNewPlan = Math.max(0, networkDays(planChange, effEnd));
    }
  }

  const creditsOnFile = input.creditsOnFile || 0;
  // Net Due: New Plan - Remaining Part-Time Credit - Credits on File
  const netDue = Math.round(((input.newPlanRate || 0) - remainingCredit - creditsOnFile) * 100) / 100;
  const oneTimeInvoiceAmount = Math.max(0, netDue);
  const refundToClient = netDue < 0 ? Math.abs(netDue) : 0;
  const paymentDue = oneTimeInvoiceAmount;
  
  const proratedBilledTotal = oldPlanUsageValue + (input.newPlanRate || 0);
  const netAdjustment = oneTimeInvoiceAmount;
  
  return {
    workingDaysInCycle,
    currentDailyRate,
    newDailyRate,
    calculatedCoverageEnd,
    effectiveCoverageEnd,
    daysOnOldPlan,
    daysOnNewPlan,
    oldPlanUsageValue,
    remainingCredit,
    oneTimeInvoiceAmount,
    newCoverageStart,
    newCoverageEnd,
    recurringBillingDate,
    proratedBilledTotal,
    netAdjustment,
    refundToClient,
    paymentDue
  };
}

export function calculateActiveCredit(input: ActiveCreditInput) {
  const workingDaysInCycle = input.workingDaysInCycle > 0 
    ? input.workingDaysInCycle 
    : (input.billingCycleDays === 28 ? 20 : 22);
  const dailyRate = input.planRatePaid > 0 
    ? Math.round((input.planRatePaid / workingDaysInCycle) * 100) / 100 
    : 0;
  const shiftHours = input.shiftType === 'Part-Time' ? 4 : 8;
  const baseHourlyRate = dailyRate > 0 
    ? Math.round((dailyRate / shiftHours) * 100) / 100 
    : 0;
  const effectiveUnitRate = input.creditUnitType === 'Days' ? dailyRate : baseHourlyRate;
  const quantity = Math.max(0, input.quantityToCredit || 0);
  const grossCredit = Math.round(quantity * effectiveUnitRate * 100) / 100;
  const processingFee = input.processingFee || 0;
  const netCreditRefund = Math.max(0, Math.round((grossCredit - processingFee) * 100) / 100);

  return {
    workingDaysInCycle,
    dailyRate,
    shiftHours,
    baseHourlyRate,
    effectiveUnitRate,
    quantity,
    grossCredit,
    processingFee,
    netCreditRefund,
    destination: input.destination || 'Invoice Credit Balance'
  };
}

export function calculateOvertime(input: OvertimeInput) {
  const workingDaysInCycle = input.workingDaysInCycle > 0 
    ? input.workingDaysInCycle 
    : (input.billingCycleDays === 28 ? 20 : 22);
  const dailyRate = input.basePlanRate > 0 
    ? Math.round((input.basePlanRate / workingDaysInCycle) * 100) / 100 
    : 0;
  const shiftHours = input.shiftType === 'Part-Time' ? 4 : 8;
  const baseHourlyRate = dailyRate > 0 
    ? Math.round((dailyRate / shiftHours) * 100) / 100 
    : 0;
  
  // Regular Overtime Rate Selection (150% standard or 100% legacy straight-time)
  const regularOtRateType = input.regularOtRateType || (input.straightOtHours && !input.regularOtHours ? '100%' : '150%');
  const regularOtMultiplier = regularOtRateType === '100%' ? 1.0 : 1.5;
  const regularOtRate = Math.round(baseHourlyRate * regularOtMultiplier * 100) / 100;
  const regularOtHours = Math.max(0, (input.regularOtHours !== undefined && input.regularOtHours !== null) ? input.regularOtHours : (input.straightOtHours || 0));
  const regularOtAmount = Math.round(regularOtHours * regularOtRate * 100) / 100;

  // Holiday Overtime (200% / 2.0x multiplier)
  const holidayOtRate = Math.round(baseHourlyRate * 2.0 * 100) / 100;
  const holidayOtHours = Math.max(0, input.holidayOtHours || 0);
  const holidayOtAmount = Math.round(holidayOtHours * holidayOtRate * 100) / 100;

  const totalOtAmountDue = Math.round((regularOtAmount + holidayOtAmount) * 100) / 100;

  return {
    workingDaysInCycle,
    dailyRate,
    shiftHours,
    baseHourlyRate,
    regularOtRateType,
    regularOtMultiplier,
    regularOtRate,
    regularOtHours,
    regularOtAmount,
    holidayOtRate,
    holidayOtHours,
    holidayOtAmount,
    totalOtAmountDue,
    // Backwards compatibility fallbacks
    straightOtRate: Math.round(baseHourlyRate * 1.0 * 100) / 100,
    straightOtHours: regularOtRateType === '100%' ? regularOtHours : 0,
    straightOtAmount: regularOtRateType === '100%' ? regularOtAmount : 0
  };
}


