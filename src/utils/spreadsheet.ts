import * as XLSX from 'xlsx';
import { CalculationMode, CancellationInput, ProrationInput, ActiveCreditInput, OvertimeInput, Scenario } from '../types';
import { calculateCancellation, calculateProration, calculateActiveCredit, calculateOvertime } from './calculator';
import { formatFriendlyDate, normalizeDateString } from './date';

export interface ScenarioRowData {
  'Scenario ID': string;
  'Scenario Name': string;
  'Category': string;
  'Description': string;
  'Mode': string;
  'Client Name': string;
  'Plan / Retainer Rate ($)': number | string;
  'New Plan Rate ($)': number | string;
  'Shift Type': string;
  'Credit Unit Type': string;
  'Quantity (Days/Hours)': number | string;
  'Regular OT Rate Selection': string;
  'Regular OT Hours': number | string;
  'Holiday OT Hours (2.0x)': number | string;
  'Settlement Destination': string;
  'Last Payment Date': string;
  'Coverage Start Date': string;
  'Billing Cycle Days': number;
  'Working Days in Cycle': number;
  'Last Working Day / Effective Date': string;
  'Coverage End Method': string;
  'Override End Date': string;
  'Notice Start Date': string;
  'Notice Period (Days)': number | string;
  'Processing Fee ($)': number;
  'Credits on File ($)': number;
  'Calculation Method': string;
  'Expected Refund ($)': number;
  'Expected Invoice/Payment ($)': number;
}

export function scenariosToRows(scenarios: Scenario[]): ScenarioRowData[] {
  return scenarios.map(s => {
    const isCancel = s.mode === 'cancellation';
    const isProration = s.mode === 'proration';
    const isActiveCredit = s.mode === 'active_credit';
    const isOvertime = s.mode === 'overtime';

    let category = s.category;
    if (!category) {
      if (isCancel) category = 'Cancellation Tie-Up';
      else if (isProration) category = 'Upgrade Proration';
      else if (isActiveCredit) category = 'Active Account Credit';
      else category = 'Overtime Calculation';
    }

    let planRate: number = 0;
    if (isCancel) planRate = s.inputs.paymentAmount || 0;
    else if (isProration) planRate = s.inputs.currentPlanRate || 0;
    else if (isActiveCredit) planRate = s.inputs.planRatePaid || 0;
    else if (isOvertime) planRate = s.inputs.basePlanRate || 0;

    const otRateType = s.inputs.regularOtRateType || (s.inputs.straightOtHours && s.inputs.straightOtHours > 0 ? '100%' : '150%');
    const otHours = s.inputs.regularOtHours || s.inputs.straightOtHours || 0;

    return {
      'Scenario ID': s.id,
      'Scenario Name': s.name,
      'Category': category,
      'Description': s.description || '',
      'Mode': s.mode,
      'Client Name': s.inputs.clientName || '',
      'Plan / Retainer Rate ($)': planRate,
      'New Plan Rate ($)': isProration ? (s.inputs.newPlanRate || 0) : '',
      'Shift Type': s.inputs.shiftType || (isActiveCredit || isOvertime ? 'Full-Time' : ''),
      'Credit Unit Type': isActiveCredit ? (s.inputs.creditUnitType || 'Days') : '',
      'Quantity (Days/Hours)': isActiveCredit ? (s.inputs.quantityToCredit || 0) : '',
      'Regular OT Rate Selection': isOvertime ? (otRateType === '100%' ? '100% (1.0x Legacy)' : '150% (1.5x Standard)') : '',
      'Regular OT Hours': isOvertime ? otHours : '',
      'Holiday OT Hours (2.0x)': isOvertime ? (s.inputs.holidayOtHours || 0) : '',
      'Settlement Destination': isActiveCredit ? (s.inputs.destination || 'Invoice Credit Balance') : '',
      'Last Payment Date': s.inputs.lastPaymentDate || '',
      'Coverage Start Date': s.inputs.coverageStart || '',
      'Billing Cycle Days': s.inputs.billingCycleDays || 28,
      'Working Days in Cycle': s.inputs.workingDaysInCycle || 20,
      'Last Working Day / Effective Date': isCancel ? (s.inputs.lastWorkingDay || '') : (s.inputs.planChangeEffectiveDate || ''),
      'Coverage End Method': s.inputs.coverageEndMethod || 'Calculated',
      'Override End Date': s.inputs.actualCoverageEndOverride || '',
      'Notice Start Date': s.inputs.noticeStart || '',
      'Notice Period (Days)': s.inputs.noticePeriodDays || 30,
      'Processing Fee ($)': s.inputs.processingFee || 0,
      'Credits on File ($)': s.inputs.creditsOnFile || 0,
      'Calculation Method': s.inputs.calculationMethod || 'Working Days',
      'Expected Refund ($)': s.expectedRefund || 0,
      'Expected Invoice/Payment ($)': s.expectedPayment || 0
    };
  });
}

/**
 * Export scenarios to XLSX formatted workbook
 */
export function exportScenariosToXLSX(scenarios: Scenario[], filename = 'TaskAdjust_Settlement_Scenarios.xlsx') {
  const rows = scenariosToRows(scenarios);
  const prorationRows = rows.filter(r => r.Mode === 'proration');
  const cancellationRows = rows.filter(r => r.Mode === 'cancellation');
  const activeCreditRows = rows.filter(r => r.Mode === 'active_credit');
  const overtimeRows = rows.filter(r => r.Mode === 'overtime');

  const wb = XLSX.utils.book_new();

  // All Scenarios Sheet
  const wsAll = XLSX.utils.json_to_sheet(rows);
  wsAll['!cols'] = [
    { wch: 12 }, // ID
    { wch: 36 }, // Name
    { wch: 22 }, // Category
    { wch: 45 }, // Description
    { wch: 14 }, // Mode
    { wch: 24 }, // Client
    { wch: 18 }, // Plan/Retainer
    { wch: 16 }, // New Plan
    { wch: 14 }, // Shift Type
    { wch: 16 }, // Credit Unit
    { wch: 18 }, // Quantity
    { wch: 20 }, // Regular OT
    { wch: 20 }, // Holiday OT
    { wch: 22 }, // Destination
    { wch: 16 }, // Last Payment
    { wch: 16 }, // Coverage Start
    { wch: 14 }, // Billing Cycle
    { wch: 14 }, // Working Days
    { wch: 18 }, // Effective/Last Day
    { wch: 16 }, // End Method
    { wch: 16 }, // Override End
    { wch: 16 }, // Notice Start
    { wch: 14 }, // Notice Days
    { wch: 14 }, // Fee
    { wch: 14 }, // Credits
    { wch: 18 }, // Calc Method
    { wch: 16 }, // Expected Refund
    { wch: 18 }  // Expected Invoice
  ];
  XLSX.utils.book_append_sheet(wb, wsAll, 'All Scenarios');

  // Prorations Sheet
  if (prorationRows.length > 0) {
    const wsPro = XLSX.utils.json_to_sheet(prorationRows);
    wsPro['!cols'] = wsAll['!cols'];
    XLSX.utils.book_append_sheet(wb, wsPro, 'Plan Prorations');
  }

  // Cancellations Sheet
  if (cancellationRows.length > 0) {
    const wsCan = XLSX.utils.json_to_sheet(cancellationRows);
    wsCan['!cols'] = wsAll['!cols'];
    XLSX.utils.book_append_sheet(wb, wsCan, 'Cancellations');
  }

  // Active Credits Sheet
  if (activeCreditRows.length > 0) {
    const wsAct = XLSX.utils.json_to_sheet(activeCreditRows);
    wsAct['!cols'] = wsAll['!cols'];
    XLSX.utils.book_append_sheet(wb, wsAct, 'Active Credits');
  }

  // Overtime Sheet
  if (overtimeRows.length > 0) {
    const wsOt = XLSX.utils.json_to_sheet(overtimeRows);
    wsOt['!cols'] = wsAll['!cols'];
    XLSX.utils.book_append_sheet(wb, wsOt, 'Overtime Runs');
  }

  XLSX.writeFile(wb, filename);
}

/**
 * Export scenarios to CSV
 */
export function exportScenariosToCSV(scenarios: Scenario[], filename = 'TaskAdjust_Settlement_Scenarios.csv') {
  const rows = scenariosToRows(scenarios);
  const ws = XLSX.utils.json_to_sheet(rows);
  const csv = XLSX.utils.sheet_to_csv(ws);
  
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Parse an uploaded file (.xlsx, .xls, or .csv) and convert to Scenario array
 */
export async function importScenariosFromFile(file: File): Promise<Scenario[]> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });
  
  // Pick the first sheet or the sheet named 'All Scenarios'
  const sheetName = workbook.SheetNames.includes('All Scenarios') 
    ? 'All Scenarios' 
    : workbook.SheetNames[0];
    
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) return [];

  const rawRows = XLSX.utils.sheet_to_json<any>(sheet);
  const scenarios: Scenario[] = [];

  rawRows.forEach((row, index) => {
    // Check mode
    const rawMode = String(row['Mode'] || row['mode'] || '').toLowerCase();
    let mode: CalculationMode = 'proration';
    if (rawMode.includes('cancel')) {
      mode = 'cancellation';
    } else if (rawMode.includes('credit') || rawMode.includes('active')) {
      mode = 'active_credit';
    } else if (rawMode.includes('overtime') || rawMode.includes('ot')) {
      mode = 'overtime';
    } else {
      mode = 'proration';
    }

    const isCancel = mode === 'cancellation';
    const isProration = mode === 'proration';
    const isActiveCredit = mode === 'active_credit';
    const isOvertime = mode === 'overtime';

    const id = String(row['Scenario ID'] || row['id'] || `IMP-${Date.now()}-${index + 1}`);
    const name = String(row['Scenario Name'] || row['name'] || `Scenario ${index + 1}`);
    const defaultCat = isCancel ? 'Cancellation Tie-Up' : isProration ? 'Upgrade Proration' : isActiveCredit ? 'Active Account Credit' : 'Overtime Calculation';
    const category = String(row['Category'] || row['category'] || defaultCat);
    const description = String(row['Description'] || row['description'] || '');
    const clientName = String(row['Client Name'] || row['clientName'] || 'Imported Client');

    const rawPlanRate = Number(
      row['Plan / Retainer Rate ($)'] ||
      row['Current/Payment Amount ($)'] || 
      row['paymentAmount'] || 
      row['currentPlanRate'] || 
      row['planRatePaid'] ||
      row['basePlanRate'] ||
      0
    );
    const newPlanRate = Number(row['New Plan Rate ($)'] || row['newPlanRate'] || 0);
    const shiftType = (String(row['Shift Type'] || row['shiftType'] || '').toLowerCase().includes('part') ? 'Part-Time' : 'Full-Time') as 'Full-Time' | 'Part-Time';
    const creditUnitType = (String(row['Credit Unit Type'] || row['creditUnitType'] || '').toLowerCase().includes('hour') ? 'Hours' : 'Days') as 'Days' | 'Hours';
    const quantityToCredit = Number(row['Quantity (Days/Hours)'] || row['quantityToCredit'] || 0);
    const rawRateType = String(row['Regular OT Rate Selection'] || row['regularOtRateType'] || row['Regular OT Rate'] || '');
    const straightOtHours = Number(row['100% OT Hours (1.0x)'] || row['straightOtHours'] || row['100% OT Hours'] || 0);
    const regularOtRateType: '150%' | '100%' = (rawRateType.includes('100') || straightOtHours > 0) ? '100%' : '150%';
    const regularOtHours = Number(row['Regular OT Hours'] || row['Regular OT Hours (1.5x)'] || row['regularOtHours'] || (straightOtHours > 0 ? straightOtHours : 0));
    const holidayOtHours = Number(row['Holiday OT Hours (2.0x)'] || row['holidayOtHours'] || 0);
    const destination = (String(row['Settlement Destination'] || row['destination'] || '').toLowerCase().includes('cash') || String(row['Settlement Destination'] || row['destination'] || '').toLowerCase().includes('refund')) 
      ? 'Direct Refund (Cash)' 
      : 'Invoice Credit Balance';

    const lastPaymentDate = normalizeDateString(row['Last Payment Date'] || row['lastPaymentDate']);
    const coverageStart = normalizeDateString(row['Coverage Start Date'] || row['coverageStart']);
    const billingCycleDays = (Number(row['Billing Cycle Days'] || row['billingCycleDays']) === 30 ? 30 : 28) as 28 | 30;
    const workingDaysInCycle = Number(row['Working Days in Cycle'] || row['workingDaysInCycle']) || (billingCycleDays === 28 ? 20 : 22);

    const rawEndMethod = String(row['Coverage End Method'] || row['coverageEndMethod'] || '');
    const coverageEndMethod = rawEndMethod.toLowerCase().includes('override') ? 'Override' : 'Calculated';
    const actualCoverageEndOverride = normalizeDateString(row['Override End Date'] || row['actualCoverageEndOverride']);

    const rawEffective = row['Last Working Day / Effective Date'] || row['lastWorkingDay'] || row['planChangeEffectiveDate'];
    const lastWorkingDay = isCancel ? normalizeDateString(rawEffective) : '';
    const planChangeEffectiveDate = isProration ? normalizeDateString(rawEffective) : '';

    const noticeStart = normalizeDateString(row['Notice Start Date'] || row['noticeStart']);
    const noticePeriodDays = Number(row['Notice Period (Days)'] || row['noticePeriodDays']) || 30;
    const processingFee = Number(row['Processing Fee ($)'] || row['processingFee']) || 0;
    const creditsOnFile = Number(row['Credits on File ($)'] || row['creditsOnFile']) || 0;
    const calculationMethod = (String(row['Calculation Method'] || row['calculationMethod'] || 'Working Days')) as any;

    const expectedRefund = Number(row['Expected Refund ($)'] || row['expectedRefund']) || 0;
    const expectedPayment = Number(row['Expected Invoice/Payment ($)'] || row['expectedPayment']) || 0;

    scenarios.push({
      id,
      name,
      category,
      description,
      mode,
      inputs: {
        clientName,
        paymentAmount: rawPlanRate,
        currentPlanRate: rawPlanRate,
        planRatePaid: rawPlanRate,
        basePlanRate: rawPlanRate,
        newPlanRate,
        shiftType,
        creditUnitType,
        quantityToCredit,
        regularOtRateType,
        straightOtHours,
        regularOtHours,
        holidayOtHours,
        destination,
        lastPaymentDate,
        coverageStart,
        billingCycleDays,
        workingDaysInCycle,
        lastWorkingDay,
        planChangeEffectiveDate,
        coverageEndMethod,
        actualCoverageEndOverride,
        noticeStart,
        noticePeriodDays,
        processingFee,
        creditsOnFile,
        calculationMethod
      },
      expectedRefund,
      expectedPayment
    });
  });

  return scenarios;
}

/**
 * Export current calculator tie-up audit and breakdown directly to an XLSX settlement report
 */
export function exportCurrentCalculationToXLSX(
  mode: CalculationMode,
  cancellation: CancellationInput,
  proration: ProrationInput,
  activeCredit?: ActiveCreditInput,
  overtime?: OvertimeInput
) {
  const wb = XLSX.utils.book_new();

  if (mode === 'cancellation') {
    const res = calculateCancellation(cancellation);
    const client = cancellation.clientName || 'Client';
    const workingDaysBase = cancellation.workingDaysInCycle || 20;

    const summaryRows = [
      { Parameter: 'Settlement Type', Value: 'Cancellation Tie-Up' },
      { Parameter: 'Client Name', Value: client },
      { Parameter: 'Plan Retainer Amount', Value: `$${cancellation.paymentAmount.toFixed(2)}` },
      { Parameter: 'Last Payment Date', Value: cancellation.lastPaymentDate || 'On File' },
      { Parameter: 'Coverage Start Date', Value: cancellation.coverageStart },
      { Parameter: 'Calculated Full Cycle End', Value: res.calculatedCoverageEnd },
      { Parameter: 'Effective Last Working Day', Value: res.effectiveCoverageEnd },
      { Parameter: 'Billing Cycle Basis', Value: `${cancellation.billingCycleDays} Days (${workingDaysBase} Working Days)` },
      { Parameter: 'Calculation Method', Value: cancellation.calculationMethod },
      { Parameter: 'Working Days Rendered', Value: `${res.workingDaysWorked} Days` },
      { Parameter: 'Daily Pro-Rate Rate', Value: `$${res.dailyRate.toFixed(2)} / day` },
      { Parameter: 'Earned Plan Usage Value', Value: `$${res.planUsedAmount.toFixed(2)}` },
      { Parameter: 'Gross Unused Retainer', Value: `$${res.grossRefund.toFixed(2)}` },
      { Parameter: 'Merchant Processing Fee', Value: `-$${cancellation.processingFee.toFixed(2)}` },
      { Parameter: 'Credits on File Offset', Value: `-$${cancellation.creditsOnFile.toFixed(2)}` },
      { Parameter: 'Final Net Client Refund', Value: `$${res.refundToClient.toFixed(2)}` }
    ];

    const wsSummary = XLSX.utils.json_to_sheet(summaryRows);
    wsSummary['!cols'] = [{ wch: 30 }, { wch: 35 }];
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Cancellation Summary');

    const auditRows = [
      { Step: 1, Metric: 'Daily Working Rate', Formula: `Plan Retainer ($${cancellation.paymentAmount.toFixed(2)}) ÷ ${workingDaysBase} working days`, Value: `$${res.dailyRate.toFixed(2)} / day` },
      { Step: 2, Metric: 'Plan Rendered Value', Formula: `${res.workingDaysWorked} working days worked × $${res.dailyRate.toFixed(2)}/day`, Value: `$${res.planUsedAmount.toFixed(2)}` },
      { Step: 3, Metric: 'Gross Balance', Formula: `Retainer ($${cancellation.paymentAmount.toFixed(2)}) − Used ($${res.planUsedAmount.toFixed(2)})`, Value: `$${res.grossRefund.toFixed(2)}` },
      { Step: 4, Metric: 'Fee Deduction', Formula: 'Less payment processing & merchant fees', Value: `-$${cancellation.processingFee.toFixed(2)}` },
      { Step: 5, Metric: 'Final Refund Due', Formula: 'Net settlement payable to client', Value: `$${res.refundToClient.toFixed(2)}` }
    ];
    const wsAudit = XLSX.utils.json_to_sheet(auditRows);
    wsAudit['!cols'] = [{ wch: 8 }, { wch: 24 }, { wch: 50 }, { wch: 18 }];
    XLSX.utils.book_append_sheet(wb, wsAudit, 'Itemized Math Audit');

    XLSX.writeFile(wb, `TaskAdjust_Cancellation_TieUp_${client.replace(/\s+/g, '_')}.xlsx`);
  } else if (mode === 'proration') {
    const res = calculateProration(proration);
    const client = proration.clientName || 'Client';
    const workingDaysBase = proration.workingDaysInCycle || 20;

    const summaryRows = [
      { Parameter: 'Settlement Type', Value: 'Plan Proration & Upgrade' },
      { Parameter: 'Client Name', Value: client },
      { Parameter: 'Current Plan Rate', Value: `$${proration.currentPlanRate.toFixed(2)}` },
      { Parameter: 'New Plan Rate', Value: `$${proration.newPlanRate.toFixed(2)}` },
      { Parameter: 'Last Payment Date', Value: proration.lastPaymentDate || 'On File' },
      { Parameter: 'Coverage Start Date', Value: proration.coverageStart },
      { Parameter: 'Calculated Cycle End', Value: res.calculatedCoverageEnd },
      { Parameter: 'Plan Change Effective Date', Value: proration.planChangeEffectiveDate },
      { Parameter: 'Working Days on Prior Plan', Value: `${res.daysOnOldPlan} Days` },
      { Parameter: 'Prior Plan Daily Rate', Value: `$${res.currentDailyRate.toFixed(2)} / day` },
      { Parameter: 'Prior Plan Used Amount', Value: `$${res.oldPlanUsageValue.toFixed(2)}` },
      { Parameter: 'Remaining Part-Time Credit', Value: `$${res.remainingCredit.toFixed(2)}` },
      { Parameter: 'Credits on File Offset', Value: `-$${proration.creditsOnFile.toFixed(2)}` },
      { Parameter: 'One-Time Prorated Invoice', Value: `$${res.oneTimeInvoiceAmount.toFixed(2)}` },
      { Parameter: 'Forward Coverage Window', Value: `${res.newCoverageStart} to ${res.newCoverageEnd}` },
      { Parameter: 'Recurring Billing Starts', Value: `${res.recurringBillingDate} ($${proration.newPlanRate.toFixed(2)})` }
    ];

    const wsSummary = XLSX.utils.json_to_sheet(summaryRows);
    wsSummary['!cols'] = [{ wch: 30 }, { wch: 40 }];
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Proration Summary');

    const auditRows = [
      { Step: 1, Metric: 'Daily Rate (Old Plan)', Formula: `Current Rate ($${proration.currentPlanRate.toFixed(2)}) ÷ ${workingDaysBase} working days`, Value: `$${res.currentDailyRate.toFixed(2)} / day` },
      { Step: 2, Metric: 'Old Plan Usage Value', Formula: `${res.daysOnOldPlan} working days used × $${res.currentDailyRate.toFixed(2)}/day`, Value: `$${res.oldPlanUsageValue.toFixed(2)}` },
      { Step: 3, Metric: 'Remaining Unused Credit', Formula: `Current Rate ($${proration.currentPlanRate.toFixed(2)}) − Used ($${res.oldPlanUsageValue.toFixed(2)})`, Value: `$${res.remainingCredit.toFixed(2)}` },
      { Step: 4, Metric: 'One-Time Invoice Adjustment', Formula: `New Rate ($${proration.newPlanRate.toFixed(2)}) − Credit ($${res.remainingCredit.toFixed(2)})`, Value: `$${res.oneTimeInvoiceAmount.toFixed(2)}` },
      { Step: 5, Metric: 'Next Recurring Cycle', Formula: `Starts on ${res.recurringBillingDate} (2 days before new coverage ends)`, Value: `$${proration.newPlanRate.toFixed(2)} / mo` }
    ];
    const wsAudit = XLSX.utils.json_to_sheet(auditRows);
    wsAudit['!cols'] = [{ wch: 8 }, { wch: 26 }, { wch: 55 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(wb, wsAudit, 'Itemized Math Audit');

    XLSX.writeFile(wb, `TaskAdjust_Plan_Proration_${client.replace(/\s+/g, '_')}.xlsx`);
  } else if (mode === 'active_credit' && activeCredit) {
    const res = calculateActiveCredit(activeCredit);
    const client = activeCredit.clientName || 'Client';
    const workingDaysBase = activeCredit.workingDaysInCycle || 20;

    const summaryRows = [
      { Parameter: 'Settlement Type', Value: 'Active Refund / Account Credit' },
      { Parameter: 'Client Name', Value: client },
      { Parameter: 'Plan Rate Paid', Value: `$${activeCredit.planRatePaid.toFixed(2)}` },
      { Parameter: 'Billing Cycle Basis', Value: `${activeCredit.billingCycleDays} Days (${workingDaysBase} Working Days)` },
      { Parameter: 'Shift Type', Value: `${activeCredit.shiftType} (${res.shiftHours} hrs/day)` },
      { Parameter: 'Derived Daily Rate', Value: `$${res.dailyRate.toFixed(2)} / day` },
      { Parameter: 'Derived Base Hourly Rate', Value: `$${res.baseHourlyRate.toFixed(2)} / hr` },
      { Parameter: 'Credit Unit Type', Value: activeCredit.creditUnitType },
      { Parameter: 'Units Credited', Value: `${res.quantity} ${activeCredit.creditUnitType}` },
      { Parameter: 'Gross Credit Amount', Value: `$${res.grossCredit.toFixed(2)}` },
      { Parameter: 'Processing Fee Deduction', Value: `-$${res.processingFee.toFixed(2)}` },
      { Parameter: 'Final Credit / Refund Due', Value: `$${res.netCreditRefund.toFixed(2)}` },
      { Parameter: 'Settlement Destination', Value: activeCredit.destination }
    ];

    const wsSummary = XLSX.utils.json_to_sheet(summaryRows);
    wsSummary['!cols'] = [{ wch: 30 }, { wch: 40 }];
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Active Credit Summary');

    const auditRows = [
      { Step: 1, Metric: 'Base Plan & Cycle Divisor', Formula: `Plan Paid ($${activeCredit.planRatePaid.toFixed(2)}) ÷ ${workingDaysBase} working days`, Value: `$${res.dailyRate.toFixed(2)} / day` },
      { Step: 2, Metric: 'Base Hourly Rate', Formula: `Daily Rate ($${res.dailyRate.toFixed(2)}) ÷ ${res.shiftHours} hrs/shift`, Value: `$${res.baseHourlyRate.toFixed(2)} / hr` },
      { Step: 3, Metric: 'Gross Credit Valuation', Formula: `${res.quantity} ${activeCredit.creditUnitType} × $${res.effectiveUnitRate.toFixed(2)} per unit`, Value: `$${res.grossCredit.toFixed(2)}` },
      { Step: 4, Metric: 'Processing Fee', Formula: 'Less transaction or administrative fees', Value: `-$${res.processingFee.toFixed(2)}` },
      { Step: 5, Metric: 'Final Credit / Refund', Formula: `Payable via ${activeCredit.destination}`, Value: `$${res.netCreditRefund.toFixed(2)}` }
    ];
    const wsAudit = XLSX.utils.json_to_sheet(auditRows);
    wsAudit['!cols'] = [{ wch: 8 }, { wch: 26 }, { wch: 55 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(wb, wsAudit, 'Itemized Math Audit');

    XLSX.writeFile(wb, `TaskAdjust_Active_Credit_${client.replace(/\s+/g, '_')}.xlsx`);
  } else if (mode === 'overtime' && overtime) {
    const res = calculateOvertime(overtime);
    const client = overtime.clientName || 'Client';
    const workingDaysBase = overtime.workingDaysInCycle || 20;

    const isLegacy = res.regularOtRateType === '100%';
    const summaryRows = [
      { Parameter: 'Settlement Type', Value: 'Overtime Settlement' },
      { Parameter: 'Client Name', Value: client },
      { Parameter: 'Base Plan Rate', Value: `$${overtime.basePlanRate.toFixed(2)}` },
      { Parameter: 'Billing Cycle Basis', Value: `${overtime.billingCycleDays} Days (${workingDaysBase} Working Days)` },
      { Parameter: 'Shift Type', Value: `${overtime.shiftType} (${res.shiftHours} hrs/day)` },
      { Parameter: 'Daily Shift Rate', Value: `$${res.dailyRate.toFixed(2)} / day` },
      { Parameter: 'Base Hourly Rate', Value: `$${res.baseHourlyRate.toFixed(2)} / hr` },
      { Parameter: `Regular OT Rate (${isLegacy ? '100% 1.0x Legacy' : '150% 1.5x Standard'})`, Value: `$${res.regularOtRate.toFixed(2)} / hr` },
      { Parameter: 'Regular OT Multiplier', Value: `${res.regularOtMultiplier}x` },
      { Parameter: 'Regular OT Hours Logged', Value: `${res.regularOtHours} hrs` },
      { Parameter: 'Regular OT Invoiced', Value: `$${res.regularOtAmount.toFixed(2)}` },
      { Parameter: 'Holiday OT Rate (200%)', Value: `$${res.holidayOtRate.toFixed(2)} / hr` },
      { Parameter: 'Holiday OT Hours Logged', Value: `${res.holidayOtHours} hrs` },
      { Parameter: 'Holiday OT Invoiced', Value: `$${res.holidayOtAmount.toFixed(2)}` },
      { Parameter: 'Total Overtime Invoiced', Value: `$${res.totalOtAmountDue.toFixed(2)}` }
    ];

    const wsSummary = XLSX.utils.json_to_sheet(summaryRows);
    wsSummary['!cols'] = [{ wch: 30 }, { wch: 40 }];
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Overtime Summary');

    const auditRows = [
      { Step: 1, Metric: 'Base Rate & Shift Basis', Formula: `Plan ($${overtime.basePlanRate.toFixed(2)}) ÷ ${workingDaysBase} days ÷ ${res.shiftHours} hrs`, Value: `$${res.baseHourlyRate.toFixed(2)} / hr` },
      { Step: 2, Metric: `Regular OT (${isLegacy ? '100% 1.0x Legacy' : '150% 1.5x Standard'})`, Formula: `${res.regularOtHours} hrs × ($${res.baseHourlyRate.toFixed(2)} × ${res.regularOtMultiplier} = $${res.regularOtRate.toFixed(2)}/hr)`, Value: `$${res.regularOtAmount.toFixed(2)}` },
      { Step: 3, Metric: 'Holiday OT (200%)', Formula: `${res.holidayOtHours} hrs × ($${res.baseHourlyRate.toFixed(2)} × 2.0 = $${res.holidayOtRate.toFixed(2)}/hr)`, Value: `$${res.holidayOtAmount.toFixed(2)}` },
      { Step: 4, Metric: 'Total Overtime Due', Formula: `Regular OT ($${res.regularOtAmount.toFixed(2)}) + Holiday OT ($${res.holidayOtAmount.toFixed(2)})`, Value: `$${res.totalOtAmountDue.toFixed(2)}` }
    ];
    const wsAudit = XLSX.utils.json_to_sheet(auditRows);
    wsAudit['!cols'] = [{ wch: 8 }, { wch: 26 }, { wch: 55 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(wb, wsAudit, 'Itemized Math Audit');

    XLSX.writeFile(wb, `TaskAdjust_Overtime_Settlement_${client.replace(/\s+/g, '_')}.xlsx`);
  }
}
