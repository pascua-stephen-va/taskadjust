import React, { useState } from 'react';
import { CalculationMode, CancellationInput, ProrationInput, ActiveCreditInput, OvertimeInput } from '../types';
import { calculateCancellation, calculateProration, calculateActiveCredit, calculateOvertime } from '../utils/calculator';
import { formatFriendlyDate, addDays, parseLocalDate } from '../utils/date';
import { 
  UserX, 
  RefreshCw, 
  CreditCard,
  Clock,
  CheckCircle2, 
  Circle, 
  ListChecks, 
  DollarSign, 
  Calendar, 
  Copy, 
  Check, 
  Sparkles,
  ArrowRight,
  ShieldAlert,
  Info,
  FileSpreadsheet,
  Coins,
  Receipt,
  Percent,
  ChevronDown,
  RotateCcw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { exportCurrentCalculationToXLSX } from '../utils/spreadsheet';

interface CalculatorViewProps {
  mode: CalculationMode;
  setMode: (m: CalculationMode) => void;
  cancellation: CancellationInput;
  setCancellation: (c: CancellationInput) => void;
  proration: ProrationInput;
  setProration: (p: ProrationInput) => void;
  activeCredit: ActiveCreditInput;
  setActiveCredit: (a: ActiveCreditInput) => void;
  overtime: OvertimeInput;
  setOvertime: (o: OvertimeInput) => void;
  onResetMode?: () => void;
}

export function CalculatorView({ 
  mode, 
  setMode, 
  cancellation, 
  setCancellation, 
  proration, 
  setProration,
  activeCredit,
  setActiveCredit,
  overtime,
  setOvertime,
  onResetMode
}: CalculatorViewProps) {
  const [copied, setCopied] = useState(false);
  const [justReset, setJustReset] = useState(false);

  const handleReset = () => {
    if (!onResetMode) return;
    onResetMode();
    setJustReset(true);
    setTimeout(() => setJustReset(false), 1800);
  };
  
  const handleCancelChange = (field: keyof CancellationInput, value: any) => {
    setCancellation({ ...cancellation, [field]: value });
  };
  
  const handleProrationChange = (field: keyof ProrationInput, value: any) => {
    setProration({ ...proration, [field]: value });
  };

  const handleActiveCreditChange = (field: keyof ActiveCreditInput, value: any) => {
    setActiveCredit({ ...activeCredit, [field]: value });
  };

  const handleOvertimeChange = (field: keyof OvertimeInput, value: any) => {
    setOvertime({ ...overtime, [field]: value });
  };
  
  const cancelResult = calculateCancellation(cancellation);
  const prorateResult = calculateProration(proration);
  const activeCreditResult = calculateActiveCredit(activeCredit);
  const overtimeResult = calculateOvertime(overtime);
  
  const formatMoney = (val: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);

  // Dynamic cycle days & working days base based on active mode
  let cycleDays = 28;
  let workingDaysBase = 20;

  if (mode === 'cancellation') {
    cycleDays = cancellation.billingCycleDays;
    workingDaysBase = cancellation.workingDaysInCycle || (cycleDays === 28 ? 20 : 22);
  } else if (mode === 'proration') {
    cycleDays = proration.billingCycleDays;
    workingDaysBase = proration.workingDaysInCycle || (cycleDays === 28 ? 20 : 22);
  } else if (mode === 'active_credit') {
    cycleDays = activeCredit.billingCycleDays;
    workingDaysBase = activeCredit.workingDaysInCycle || (cycleDays === 28 ? 20 : 22);
  } else if (mode === 'overtime') {
    cycleDays = overtime.billingCycleDays;
    workingDaysBase = overtime.workingDaysInCycle || (cycleDays === 28 ? 20 : 22);
  }

  // Active client name
  const currentClientName = 
    mode === 'cancellation' ? cancellation.clientName :
    mode === 'proration' ? proration.clientName :
    mode === 'active_credit' ? activeCredit.clientName :
    overtime.clientName;

  const handleClientNameChange = (name: string) => {
    if (mode === 'cancellation') handleCancelChange('clientName', name);
    else if (mode === 'proration') handleProrationChange('clientName', name);
    else if (mode === 'active_credit') handleActiveCreditChange('clientName', name);
    else handleOvertimeChange('clientName', name);
  };

  const setCycleAndWorkingDays = (days: 28 | 30) => {
    const workingDays = days === 28 ? 20 : 22;
    if (mode === 'cancellation') {
      setCancellation({
        ...cancellation,
        billingCycleDays: days,
        workingDaysInCycle: workingDays
      });
    } else if (mode === 'proration') {
      setProration({
        ...proration,
        billingCycleDays: days,
        workingDaysInCycle: workingDays
      });
    } else if (mode === 'active_credit') {
      setActiveCredit({
        ...activeCredit,
        billingCycleDays: days,
        workingDaysInCycle: workingDays
      });
    } else if (mode === 'overtime') {
      setOvertime({
        ...overtime,
        billingCycleDays: days,
        workingDaysInCycle: workingDays
      });
    }
  };

  const handleWorkingDaysChange = (val: number) => {
    if (mode === 'cancellation') handleCancelChange('workingDaysInCycle', val);
    else if (mode === 'proration') handleProrationChange('workingDaysInCycle', val);
    else if (mode === 'active_credit') handleActiveCreditChange('workingDaysInCycle', val);
    else handleOvertimeChange('workingDaysInCycle', val);
  };

  // Generate Exact Client Email Breakdown for 1-click Copy
  const generateCopyableText = () => {
    if (mode === 'cancellation') {
      return `Thank you for your business. I wanted to close the loop on your account and share the final tie-up for your records.

Here is the breakdown:

Plan: ${formatMoney(cancellation.paymentAmount)}
Last payment: ${cancellation.lastPaymentDate ? formatFriendlyDate(cancellation.lastPaymentDate) : 'On File'}
Coverage period: ${formatFriendlyDate(cancellation.coverageStart)} to ${formatFriendlyDate(cancelResult.calculatedCoverageEnd)}
Last working day: ${formatFriendlyDate(cancelResult.effectiveCoverageEnd)} (${formatFriendlyDate(cancellation.coverageStart)} to ${formatFriendlyDate(cancelResult.effectiveCoverageEnd)}, ${cancelResult.workingDaysWorked} working days)

Computation:

${formatMoney(cancellation.paymentAmount)} / ${workingDaysBase} working days = ${formatMoney(cancelResult.dailyRate)} per day
${formatMoney(cancelResult.dailyRate)} x ${cancelResult.workingDaysWorked} days worked = ${formatMoney(cancelResult.planUsedAmount)}
${formatMoney(cancellation.paymentAmount)} - ${formatMoney(cancelResult.planUsedAmount)} = ${formatMoney(cancelResult.grossRefund)}
${cancellation.processingFee > 0 ? `Less processing fee: ${formatMoney(cancellation.processingFee)}\n` : ''}${cancellation.creditsOnFile > 0 ? `Less credits on file: ${formatMoney(cancellation.creditsOnFile)}\n` : ''}Final refund: ${formatMoney(cancelResult.refundToClient)}`;
    } else if (mode === 'proration') {
      const creditsLine = proration.creditsOnFile > 0 ? ` - ${formatMoney(proration.creditsOnFile)} (credits on file)` : '';
      return `Your part-time plan was ${formatMoney(proration.currentPlanRate)}, last paid on ${proration.lastPaymentDate ? formatFriendlyDate(proration.lastPaymentDate) : 'On File'}, covering ${formatFriendlyDate(proration.coverageStart)} to ${formatFriendlyDate(prorateResult.calculatedCoverageEnd)}. Since the full-time plan took effect on ${formatFriendlyDate(proration.planChangeEffectiveDate)}, we prorated the unused portion of your part-time coverage and applied it as a credit toward the new plan.

Here is the breakdown:

Part-time used (${formatFriendlyDate(proration.coverageStart)} to ${formatFriendlyDate(addDays(parseLocalDate(proration.planChangeEffectiveDate), -1))}, ${prorateResult.daysOnOldPlan} working days): ${formatMoney(prorateResult.currentDailyRate)}/day x ${prorateResult.daysOnOldPlan} = ${formatMoney(prorateResult.oldPlanUsageValue)}
Remaining part-time credit: ${formatMoney(proration.currentPlanRate)} - ${formatMoney(prorateResult.oldPlanUsageValue)} = ${formatMoney(prorateResult.remainingCredit)}
Full-time plan: ${formatMoney(proration.newPlanRate)}
One-time invoice after credit applied: ${formatMoney(proration.newPlanRate)} - ${formatMoney(prorateResult.remainingCredit)}${creditsLine} = ${formatMoney(prorateResult.oneTimeInvoiceAmount)}

Going forward, your full-time coverage runs ${formatFriendlyDate(prorateResult.newCoverageStart)} to ${formatFriendlyDate(prorateResult.newCoverageEnd)}, and recurring billing of ${formatMoney(proration.newPlanRate)} begins on ${formatFriendlyDate(prorateResult.recurringBillingDate)} (two days before coverage ends).

If everything looks good and you have no questions, please reply to confirm and we will process the one-time invoice of ${formatMoney(prorateResult.oneTimeInvoiceAmount)}. Happy to jump on a quick call if you would like to review anything.`;
    } else if (mode === 'active_credit') {
      const feeLine = activeCreditResult.processingFee > 0 ? `\nLess processing fee: ${formatMoney(activeCreditResult.processingFee)}` : '';
      return `Hello ${activeCredit.clientName || 'Client'},

Here is the summary of the account adjustment and credit for your active plan:

Plan: ${formatMoney(activeCredit.planRatePaid)} (${workingDaysBase} working days basis, ${activeCredit.shiftType} ${activeCreditResult.shiftHours} hrs/shift)
Rate Basis: ${formatMoney(activeCreditResult.dailyRate)}/day (${formatMoney(activeCreditResult.baseHourlyRate)}/hr)
Adjustment: ${activeCreditResult.quantity} ${activeCredit.creditUnitType} credited

Computation:
${activeCredit.creditUnitType === 'Days' 
  ? `${formatMoney(activeCredit.planRatePaid)} / ${workingDaysBase} working days = ${formatMoney(activeCreditResult.dailyRate)} per day\n${activeCreditResult.quantity} days x ${formatMoney(activeCreditResult.dailyRate)}/day = ${formatMoney(activeCreditResult.grossCredit)} gross credit`
  : `${formatMoney(activeCreditResult.dailyRate)} / ${activeCreditResult.shiftHours} hrs = ${formatMoney(activeCreditResult.baseHourlyRate)} per hr\n${activeCreditResult.quantity} hrs x ${formatMoney(activeCreditResult.baseHourlyRate)}/hr = ${formatMoney(activeCreditResult.grossCredit)} gross credit`
}${feeLine}
Final Credit / Refund: ${formatMoney(activeCreditResult.netCreditRefund)} (Settled via ${activeCredit.destination})

Please let us know if you have any questions.`;
    } else {
      return `Hello ${overtime.clientName || 'Client'},

Here is the overtime settlement breakdown for extra hours logged during the billing cycle:

Plan: ${formatMoney(overtime.basePlanRate)} (${workingDaysBase} working days basis, ${overtime.shiftType} ${overtimeResult.shiftHours} hrs/shift)
Base Hourly Rate: ${formatMoney(overtime.basePlanRate)} / ${workingDaysBase} days / ${overtimeResult.shiftHours} hrs = ${formatMoney(overtimeResult.baseHourlyRate)}/hr

Overtime Breakdown:
• Regular Overtime (${(overtime.regularOtRateType || '150%') === '100%' ? '100% Straight Time / Legacy' : '150% Standard'}): ${overtimeResult.regularOtHours} hrs x ${formatMoney(overtimeResult.regularOtRate)}/hr (${formatMoney(overtimeResult.baseHourlyRate)} x ${overtimeResult.regularOtMultiplier}) = ${formatMoney(overtimeResult.regularOtAmount)}
• Holiday Overtime (200%): ${overtimeResult.holidayOtHours} hrs x ${formatMoney(overtimeResult.holidayOtRate)}/hr (${formatMoney(overtimeResult.baseHourlyRate)} x 2.0) = ${formatMoney(overtimeResult.holidayOtAmount)}

Total Overtime Due: ${formatMoney(overtimeResult.totalOtAmountDue)}

This amount will be included on your upcoming invoice. Please let us know if you need any additional timecard details.`;
    }
  };

  const handleCopyEmail = () => {
    const text = generateCopyableText();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Hero Card Data Computation
  let heroBadge = 'CANCELLATION TIE-UP';
  let heroHeading = 'Final Client Refund Due';
  let heroAmount = cancelResult.refundToClient;
  let heroSubtext = 'Direct Client Refund';
  let isPositiveRefund = cancelResult.refundToClient > 0;

  if (mode === 'cancellation') {
    heroBadge = 'CANCELLATION TIE-UP';
    if (cancelResult.refundToClient > 0) {
      heroHeading = 'Final Client Refund Due';
      heroAmount = cancelResult.refundToClient;
      heroSubtext = 'Direct Client Refund';
      isPositiveRefund = true;
    } else {
      heroHeading = 'Balance Due from Client';
      heroAmount = cancelResult.paymentDue;
      heroSubtext = 'Invoice Payment Due';
      isPositiveRefund = false;
    }
  } else if (mode === 'proration') {
    heroBadge = 'PLAN PRORATION TIE-UP';
    heroHeading = 'One-Time Invoice After Credit Applied';
    heroAmount = prorateResult.oneTimeInvoiceAmount;
    heroSubtext = 'Payable by Client';
    isPositiveRefund = false;
  } else if (mode === 'active_credit') {
    heroBadge = 'ACTIVE ADJUSTMENT';
    heroHeading = 'Total Credit / Refund Due';
    heroAmount = activeCreditResult.netCreditRefund;
    heroSubtext = activeCredit.destination;
    isPositiveRefund = true;
  } else if (mode === 'overtime') {
    heroBadge = 'OVERTIME SETTLEMENT';
    heroHeading = 'Total OT Invoiced to Client';
    heroAmount = overtimeResult.totalOtAmountDue;
    heroSubtext = 'Billable Overtime Total';
    isPositiveRefund = false;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      
      {/* LEFT PANEL: Controls & Input Parameters */}
      <aside className="lg:col-span-5 space-y-6">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.2, 0, 0, 1] }}
          className="bg-white dark:bg-[#0B1E38] rounded-3xl p-6 sm:p-7 shadow-sm border border-gray-200/80 dark:border-white/10 space-y-6"
        >
          
          <div className="border-b border-gray-100 dark:border-white/10 pb-4 flex items-start justify-between gap-3">
            <div>
              <span className="text-[11px] font-black uppercase tracking-wider text-[#006AC1] dark:text-[#00B2FF] bg-[#F0F8FF] dark:bg-[#00B2FF]/10 border border-[#7FA3D8]/30 dark:border-[#00B2FF]/30 px-3.5 py-1 rounded-full inline-block mb-1.5">
                Settlement Engine
              </span>
              <h2 className="text-xl font-black text-[#0A2A5E] dark:text-white tracking-tight font-display">Parameters &amp; Inputs</h2>
              <p className="text-xs text-gray-500 dark:text-slate-400 font-medium mt-0.5">Configure contract rates, billing cycles, and settlement parameters.</p>
            </div>
            {onResetMode && (
              <motion.button
                type="button"
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.94 }}
                onClick={handleReset}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-bold border transition-colors cursor-pointer shrink-0 ${
                  justReset
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-700/50 text-emerald-700 dark:text-emerald-300'
                    : 'bg-gray-50 dark:bg-[#07172C] hover:bg-gray-100 dark:hover:bg-[#0D2340] border-gray-200 dark:border-white/15 text-gray-600 dark:text-slate-300'
                }`}
                title="Reset current mode parameters to defaults"
              >
                {justReset ? <Check size={12} /> : <RotateCcw size={12} />}
                <span>{justReset ? 'Reset' : 'Defaults'}</span>
              </motion.button>
            )}
          </div>

          {/* Client Account / Name Input */}
          <div>
            <label className="block text-xs font-bold text-[#0A2A5E] dark:text-slate-200 mb-1">
              Client Account / Name
            </label>
            <input 
              type="text" 
              value={currentClientName}
              onChange={e => handleClientNameChange(e.target.value)}
              placeholder="e.g. Acme Corp / Bob"
              className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-[#07172C] border border-gray-200 dark:border-white/15 rounded-xl text-xs font-bold text-[#0A2A5E] dark:text-white focus:ring-2 focus:ring-[#00B2FF] focus:bg-white dark:focus:bg-[#091F3B] outline-none transition-all"
            />
          </div>

          {/* 1. ADJUSTMENT TYPE TOGGLES (4 Operational Modes) */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-[#0A2A5E] dark:text-slate-200">
              1. Adjustment Type
            </label>
            <div className="grid grid-cols-2 gap-2 bg-gray-100/80 dark:bg-[#07172C] p-1.5 rounded-2xl border border-gray-200 dark:border-white/10 relative">
              
              {/* Cancellation */}
              <motion.button
                onClick={() => setMode('cancellation')}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.96 }}
                className={`relative py-2 px-2.5 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 cursor-pointer z-10 select-none transition-colors duration-150 ${
                  mode === 'cancellation' ? 'text-[#006AC1] dark:text-[#00B2FF]' : 'text-gray-500 dark:text-slate-400 hover:text-[#0A2A5E] dark:hover:text-white'
                }`}
              >
                {mode === 'cancellation' && (
                  <motion.div
                    layoutId="activeModePill"
                    className="absolute inset-0 bg-white dark:bg-[#0B254E] rounded-xl shadow-xs"
                    style={{ zIndex: -1 }}
                    transition={{ type: 'spring', stiffness: 420, damping: 30 }}
                  />
                )}
                <UserX size={14} className="shrink-0" />
                <span className="truncate">Cancellation</span>
              </motion.button>

              {/* Plan Proration */}
              <motion.button
                onClick={() => setMode('proration')}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.96 }}
                className={`relative py-2 px-2.5 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 cursor-pointer z-10 select-none transition-colors duration-150 ${
                  mode === 'proration' ? 'text-[#006AC1] dark:text-[#00B2FF]' : 'text-gray-500 dark:text-slate-400 hover:text-[#0A2A5E] dark:hover:text-white'
                }`}
              >
                {mode === 'proration' && (
                  <motion.div
                    layoutId="activeModePill"
                    className="absolute inset-0 bg-white dark:bg-[#0B254E] rounded-xl shadow-xs"
                    style={{ zIndex: -1 }}
                    transition={{ type: 'spring', stiffness: 420, damping: 30 }}
                  />
                )}
                <RefreshCw size={14} className="shrink-0" />
                <span className="truncate">Proration</span>
              </motion.button>

              {/* Active Refund / Credit */}
              <motion.button
                onClick={() => setMode('active_credit')}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.96 }}
                className={`relative py-2 px-2.5 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 cursor-pointer z-10 select-none transition-colors duration-150 ${
                  mode === 'active_credit' ? 'text-[#006AC1] dark:text-[#00B2FF]' : 'text-gray-500 dark:text-slate-400 hover:text-[#0A2A5E] dark:hover:text-white'
                }`}
              >
                {mode === 'active_credit' && (
                  <motion.div
                    layoutId="activeModePill"
                    className="absolute inset-0 bg-white dark:bg-[#0B254E] rounded-xl shadow-xs"
                    style={{ zIndex: -1 }}
                    transition={{ type: 'spring', stiffness: 420, damping: 30 }}
                  />
                )}
                <Coins size={14} className="shrink-0" />
                <span className="truncate">Active Credit</span>
              </motion.button>

              {/* Overtime (OT) */}
              <motion.button
                onClick={() => setMode('overtime')}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.96 }}
                className={`relative py-2 px-2.5 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 cursor-pointer z-10 select-none transition-colors duration-150 ${
                  mode === 'overtime' ? 'text-[#006AC1] dark:text-[#00B2FF]' : 'text-gray-500 dark:text-slate-400 hover:text-[#0A2A5E] dark:hover:text-white'
                }`}
              >
                {mode === 'overtime' && (
                  <motion.div
                    layoutId="activeModePill"
                    className="absolute inset-0 bg-white dark:bg-[#0B254E] rounded-xl shadow-xs"
                    style={{ zIndex: -1 }}
                    transition={{ type: 'spring', stiffness: 420, damping: 30 }}
                  />
                )}
                <Clock size={14} className="shrink-0" />
                <span className="truncate">Overtime (OT)</span>
              </motion.button>

            </div>
          </div>

          {/* 2. BILLING CYCLE & WORKING DAYS (Consolidated & Non-Redundant) */}
          <div className="space-y-3 pt-2 border-t border-gray-100 dark:border-white/10">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#0A2A5E] dark:text-slate-200">
                2. Billing Cycle & Working Days
              </label>
              <span className="text-[10px] text-[#006AC1] dark:text-[#00B2FF] font-bold bg-[#F0F8FF] dark:bg-[#00B2FF]/10 px-2 py-0.5 rounded-md border border-[#7FA3D8]/30 dark:border-[#00B2FF]/30">
                {workingDaysBase} Working Days
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <motion.div
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => setCycleAndWorkingDays(28)}
                className={`cursor-pointer border-2 rounded-2xl p-3.5 flex items-center justify-between text-xs font-bold transition-all duration-200 select-none ${
                  cycleDays === 28 
                    ? 'border-[#00B2FF] bg-[#F0F8FF] dark:bg-[#00B2FF]/10 shadow-xs' 
                    : 'border-gray-200 dark:border-white/15 hover:border-gray-300 dark:hover:border-white/25 bg-white dark:bg-[#07172C]'
                }`}
              >
                <div>
                  <span className="block text-[#0A2A5E] dark:text-white font-extrabold text-xs">28-Day Cycle</span>
                  <span className="text-[10px] text-[#006AC1] dark:text-[#00B2FF] font-extrabold">20 Working Days</span>
                  <span className="block text-[9px] text-gray-400 dark:text-slate-400 font-medium">4 Calendar Weeks</span>
                </div>
                {cycleDays === 28 ? (
                  <CheckCircle2 size={18} className="text-[#00B2FF]" />
                ) : (
                  <Circle size={18} className="text-gray-300 dark:text-gray-600" />
                )}
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => setCycleAndWorkingDays(30)}
                className={`cursor-pointer border-2 rounded-2xl p-3.5 flex items-center justify-between text-xs font-bold transition-all duration-200 select-none ${
                  cycleDays === 30 
                    ? 'border-[#00B2FF] bg-[#F0F8FF] dark:bg-[#00B2FF]/10 shadow-xs' 
                    : 'border-gray-200 dark:border-white/15 hover:border-gray-300 dark:hover:border-white/25 bg-white dark:bg-[#07172C]'
                }`}
              >
                <div>
                  <span className="block text-[#0A2A5E] dark:text-white font-extrabold text-xs">30-Day Cycle</span>
                  <span className="text-[10px] text-[#006AC1] dark:text-[#00B2FF] font-extrabold">22 Working Days</span>
                  <span className="block text-[9px] text-gray-400 dark:text-slate-400 font-medium">Calendar Month</span>
                </div>
                {cycleDays === 30 ? (
                  <CheckCircle2 size={18} className="text-[#00B2FF]" />
                ) : (
                  <Circle size={18} className="text-gray-300 dark:text-gray-600" />
                )}
              </motion.div>
            </div>

            {/* Custom Working Days adjustment for edge-case contract schedules */}
            <div className="flex items-center justify-between bg-gray-50/80 dark:bg-[#07172C] px-3.5 py-2 rounded-xl border border-gray-200/80 dark:border-white/10">
              <span className="text-[11px] font-semibold text-gray-600 dark:text-slate-300">Custom Working Days (Override):</span>
              <div className="flex items-center gap-1.5">
                <input 
                  type="number"
                  value={workingDaysBase}
                  onChange={e => handleWorkingDaysChange(Math.max(1, Number(e.target.value)))}
                  min="1"
                  max="31"
                  className="w-14 py-1 px-2 bg-white dark:bg-[#091F3B] border border-gray-300 dark:border-white/20 rounded-lg text-xs font-black text-center text-[#0A2A5E] dark:text-white focus:border-[#00B2FF] focus:ring-1 focus:ring-[#00B2FF] outline-none"
                />
                <span className="text-[11px] text-gray-500 dark:text-slate-400 font-bold">days</span>
              </div>
            </div>
          </div>

          {/* DYNAMIC MODE FORMS */}

          {/* 1. CANCELLATION FORM */}
          {mode === 'cancellation' && (
            <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-white/10">
              <h3 className="text-xs font-black uppercase tracking-wider text-[#006AC1] dark:text-[#00B2FF]">Cancellation Contract Details</h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#0A2A5E] dark:text-slate-200 mb-1">
                    Last Payment Date
                  </label>
                  <input 
                    type="date" 
                    value={cancellation.lastPaymentDate || ''}
                    onChange={e => handleCancelChange('lastPaymentDate', e.target.value)}
                    className="w-full px-3 py-2.5 bg-gray-50 dark:bg-[#07172C] border border-gray-200 dark:border-white/15 rounded-xl text-xs font-bold text-[#0A2A5E] dark:text-white focus:ring-2 focus:ring-[#00B2FF] focus:bg-white dark:focus:bg-[#091F3B] outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#0A2A5E] dark:text-slate-200 mb-1">
                    Coverage Start Date
                  </label>
                  <input 
                    type="date" 
                    value={cancellation.coverageStart}
                    onChange={e => handleCancelChange('coverageStart', e.target.value)}
                    className="w-full px-3 py-2.5 bg-gray-50 dark:bg-[#07172C] border border-gray-200 dark:border-white/15 rounded-xl text-xs font-bold text-[#0A2A5E] dark:text-white focus:ring-2 focus:ring-[#00B2FF] focus:bg-white dark:focus:bg-[#091F3B] outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0A2A5E] dark:text-slate-200 mb-1">
                  Plan Rate Paid ($)
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400 dark:text-slate-500 text-xs font-bold">$</span>
                  <input 
                    type="number" 
                    value={cancellation.paymentAmount || ''}
                    step="0.01"
                    onChange={e => handleCancelChange('paymentAmount', Number(e.target.value))}
                    className="w-full pl-7 pr-3 py-2.5 bg-gray-50 dark:bg-[#07172C] border border-gray-200 dark:border-white/15 rounded-xl text-xs font-bold text-[#0A2A5E] dark:text-white focus:ring-2 focus:ring-[#00B2FF] focus:bg-white dark:focus:bg-[#091F3B] outline-none transition-all"
                    placeholder="1495.00"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0A2A5E] dark:text-slate-200 mb-1">
                  Last Working Day
                </label>
                <input 
                    type="date" 
                  value={cancellation.lastWorkingDay || cancellation.actualCoverageEndOverride || ''}
                  onChange={e => {
                    handleCancelChange('lastWorkingDay', e.target.value);
                    handleCancelChange('actualCoverageEndOverride', e.target.value);
                  }}
                  className="w-full px-3 py-2.5 bg-gray-50 dark:bg-[#07172C] border border-gray-200 dark:border-white/15 rounded-xl text-xs font-bold text-[#0A2A5E] dark:text-white focus:ring-2 focus:ring-[#00B2FF] focus:bg-white dark:focus:bg-[#091F3B] outline-none transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#0A2A5E] dark:text-slate-200 mb-1">
                    Less: Processing Fee ($)
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400 dark:text-slate-500 text-xs font-bold">$</span>
                    <input 
                      type="number" 
                      value={cancellation.processingFee || ''}
                      step="0.01"
                      onChange={e => handleCancelChange('processingFee', Number(e.target.value))}
                      className="w-full pl-7 pr-3 py-2.5 bg-gray-50 dark:bg-[#07172C] border border-gray-200 dark:border-white/15 rounded-xl text-xs font-bold text-[#0A2A5E] dark:text-white focus:ring-2 focus:ring-[#00B2FF] focus:bg-white dark:focus:bg-[#091F3B] outline-none transition-all"
                      placeholder="43.66"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#0A2A5E] dark:text-slate-200 mb-1">
                    Credits on File ($)
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400 dark:text-slate-500 text-xs font-bold">$</span>
                    <input 
                      type="number" 
                      value={cancellation.creditsOnFile || ''}
                      step="0.01"
                      onChange={e => handleCancelChange('creditsOnFile', Number(e.target.value))}
                      className="w-full pl-7 pr-3 py-2.5 bg-gray-50 dark:bg-[#07172C] border border-gray-200 dark:border-white/15 rounded-xl text-xs font-bold text-[#0A2A5E] dark:text-white focus:ring-2 focus:ring-[#00B2FF] focus:bg-white dark:focus:bg-[#091F3B] outline-none transition-all"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* 2. PLAN PRORATION FORM */}
          {mode === 'proration' && (
            <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-white/10">
              <h3 className="text-xs font-black uppercase tracking-wider text-[#006AC1] dark:text-[#00B2FF]">Plan Upgrade / Downgrade Rules</h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#0A2A5E] dark:text-slate-200 mb-1">
                    Last Payment Date
                  </label>
                  <input 
                    type="date" 
                    value={proration.lastPaymentDate || ''}
                    onChange={e => handleProrationChange('lastPaymentDate', e.target.value)}
                    className="w-full px-3 py-2.5 bg-gray-50 dark:bg-[#07172C] border border-gray-200 dark:border-white/15 rounded-xl text-xs font-bold text-[#0A2A5E] dark:text-white focus:ring-2 focus:ring-[#00B2FF] focus:bg-white dark:focus:bg-[#091F3B] outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#0A2A5E] dark:text-slate-200 mb-1">
                    Coverage Start Date
                  </label>
                  <input 
                    type="date" 
                    value={proration.coverageStart}
                    onChange={e => handleProrationChange('coverageStart', e.target.value)}
                    className="w-full px-3 py-2.5 bg-gray-50 dark:bg-[#07172C] border border-gray-200 dark:border-white/15 rounded-xl text-xs font-bold text-[#0A2A5E] dark:text-white focus:ring-2 focus:ring-[#00B2FF] focus:bg-white dark:focus:bg-[#091F3B] outline-none transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#0A2A5E] dark:text-slate-200 mb-1">
                    Part-Time / Old Plan ($)
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400 dark:text-slate-500 text-xs font-bold">$</span>
                    <input 
                      type="number" 
                      value={proration.currentPlanRate || ''}
                      step="0.01"
                      onChange={e => handleProrationChange('currentPlanRate', Number(e.target.value))}
                      className="w-full pl-7 pr-3 py-2.5 bg-gray-50 dark:bg-[#07172C] border border-gray-200 dark:border-white/15 rounded-xl text-xs font-bold text-[#0A2A5E] dark:text-white focus:ring-2 focus:ring-[#00B2FF] focus:bg-white dark:focus:bg-[#091F3B] outline-none transition-all"
                      placeholder="1295.00"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#0A2A5E] dark:text-slate-200 mb-1">
                    Full-Time / New Plan ($)
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400 dark:text-slate-500 text-xs font-bold">$</span>
                    <input 
                      type="number" 
                      value={proration.newPlanRate || ''}
                      step="0.01"
                      onChange={e => handleProrationChange('newPlanRate', Number(e.target.value))}
                      className="w-full pl-7 pr-3 py-2.5 bg-gray-50 dark:bg-[#07172C] border border-gray-200 dark:border-white/15 rounded-xl text-xs font-bold text-[#0A2A5E] dark:text-white focus:ring-2 focus:ring-[#00B2FF] focus:bg-white dark:focus:bg-[#091F3B] outline-none transition-all"
                      placeholder="2295.00"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0A2A5E] dark:text-slate-200 mb-1">
                  New Plan Effective Date
                </label>
                <input 
                  type="date" 
                  value={proration.planChangeEffectiveDate}
                  onChange={e => handleProrationChange('planChangeEffectiveDate', e.target.value)}
                  className="w-full px-3 py-2.5 bg-gray-50 dark:bg-[#07172C] border border-gray-200 dark:border-white/15 rounded-xl text-xs font-bold text-[#0A2A5E] dark:text-white focus:ring-2 focus:ring-[#00B2FF] focus:bg-white dark:focus:bg-[#091F3B] outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0A2A5E] dark:text-slate-200 mb-1">
                  Credits on File ($)
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400 dark:text-slate-500 text-xs font-bold">$</span>
                  <input 
                    type="number" 
                    value={proration.creditsOnFile || ''}
                    step="0.01"
                    onChange={e => handleProrationChange('creditsOnFile', Number(e.target.value))}
                    className="w-full pl-7 pr-3 py-2.5 bg-gray-50 dark:bg-[#07172C] border border-gray-200 dark:border-white/15 rounded-xl text-xs font-bold text-[#0A2A5E] dark:text-white focus:ring-2 focus:ring-[#00B2FF] focus:bg-white dark:focus:bg-[#091F3B] outline-none transition-all"
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 3. ACTIVE REFUND / ACCOUNT CREDIT FORM */}
          {mode === 'active_credit' && (
            <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-white/10">
              <h3 className="text-xs font-black uppercase tracking-wider text-[#006AC1] dark:text-[#00B2FF]">Active Plan Adjustment Details</h3>

              {/* Plan Rate Paid */}
              <div>
                <label className="block text-xs font-bold text-[#0A2A5E] dark:text-slate-200 mb-1">
                  Plan Rate Paid ($)
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400 dark:text-slate-500 text-xs font-bold">$</span>
                  <input 
                    type="number" 
                    value={activeCredit.planRatePaid || ''}
                    step="0.01"
                    onChange={e => handleActiveCreditChange('planRatePaid', Number(e.target.value))}
                    className="w-full pl-7 pr-3 py-2.5 bg-gray-50 dark:bg-[#07172C] border border-gray-200 dark:border-white/15 rounded-xl text-xs font-bold text-[#0A2A5E] dark:text-white focus:ring-2 focus:ring-[#00B2FF] focus:bg-white dark:focus:bg-[#091F3B] outline-none transition-all"
                    placeholder="1495.00"
                  />
                </div>
              </div>

              {/* Credit Unit Type Selector (Days vs Hours) */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#0A2A5E] dark:text-slate-200">
                  Credit Unit Type
                </label>
                <div className="grid grid-cols-2 gap-2 bg-gray-100/80 dark:bg-[#07172C] p-1 rounded-xl border border-gray-200 dark:border-white/10">
                  <button
                    type="button"
                    onClick={() => handleActiveCreditChange('creditUnitType', 'Days')}
                    className={`py-2 px-3 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                      activeCredit.creditUnitType === 'Days'
                        ? 'bg-white dark:bg-[#0B254E] text-[#006AC1] dark:text-[#00B2FF] shadow-xs'
                        : 'text-gray-500 dark:text-slate-400 hover:text-[#0A2A5E] dark:hover:text-white'
                    }`}
                  >
                    Days Basis
                  </button>
                  <button
                    type="button"
                    onClick={() => handleActiveCreditChange('creditUnitType', 'Hours')}
                    className={`py-2 px-3 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                      activeCredit.creditUnitType === 'Hours'
                        ? 'bg-white dark:bg-[#0B254E] text-[#006AC1] dark:text-[#00B2FF] shadow-xs'
                        : 'text-gray-500 dark:text-slate-400 hover:text-[#0A2A5E] dark:hover:text-white'
                    }`}
                  >
                    Hours Basis
                  </button>
                </div>
              </div>

              {/* Quantity to Credit */}
              <div>
                <label className="block text-xs font-bold text-[#0A2A5E] dark:text-slate-200 mb-1">
                  Quantity to Credit ({activeCredit.creditUnitType})
                </label>
                <input 
                  type="number" 
                  value={activeCredit.quantityToCredit}
                  step={activeCredit.creditUnitType === 'Hours' ? '0.5' : '1'}
                  min="0"
                  onChange={e => handleActiveCreditChange('quantityToCredit', Math.max(0, Number(e.target.value)))}
                  className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-[#07172C] border border-gray-200 dark:border-white/15 rounded-xl text-xs font-bold text-[#0A2A5E] dark:text-white focus:ring-2 focus:ring-[#00B2FF] focus:bg-white dark:focus:bg-[#091F3B] outline-none transition-all"
                  placeholder={activeCredit.creditUnitType === 'Days' ? 'e.g. 3' : 'e.g. 24'}
                />
              </div>

              {/* Shift Type Selector (Full-Time 8h vs Part-Time 4h) */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#0A2A5E] dark:text-slate-200">
                  Daily Shift Basis
                </label>
                <div className="grid grid-cols-2 gap-2 bg-gray-100/80 dark:bg-[#07172C] p-1 rounded-xl border border-gray-200 dark:border-white/10">
                  <button
                    type="button"
                    onClick={() => handleActiveCreditChange('shiftType', 'Full-Time')}
                    className={`py-2 px-3 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                      activeCredit.shiftType === 'Full-Time'
                        ? 'bg-white dark:bg-[#0B254E] text-[#006AC1] dark:text-[#00B2FF] shadow-xs'
                        : 'text-gray-500 dark:text-slate-400 hover:text-[#0A2A5E] dark:hover:text-white'
                    }`}
                  >
                    Full-Time (8 hrs/day)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleActiveCreditChange('shiftType', 'Part-Time')}
                    className={`py-2 px-3 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                      activeCredit.shiftType === 'Part-Time'
                        ? 'bg-white dark:bg-[#0B254E] text-[#006AC1] dark:text-[#00B2FF] shadow-xs'
                        : 'text-gray-500 dark:text-slate-400 hover:text-[#0A2A5E] dark:hover:text-white'
                    }`}
                  >
                    Part-Time (4 hrs/day)
                  </button>
                </div>
              </div>

              {/* Settlement Destination */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#0A2A5E] dark:text-slate-200">
                  Settlement Destination
                </label>
                <div className="grid grid-cols-2 gap-2 bg-gray-100/80 dark:bg-[#07172C] p-1 rounded-xl border border-gray-200 dark:border-white/10">
                  <button
                    type="button"
                    onClick={() => handleActiveCreditChange('destination', 'Invoice Credit Balance')}
                    className={`py-2 px-2 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                      activeCredit.destination === 'Invoice Credit Balance'
                        ? 'bg-white dark:bg-[#0B254E] text-[#006AC1] dark:text-[#00B2FF] shadow-xs'
                        : 'text-gray-500 dark:text-slate-400 hover:text-[#0A2A5E] dark:hover:text-white'
                    }`}
                  >
                    Invoice Credit Balance
                  </button>
                  <button
                    type="button"
                    onClick={() => handleActiveCreditChange('destination', 'Direct Refund (Cash)')}
                    className={`py-2 px-2 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                      activeCredit.destination === 'Direct Refund (Cash)'
                        ? 'bg-white dark:bg-[#0B254E] text-[#006AC1] dark:text-[#00B2FF] shadow-xs'
                        : 'text-gray-500 dark:text-slate-400 hover:text-[#0A2A5E] dark:hover:text-white'
                    }`}
                  >
                    Direct Refund (Cash)
                  </button>
                </div>
              </div>

              {/* Processing Fee (Optional) */}
              <div>
                <label className="block text-xs font-bold text-[#0A2A5E] dark:text-slate-200 mb-1">
                  Less: Processing / Admin Fee ($)
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400 dark:text-slate-500 text-xs font-bold">$</span>
                  <input 
                    type="number" 
                    value={activeCredit.processingFee || ''}
                    step="0.01"
                    onChange={e => handleActiveCreditChange('processingFee', Number(e.target.value))}
                    className="w-full pl-7 pr-3 py-2.5 bg-gray-50 dark:bg-[#07172C] border border-gray-200 dark:border-white/15 rounded-xl text-xs font-bold text-[#0A2A5E] dark:text-white focus:ring-2 focus:ring-[#00B2FF] focus:bg-white dark:focus:bg-[#091F3B] outline-none transition-all"
                    placeholder="0.00"
                  />
                </div>
              </div>

            </div>
          )}

          {/* 4. OVERTIME (OT) FORM */}
          {mode === 'overtime' && (
            <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-white/10">
              <h3 className="text-xs font-black uppercase tracking-wider text-[#006AC1] dark:text-[#00B2FF]">Overtime Parameters</h3>

              {/* Base Plan Rate */}
              <div>
                <label className="block text-xs font-bold text-[#0A2A5E] dark:text-slate-200 mb-1">
                  Base Plan Rate ($)
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400 dark:text-slate-500 text-xs font-bold">$</span>
                  <input 
                    type="number" 
                    value={overtime.basePlanRate || ''}
                    step="0.01"
                    onChange={e => handleOvertimeChange('basePlanRate', Number(e.target.value))}
                    className="w-full pl-7 pr-3 py-2.5 bg-gray-50 dark:bg-[#07172C] border border-gray-200 dark:border-white/15 rounded-xl text-xs font-bold text-[#0A2A5E] dark:text-white focus:ring-2 focus:ring-[#00B2FF] focus:bg-white dark:focus:bg-[#091F3B] outline-none transition-all"
                    placeholder="1495.00"
                  />
                </div>
              </div>

              {/* Shift Type */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#0A2A5E] dark:text-slate-200">
                  Base Shift Hours Basis
                </label>
                <div className="grid grid-cols-2 gap-2 bg-gray-100/80 dark:bg-[#07172C] p-1 rounded-xl border border-gray-200 dark:border-white/10">
                  <button
                    type="button"
                    onClick={() => handleOvertimeChange('shiftType', 'Full-Time')}
                    className={`py-2 px-3 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                      overtime.shiftType === 'Full-Time'
                        ? 'bg-white dark:bg-[#0B254E] text-[#006AC1] dark:text-[#00B2FF] shadow-xs'
                        : 'text-gray-500 dark:text-slate-400 hover:text-[#0A2A5E] dark:hover:text-white'
                    }`}
                  >
                    Full-Time (8 hrs/day)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOvertimeChange('shiftType', 'Part-Time')}
                    className={`py-2 px-3 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                      overtime.shiftType === 'Part-Time'
                        ? 'bg-white dark:bg-[#0B254E] text-[#006AC1] dark:text-[#00B2FF] shadow-xs'
                        : 'text-gray-500 dark:text-slate-400 hover:text-[#0A2A5E] dark:hover:text-white'
                    }`}
                  >
                    Part-Time (4 hrs/day)
                  </button>
                </div>
              </div>

              {/* Regular Overtime Section with Rate Dropdown (150% Standard vs 100% Legacy) */}
              <div className="p-3.5 bg-gray-50/80 dark:bg-[#07172C] rounded-2xl border border-gray-200/80 dark:border-white/10 space-y-3">
                {/* Rate Multiplier Dropdown */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-[#0A2A5E] dark:text-slate-200">
                      Regular Overtime Rate
                    </label>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border transition-colors ${
                      (overtime.regularOtRateType || '150%') === '100%'
                        ? 'text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/40'
                        : 'text-[#006AC1] dark:text-[#00B2FF] bg-[#F0F8FF] dark:bg-[#00B2FF]/15 border-[#7FA3D8]/30 dark:border-[#00B2FF]/30'
                    }`}>
                      {formatMoney(overtimeResult.regularOtRate)}/hr ({(overtime.regularOtRateType || '150%') === '100%' ? '1.0x Base' : '1.5x Multiplier'})
                    </span>
                  </div>
                  
                  <div className="relative">
                    <select
                      value={overtime.regularOtRateType || '150%'}
                      onChange={e => handleOvertimeChange('regularOtRateType', e.target.value as '150%' | '100%')}
                      className="w-full px-3.5 py-2.5 bg-white dark:bg-[#0B1E38] border border-gray-200 dark:border-white/15 rounded-xl text-xs font-bold text-[#0A2A5E] dark:text-white focus:ring-2 focus:ring-[#00B2FF] focus:border-[#00B2FF] outline-none transition-all cursor-pointer appearance-none pr-9 shadow-xs"
                    >
                      <option value="150%">150% — Standard Regular Overtime (1.5x Base Rate)</option>
                      <option value="100%">100% — Legacy Straight Overtime (1.0x Base Rate)</option>
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-400 pointer-events-none" />
                  </div>
                  <span className="text-[10px] text-gray-500 dark:text-slate-400 mt-1 block">
                    {(overtime.regularOtRateType || '150%') === '100%'
                      ? 'Legacy customer contract: Billed at 100% straight-time base rate without 1.5x premium.'
                      : 'Standard contract: Billed at 150% (1.5x base hourly rate).'}
                  </span>
                </div>

                {/* Regular OT Hours Input */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-[#0A2A5E] dark:text-slate-200">
                      Regular Overtime Hours
                    </label>
                    <span className="text-[10px] font-semibold text-gray-400 dark:text-slate-400">
                      {overtime.regularOtHours} hrs @ {formatMoney(overtimeResult.regularOtRate)}/hr = {formatMoney(overtimeResult.regularOtAmount)}
                    </span>
                  </div>
                  <input 
                    type="number" 
                    value={overtime.regularOtHours}
                    step="0.5"
                    min="0"
                    onChange={e => handleOvertimeChange('regularOtHours', Math.max(0, Number(e.target.value)))}
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-[#0B1E38] border border-gray-200 dark:border-white/15 rounded-xl text-xs font-bold text-[#0A2A5E] dark:text-white focus:ring-2 focus:ring-[#00B2FF] focus:border-[#00B2FF] outline-none transition-all shadow-xs"
                    placeholder="e.g. 5.0"
                  />
                </div>
              </div>

              {/* Holiday OT Hours (200%) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-[#0A2A5E] dark:text-slate-200">
                    Holiday Overtime Hours (200%)
                  </label>
                  <span className="text-[10px] font-bold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/40 px-2 py-0.5 rounded border border-purple-200 dark:border-purple-800/40">
                    2.0x Multiplier ({formatMoney(overtimeResult.holidayOtRate)}/hr)
                  </span>
                </div>
                <input 
                  type="number" 
                  value={overtime.holidayOtHours}
                  step="0.5"
                  min="0"
                  onChange={e => handleOvertimeChange('holidayOtHours', Math.max(0, Number(e.target.value)))}
                  className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-[#07172C] border border-gray-200 dark:border-white/15 rounded-xl text-xs font-bold text-[#0A2A5E] dark:text-white focus:ring-2 focus:ring-[#00B2FF] focus:bg-white dark:focus:bg-[#091F3B] outline-none transition-all"
                  placeholder="e.g. 2.0"
                />
              </div>

            </div>
          )}

        </motion.div>
      </aside>

      {/* RIGHT PANEL: Live Calculation Outputs */}
      <div className="lg:col-span-7 space-y-6">

        {/* Hero Settlement Status Card - Material 3 Expressive Tonal Surface */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.35, ease: [0.2, 0, 0, 1] }}
          className="bg-[#000000] text-white p-6 sm:p-7 rounded-3xl shadow-xl border border-gray-800 relative overflow-hidden"
        >
          {/* Ambient Glow */}
          <div 
            className="absolute inset-0 opacity-25 pointer-events-none"
            style={{
              background: 'radial-gradient(circle at 100% 0%, #00B2FF 0%, transparent 60%), radial-gradient(circle at 0% 100%, #006AC1 0%, transparent 60%)'
            }}
          />

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 relative z-10">
            <div className="space-y-2">
              <span className="px-3.5 py-1 rounded-full text-[11px] font-black bg-[#00B2FF] text-white uppercase tracking-wider inline-block shadow-xs">
                {heroBadge}
              </span>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white font-display">
                {heroHeading}
              </h2>
              <p className="text-xs sm:text-sm text-gray-400 font-medium">
                {mode === 'cancellation' && `Plan ${formatMoney(cancellation.paymentAmount)} (${workingDaysBase} working days) • Worked: ${cancelResult.workingDaysWorked} days`}
                {mode === 'proration' && `Old Plan: ${formatMoney(proration.currentPlanRate)} (${prorateResult.daysOnOldPlan} working days used) • Credit: ${formatMoney(prorateResult.remainingCredit)}`}
                {mode === 'active_credit' && `Plan ${formatMoney(activeCredit.planRatePaid)} (${workingDaysBase} working days) • Rate: ${formatMoney(activeCreditResult.effectiveUnitRate)}/${activeCredit.creditUnitType === 'Days' ? 'day' : 'hr'}`}
                {mode === 'overtime' && `Plan ${formatMoney(overtime.basePlanRate)} • Base Rate: ${formatMoney(overtimeResult.baseHourlyRate)}/hr (${overtime.shiftType})`}
              </p>
            </div>

            <motion.div 
              whileHover={{ scale: 1.03 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              className="bg-[#111122] border border-gray-800 rounded-2xl p-4 sm:p-5 min-w-[220px] sm:min-w-[240px] text-right shadow-inner w-full sm:w-auto"
            >
              <span className="text-[10px] sm:text-[11px] font-extrabold text-gray-400 uppercase tracking-wider block mb-1">
                {mode === 'cancellation' ? (isPositiveRefund ? 'FINAL REFUND' : 'FINAL BALANCE DUE') :
                 mode === 'proration' ? 'ONE-TIME INVOICE' :
                 mode === 'active_credit' ? 'TOTAL CREDIT DUE' :
                 'TOTAL OT DUE'}
              </span>
              <span className={`text-3xl sm:text-4xl font-black block tracking-tight font-display ${isPositiveRefund ? 'text-emerald-400' : 'text-[#00B2FF]'}`}>
                {formatMoney(heroAmount)}
              </span>
              <span className={`text-xs font-bold block mt-1 ${isPositiveRefund ? 'text-emerald-400' : 'text-[#00B2FF]'}`}>
                {heroSubtext}
              </span>
            </motion.div>
          </div>

          <div className="my-5 border-t border-gray-800/80"></div>

          {/* Timeline & Forward Memo */}
          <div className="space-y-3 relative z-10 text-xs">
            {mode === 'cancellation' && (
              <div className="bg-white/5 border border-white/10 p-3.5 rounded-2xl flex items-start gap-3">
                <Info size={16} className="text-[#00B2FF] shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-bold text-gray-200 block">Cancellation Coverage Timeline</span>
                  <p className="text-gray-400 leading-relaxed">
                    Coverage period ran <strong className="text-white">{formatFriendlyDate(cancellation.coverageStart)} to {formatFriendlyDate(cancelResult.calculatedCoverageEnd)}</strong> ({workingDaysBase} working days basis). Last working day was <strong className="text-[#00B2FF]">{formatFriendlyDate(cancelResult.effectiveCoverageEnd)}</strong> ({cancelResult.workingDaysWorked} working days worked, {cancelResult.unusedWorkingDays} unused).
                  </p>
                </div>
              </div>
            )}

            {mode === 'proration' && (
              <div className="bg-white/5 border border-white/10 p-3.5 rounded-2xl flex items-start gap-3">
                <Info size={16} className="text-[#00B2FF] shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-bold text-gray-200 block">Forward Coverage & Recurring Billing Schedule</span>
                  <p className="text-gray-400 leading-relaxed">
                    Going forward, full-time coverage runs <strong className="text-white">{formatFriendlyDate(prorateResult.newCoverageStart)} to {formatFriendlyDate(prorateResult.newCoverageEnd)}</strong>, and recurring billing of <strong className="text-[#00B2FF]">{formatMoney(proration.newPlanRate)}</strong> begins on <strong className="text-white">{formatFriendlyDate(prorateResult.recurringBillingDate)}</strong> (two days before coverage ends).
                  </p>
                </div>
              </div>
            )}

            {mode === 'active_credit' && (
              <div className="bg-white/5 border border-white/10 p-3.5 rounded-2xl flex items-start gap-3">
                <Info size={16} className="text-[#00B2FF] shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-bold text-gray-200 block">Active Account Credit Settlement Memo</span>
                  <p className="text-gray-400 leading-relaxed">
                    Derived rate is <strong className="text-white">{formatMoney(activeCreditResult.dailyRate)}/day</strong> (<strong className="text-white">{formatMoney(activeCreditResult.baseHourlyRate)}/hr</strong> based on {activeCredit.shiftType} {activeCreditResult.shiftHours} hrs/shift). Crediting <strong className="text-[#00B2FF]">{activeCreditResult.quantity} {activeCredit.creditUnitType}</strong> payable via <strong className="text-emerald-400">{activeCredit.destination}</strong>.
                  </p>
                </div>
              </div>
            )}

            {mode === 'overtime' && (
              <div className="bg-white/5 border border-white/10 p-3.5 rounded-2xl flex items-start gap-3">
                <Info size={16} className="text-[#00B2FF] shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-bold text-gray-200 block">Overtime Billing Computation Memo</span>
                  <p className="text-gray-400 leading-relaxed">
                    Base hourly rate is <strong className="text-white">{formatMoney(overtimeResult.baseHourlyRate)}/hr</strong> ({formatMoney(overtime.basePlanRate)} ÷ {workingDaysBase} days ÷ {overtimeResult.shiftHours} hrs). Regular OT ({(overtime.regularOtRateType || '150%') === '100%' ? '100% Legacy' : '150%'}): <strong className="text-[#00B2FF]">{overtimeResult.regularOtHours} hrs @ {formatMoney(overtimeResult.regularOtRate)}/hr</strong>. Holiday OT: <strong className="text-[#00B2FF]">{overtimeResult.holidayOtHours} hrs @ {formatMoney(overtimeResult.holidayOtRate)}/hr (200%)</strong>.
                  </p>
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Live KPI Summary Cards (Material 3 Expressive Hover Lift) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          
          {/* Card 1 */}
          <motion.div 
            whileHover={{ scale: 1.03, y: -2 }}
            transition={{ type: 'spring', stiffness: 400, damping: 22 }}
            className="bg-white dark:bg-[#0B1E38] p-4 rounded-2xl border border-gray-200/80 dark:border-white/10 shadow-xs cursor-default"
          >
            <span className="text-[10px] font-bold text-gray-400 dark:text-slate-400 uppercase tracking-wider block">
              {mode === 'cancellation' ? 'Daily Pro-Rate' :
               mode === 'proration' ? 'Daily Pro-Rate' :
               mode === 'active_credit' ? 'Derived Rate' :
               'Base Hourly Rate'}
            </span>
            <span className="text-lg font-black text-[#0A2A5E] dark:text-white block mt-1 font-display">
              {mode === 'cancellation' && formatMoney(cancelResult.dailyRate)}
              {mode === 'proration' && formatMoney(prorateResult.currentDailyRate)}
              {mode === 'active_credit' && `${formatMoney(activeCreditResult.effectiveUnitRate)}/${activeCredit.creditUnitType === 'Days' ? 'd' : 'h'}`}
              {mode === 'overtime' && `${formatMoney(overtimeResult.baseHourlyRate)}/hr`}
            </span>
            <span className="text-[10px] font-bold text-[#00B2FF] mt-0.5 block">
              {mode === 'overtime' ? `${overtime.shiftType} Basis` : `${workingDaysBase} Working Days`}
            </span>
          </motion.div>

          {/* Card 2 */}
          <motion.div 
            whileHover={{ scale: 1.03, y: -2 }}
            transition={{ type: 'spring', stiffness: 400, damping: 22 }}
            className="bg-white dark:bg-[#0B1E38] p-4 rounded-2xl border border-gray-200/80 dark:border-white/10 shadow-xs cursor-default"
          >
            <span className="text-[10px] font-bold text-gray-400 dark:text-slate-400 uppercase tracking-wider block">
              {mode === 'cancellation' ? 'Days Used / Worked' :
               mode === 'proration' ? 'Days on Old Plan' :
               mode === 'active_credit' ? 'Units Credited' :
               `Regular OT (${(overtime.regularOtRateType || '150%') === '100%' ? '100% 1.0x' : '150% 1.5x'})`}
            </span>
            <span className="text-lg font-black text-[#0A2A5E] dark:text-white block mt-1 font-display">
              {mode === 'cancellation' && `${cancelResult.workingDaysWorked} Days`}
              {mode === 'proration' && `${prorateResult.daysOnOldPlan} Days`}
              {mode === 'active_credit' && `${activeCreditResult.quantity} ${activeCredit.creditUnitType}`}
              {mode === 'overtime' && `${overtimeResult.regularOtHours} hrs`}
            </span>
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 block">
              {mode === 'overtime' ? formatMoney(overtimeResult.regularOtAmount) : 'Working Units'}
            </span>
          </motion.div>

          {/* Card 3 */}
          <motion.div 
            whileHover={{ scale: 1.03, y: -2 }}
            transition={{ type: 'spring', stiffness: 400, damping: 22 }}
            className="bg-white dark:bg-[#0B1E38] p-4 rounded-2xl border border-gray-200/80 dark:border-white/10 shadow-xs cursor-default"
          >
            <span className="text-[10px] font-bold text-gray-400 dark:text-slate-400 uppercase tracking-wider block">
              {mode === 'cancellation' ? 'Plan Used Cost' :
               mode === 'proration' ? 'Remaining Credit' :
               mode === 'active_credit' ? 'Gross Credit' :
               'Holiday OT (2.0x)'}
            </span>
            <span className="text-lg font-black text-[#0A2A5E] dark:text-white block mt-1 font-display">
              {mode === 'cancellation' && formatMoney(cancelResult.planUsedAmount)}
              {mode === 'proration' && formatMoney(prorateResult.remainingCredit)}
              {mode === 'active_credit' && formatMoney(activeCreditResult.grossCredit)}
              {mode === 'overtime' && `${overtimeResult.holidayOtHours} hrs`}
            </span>
            <span className="text-[10px] font-semibold text-gray-500 dark:text-slate-400 mt-0.5 block">
              {mode === 'cancellation' && 'Earned Revenue'}
              {mode === 'proration' && 'Applied to New Plan'}
              {mode === 'active_credit' && 'Before Deductions'}
              {mode === 'overtime' && formatMoney(overtimeResult.holidayOtAmount)}
            </span>
          </motion.div>

          {/* Card 4 */}
          <motion.div 
            whileHover={{ scale: 1.03, y: -2 }}
            transition={{ type: 'spring', stiffness: 400, damping: 22 }}
            className="bg-white dark:bg-[#0B1E38] p-4 rounded-2xl border border-gray-200/80 dark:border-white/10 shadow-xs cursor-default"
          >
            <span className="text-[10px] font-bold text-gray-400 dark:text-slate-400 uppercase tracking-wider block">
              {mode === 'cancellation' ? 'Final Refund' :
               mode === 'proration' ? 'One-Time Invoice' :
               mode === 'active_credit' ? 'Net Credit Due' :
               'Total OT Invoiced'}
            </span>
            <span className={`text-lg font-black block mt-1 font-display ${isPositiveRefund ? 'text-emerald-600 dark:text-emerald-400' : 'text-[#00B2FF]'}`}>
              {formatMoney(heroAmount)}
            </span>
            <span className={`text-[10px] font-bold mt-0.5 block ${isPositiveRefund ? 'text-emerald-600 dark:text-emerald-400' : 'text-[#006AC1] dark:text-[#00B2FF]'}`}>
              {mode === 'cancellation' ? 'Client Settlement' :
               mode === 'proration' ? 'Net Invoice Total' :
               mode === 'active_credit' ? activeCredit.destination :
               'Invoiced Amount'}
            </span>
          </motion.div>
        </div>

        {/* Itemized Audit Breakdown Table */}
        <div className="bg-white dark:bg-[#0B1E38] rounded-3xl p-6 sm:p-7 shadow-sm border border-gray-200/80 dark:border-white/10 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 dark:border-white/10 pb-3">
            <div>
              <h3 className="text-sm font-black text-[#0A2A5E] dark:text-white flex items-center gap-2 font-display">
                <ListChecks size={16} className="text-[#006AC1] dark:text-[#00B2FF]" />
                <span>Itemized Tie-Up Audit Breakdown</span>
              </h3>
              <p className="text-[11px] text-gray-500 dark:text-slate-400 font-medium mt-0.5">
                {mode === 'cancellation' && 'Mathematical computation for contract cancellation and refund settlement'}
                {mode === 'proration' && 'Mathematical computation for part-time to full-time plan proration'}
                {mode === 'active_credit' && 'Mathematical computation for active plan days/hours adjustment credit'}
                {mode === 'overtime' && 'Mathematical computation for regular (150%) and holiday (200%) billable overtime'}
              </p>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
              <motion.button
                whileHover={{ scale: 1.04, y: -1 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 400, damping: 22 }}
                onClick={() => exportCurrentCalculationToXLSX(mode, cancellation, proration, activeCredit, overtime)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700/50 text-emerald-800 dark:text-emerald-300 text-xs font-extrabold shadow-xs cursor-pointer"
                title="Export this settlement breakdown to Excel (.xlsx)"
              >
                <FileSpreadsheet size={14} className="text-emerald-600 dark:text-emerald-400" />
                <span>Export Audit (.xlsx)</span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.04, y: -1 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 400, damping: 22 }}
                onClick={handleCopyEmail}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-[#F0F8FF] dark:bg-[#00B2FF]/10 hover:bg-[#E1F2FE] dark:hover:bg-[#00B2FF]/20 border border-[#00B2FF]/40 text-[#006AC1] dark:text-[#00B2FF] text-xs font-extrabold shadow-xs cursor-pointer"
                title="Copy Client Tie-Up Email text"
              >
                {copied ? <Check size={14} className="text-emerald-600 dark:text-emerald-400" /> : <Copy size={14} className="text-[#00B2FF]" />}
                <span>{copied ? 'Copied Breakdown!' : 'Copy Tie-Up Message'}</span>
              </motion.button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-gray-50 dark:bg-[#07172C] border-b border-gray-200 dark:border-white/10 text-gray-400 dark:text-slate-400 uppercase text-[10px] font-bold">
                  <th className="py-2.5 px-3">Line Item / Calculation Step</th>
                  <th className="py-2.5 px-3 text-center">Metric / Basis</th>
                  <th className="py-2.5 px-3 text-right">Amount ($)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/10">
                
                {/* 1. CANCELLATION AUDIT ROWS */}
                {mode === 'cancellation' && (
                  <>
                    <tr className="hover:bg-gray-50/60 dark:hover:bg-white/5 transition-colors">
                      <td className="py-2.5 px-3">
                        <span className="font-semibold text-[#0A2A5E] dark:text-white block">1. Plan Paid Retainer</span>
                        <span className="text-[10px] text-gray-400 dark:text-slate-400 block">
                          Coverage period: {formatFriendlyDate(cancellation.coverageStart)} → {formatFriendlyDate(cancelResult.calculatedCoverageEnd)}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center font-bold text-gray-700 dark:text-slate-200">{workingDaysBase} Working Days</td>
                      <td className="py-2.5 px-3 text-right font-bold text-gray-700 dark:text-slate-200">{formatMoney(cancellation.paymentAmount)}</td>
                    </tr>
                    <tr className="hover:bg-gray-50/60 dark:hover:bg-white/5 transition-colors">
                      <td className="py-2.5 px-3">
                        <span className="font-semibold text-[#0A2A5E] dark:text-white block">2. Daily Pro-Rate</span>
                        <span className="text-[10px] text-gray-400 dark:text-slate-400 block">
                          {formatMoney(cancellation.paymentAmount)} ÷ {workingDaysBase} working days
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center text-gray-500 dark:text-slate-400">Per Working Day</td>
                      <td className="py-2.5 px-3 text-right font-bold text-gray-700 dark:text-slate-200">{formatMoney(cancelResult.dailyRate)}/day</td>
                    </tr>
                    <tr className="hover:bg-gray-50/60 dark:hover:bg-white/5 transition-colors">
                      <td className="py-2.5 px-3">
                        <span className="font-semibold text-[#0A2A5E] dark:text-white block">3. Last Working Day & Service Period</span>
                        <span className="text-[10px] text-gray-400 dark:text-slate-400 block">
                          {formatFriendlyDate(cancellation.coverageStart)} → {formatFriendlyDate(cancelResult.effectiveCoverageEnd)}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center font-bold text-[#006AC1] dark:text-[#00B2FF]">
                        {cancelResult.workingDaysWorked} Working Days
                      </td>
                      <td className="py-2.5 px-3 text-right font-semibold text-gray-700 dark:text-slate-200">
                        {formatFriendlyDate(cancelResult.effectiveCoverageEnd)}
                      </td>
                    </tr>
                    <tr className="bg-[#F0F8FF] dark:bg-[#00B2FF]/15 hover:bg-[#E4F3FE] dark:hover:bg-[#00B2FF]/20 transition-colors">
                      <td className="py-3 px-3">
                        <span className="font-bold text-[#006AC1] dark:text-[#00B2FF] block">
                          4. Plan Used (Earned Revenue)
                        </span>
                        <span className="text-[10px] text-gray-500 dark:text-slate-300 block">
                          {formatMoney(cancelResult.dailyRate)}/day × {cancelResult.workingDaysWorked} days worked
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center font-extrabold text-[#006AC1] dark:text-[#00B2FF]">
                        {cancelResult.workingDaysWorked} Days Used
                      </td>
                      <td className="py-3 px-3 text-right font-black text-[#0A2A5E] dark:text-white">
                        {formatMoney(cancelResult.planUsedAmount)}
                      </td>
                    </tr>
                    <tr className="hover:bg-gray-50/60 dark:hover:bg-white/5 transition-colors">
                      <td className="py-2.5 px-3">
                        <span className="font-semibold text-[#0A2A5E] dark:text-white block">5. Gross Unused Balance (Gross Refund)</span>
                        <span className="text-[10px] text-gray-400 dark:text-slate-400 block">
                          {formatMoney(cancellation.paymentAmount)} - {formatMoney(cancelResult.planUsedAmount)}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center text-gray-500 dark:text-slate-400">
                        {cancelResult.unusedWorkingDays} Unused Days
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-emerald-600 dark:text-emerald-400">
                        {formatMoney(cancelResult.grossRefund)}
                      </td>
                    </tr>

                    {cancellation.processingFee > 0 && (
                      <tr className="hover:bg-gray-50/60 dark:hover:bg-white/5 transition-colors">
                        <td className="py-2.5 px-3">
                          <span className="font-semibold text-[#0A2A5E] dark:text-white block">6. Less: Processing Fee</span>
                          <span className="text-[10px] text-gray-400 dark:text-slate-400 block">Merchant / transaction processing deduction</span>
                        </td>
                        <td className="py-2.5 px-3 text-center text-gray-500 dark:text-slate-400">Fee</td>
                        <td className="py-2.5 px-3 text-right font-bold text-rose-600 dark:text-rose-400">
                          -{formatMoney(cancellation.processingFee)}
                        </td>
                      </tr>
                    )}

                    {cancellation.creditsOnFile > 0 && (
                      <tr className="hover:bg-gray-50/60 dark:hover:bg-white/5 transition-colors">
                        <td className="py-2.5 px-3">
                          <span className="font-semibold text-[#0A2A5E] dark:text-white block">7. Applied Credits on File</span>
                          <span className="text-[10px] text-gray-400 dark:text-slate-400 block">Existing account credit balance</span>
                        </td>
                        <td className="py-2.5 px-3 text-center text-gray-500 dark:text-slate-400">Credit</td>
                        <td className="py-2.5 px-3 text-right font-bold text-emerald-600 dark:text-emerald-400">
                          -{formatMoney(cancellation.creditsOnFile)}
                        </td>
                      </tr>
                    )}

                    <tr className="font-extrabold text-sm border-t-2 border-gray-200 dark:border-white/15 bg-gray-50/50 dark:bg-[#07172C]">
                      <td className="py-3 px-3">
                        <span className="text-[#0A2A5E] dark:text-white uppercase block">
                          Final Refund Owed to Client
                        </span>
                        <span className="text-[10px] text-gray-400 dark:text-slate-400 font-normal block">
                          {formatMoney(cancelResult.grossRefund)} - {formatMoney(cancellation.processingFee || 0)}{cancellation.creditsOnFile > 0 ? ` - ${formatMoney(cancellation.creditsOnFile)}` : ''}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center text-[#00B2FF]">FINAL</td>
                      <td className="py-3 px-3 text-right text-base text-emerald-600 dark:text-emerald-400 font-black">
                        {formatMoney(cancelResult.refundToClient)}
                      </td>
                    </tr>
                  </>
                )}

                {/* 2. PRORATION AUDIT ROWS */}
                {mode === 'proration' && (
                  <>
                    <tr className="hover:bg-gray-50/60 dark:hover:bg-white/5 transition-colors">
                      <td className="py-2.5 px-3">
                        <span className="font-semibold text-[#0A2A5E] dark:text-white block">
                          1. Part-Time Plan Paid
                        </span>
                        <span className="text-[10px] text-gray-400 dark:text-slate-400 block">
                          Coverage: {formatFriendlyDate(proration.coverageStart)} → {formatFriendlyDate(prorateResult.calculatedCoverageEnd)} ({workingDaysBase} working days basis)
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center font-bold text-gray-700 dark:text-slate-200">{workingDaysBase} Working Days</td>
                      <td className="py-2.5 px-3 text-right font-bold text-gray-700 dark:text-slate-200">{formatMoney(proration.currentPlanRate)}</td>
                    </tr>
                    <tr className="hover:bg-gray-50/60 dark:hover:bg-white/5 transition-colors">
                      <td className="py-2.5 px-3">
                        <span className="font-semibold text-[#0A2A5E] dark:text-white block">
                          2. Part-Time Daily Pro-Rate
                        </span>
                        <span className="text-[10px] text-gray-400 dark:text-slate-400 block">
                          {formatMoney(proration.currentPlanRate)} ÷ {workingDaysBase} working days
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center text-gray-500 dark:text-slate-400">Per Working Day</td>
                      <td className="py-2.5 px-3 text-right font-bold text-gray-700 dark:text-slate-200">{formatMoney(prorateResult.currentDailyRate)}/day</td>
                    </tr>
                    <tr className="hover:bg-gray-50/60 dark:hover:bg-white/5 transition-colors">
                      <td className="py-2.5 px-3">
                        <span className="font-semibold text-[#0A2A5E] dark:text-white block">
                          3. Part-Time Used Period
                        </span>
                        <span className="text-[10px] text-gray-400 dark:text-slate-400 block">
                          {formatFriendlyDate(proration.coverageStart)} to {formatFriendlyDate(addDays(parseLocalDate(proration.planChangeEffectiveDate), -1))} ({prorateResult.daysOnOldPlan} working days)
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center font-bold text-[#006AC1] dark:text-[#00B2FF]">{prorateResult.daysOnOldPlan} Working Days</td>
                      <td className="py-2.5 px-3 text-right font-bold text-[#0A2A5E] dark:text-white">{formatMoney(prorateResult.oldPlanUsageValue)}</td>
                    </tr>
                    <tr className="bg-[#F0F8FF] dark:bg-[#00B2FF]/15 hover:bg-[#E4F3FE] dark:hover:bg-[#00B2FF]/20 transition-colors">
                      <td className="py-2.5 px-3 font-bold text-[#006AC1] dark:text-[#00B2FF]">
                        4. Remaining Part-Time Credit
                      </td>
                      <td className="py-2.5 px-3 text-center text-gray-500 dark:text-slate-300">
                        {formatMoney(proration.currentPlanRate)} - {formatMoney(prorateResult.oldPlanUsageValue)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-black text-emerald-600 dark:text-emerald-400">{formatMoney(prorateResult.remainingCredit)}</td>
                    </tr>
                    <tr className="hover:bg-gray-50/60 dark:hover:bg-white/5 transition-colors">
                      <td className="py-2.5 px-3 text-gray-700 dark:text-slate-200 font-semibold">
                        5. Full-Time Plan Charge
                      </td>
                      <td className="py-2.5 px-3 text-center text-gray-500 dark:text-slate-400">New Plan</td>
                      <td className="py-2.5 px-3 text-right font-bold text-gray-700 dark:text-slate-200">{formatMoney(proration.newPlanRate)}</td>
                    </tr>
                    <tr className="hover:bg-gray-50/60 dark:hover:bg-white/5 transition-colors">
                      <td className="py-2.5 px-3 text-gray-700 dark:text-slate-200 font-semibold">
                        6. Less: Remaining Part-Time Credit Applied
                      </td>
                      <td className="py-2.5 px-3 text-center text-emerald-600 dark:text-emerald-400 font-bold">Credit Offset</td>
                      <td className="py-2.5 px-3 text-right font-bold text-emerald-600 dark:text-emerald-400">-{formatMoney(prorateResult.remainingCredit)}</td>
                    </tr>
                    {proration.creditsOnFile > 0 && (
                      <tr className="hover:bg-gray-50/60 dark:hover:bg-white/5 transition-colors">
                        <td className="py-2.5 px-3 text-gray-500 dark:text-slate-400">7. Less: Applied Credits on File</td>
                        <td className="py-2.5 px-3 text-center text-gray-500 dark:text-slate-400">Credit Balance</td>
                        <td className="py-2.5 px-3 text-right font-bold text-emerald-600 dark:text-emerald-400">-{formatMoney(proration.creditsOnFile)}</td>
                      </tr>
                    )}
                    <tr className="font-extrabold text-sm border-t-2 border-gray-200 dark:border-white/15 bg-gray-50/50 dark:bg-[#07172C]">
                      <td className="py-3 px-3 text-[#0A2A5E] dark:text-white uppercase">
                        One-Time Invoice After Credit Applied
                      </td>
                      <td className="py-3 px-3 text-center text-[#00B2FF]">FINAL</td>
                      <td className="py-3 px-3 text-right text-base text-[#006AC1] dark:text-[#00B2FF] font-black">
                        {formatMoney(prorateResult.oneTimeInvoiceAmount)}
                      </td>
                    </tr>
                  </>
                )}

                {/* 3. ACTIVE CREDIT AUDIT ROWS */}
                {mode === 'active_credit' && (
                  <>
                    <tr className="hover:bg-gray-50/60 dark:hover:bg-white/5 transition-colors">
                      <td className="py-2.5 px-3">
                        <span className="font-semibold text-[#0A2A5E] dark:text-white block">1. Base Plan Rate & Cycle Basis</span>
                        <span className="text-[10px] text-gray-400 dark:text-slate-400 block">
                          {formatMoney(activeCredit.planRatePaid)} ÷ {workingDaysBase} working days in cycle
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center font-bold text-gray-700 dark:text-slate-200">{workingDaysBase} Working Days</td>
                      <td className="py-2.5 px-3 text-right font-bold text-gray-700 dark:text-slate-200">{formatMoney(activeCredit.planRatePaid)}</td>
                    </tr>
                    <tr className="hover:bg-gray-50/60 dark:hover:bg-white/5 transition-colors">
                      <td className="py-2.5 px-3">
                        <span className="font-semibold text-[#0A2A5E] dark:text-white block">2. Derived Daily Rate</span>
                        <span className="text-[10px] text-gray-400 dark:text-slate-400 block">
                          {formatMoney(activeCredit.planRatePaid)} ÷ {workingDaysBase} days
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center text-gray-500 dark:text-slate-400">Per Working Day</td>
                      <td className="py-2.5 px-3 text-right font-bold text-gray-700 dark:text-slate-200">{formatMoney(activeCreditResult.dailyRate)}/day</td>
                    </tr>
                    <tr className="hover:bg-gray-50/60 dark:hover:bg-white/5 transition-colors">
                      <td className="py-2.5 px-3">
                        <span className="font-semibold text-[#0A2A5E] dark:text-white block">3. Derived Base Hourly Rate</span>
                        <span className="text-[10px] text-gray-400 dark:text-slate-400 block">
                          {formatMoney(activeCreditResult.dailyRate)} ÷ {activeCreditResult.shiftHours} hrs ({activeCredit.shiftType})
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center font-bold text-[#006AC1] dark:text-[#00B2FF]">{activeCreditResult.shiftHours} hrs/shift</td>
                      <td className="py-2.5 px-3 text-right font-bold text-[#0A2A5E] dark:text-white">{formatMoney(activeCreditResult.baseHourlyRate)}/hr</td>
                    </tr>
                    <tr className="bg-[#F0F8FF] dark:bg-[#00B2FF]/15 hover:bg-[#E4F3FE] dark:hover:bg-[#00B2FF]/20 transition-colors">
                      <td className="py-2.5 px-3 font-bold text-[#006AC1] dark:text-[#00B2FF]">
                        4. Gross Adjustment Valuation
                      </td>
                      <td className="py-2.5 px-3 text-center text-[#006AC1] dark:text-[#00B2FF] font-bold">
                        {activeCreditResult.quantity} {activeCredit.creditUnitType} × {formatMoney(activeCreditResult.effectiveUnitRate)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-black text-emerald-600 dark:text-emerald-400">{formatMoney(activeCreditResult.grossCredit)}</td>
                    </tr>

                    {activeCreditResult.processingFee > 0 && (
                      <tr className="hover:bg-gray-50/60 dark:hover:bg-white/5 transition-colors">
                        <td className="py-2.5 px-3">
                          <span className="font-semibold text-[#0A2A5E] dark:text-white block">5. Less: Processing Fee</span>
                          <span className="text-[10px] text-gray-400 dark:text-slate-400 block">Merchant or administrative processing deduction</span>
                        </td>
                        <td className="py-2.5 px-3 text-center text-gray-500 dark:text-slate-400">Fee</td>
                        <td className="py-2.5 px-3 text-right font-bold text-rose-600 dark:text-rose-400">
                          -{formatMoney(activeCreditResult.processingFee)}
                        </td>
                      </tr>
                    )}

                    <tr className="font-extrabold text-sm border-t-2 border-gray-200 dark:border-white/15 bg-gray-50/50 dark:bg-[#07172C]">
                      <td className="py-3 px-3 text-[#0A2A5E] dark:text-white uppercase">
                        Final Credit / Refund Due
                        <span className="text-[10px] text-gray-400 dark:text-slate-400 font-normal block">
                          Destination: {activeCredit.destination}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center text-[#00B2FF]">FINAL</td>
                      <td className="py-3 px-3 text-right text-base text-emerald-600 dark:text-emerald-400 font-black">
                        {formatMoney(activeCreditResult.netCreditRefund)}
                      </td>
                    </tr>
                  </>
                )}

                {/* 4. OVERTIME AUDIT ROWS */}
                {mode === 'overtime' && (
                  <>
                    <tr className="hover:bg-gray-50/60 dark:hover:bg-white/5 transition-colors">
                      <td className="py-2.5 px-3">
                        <span className="font-semibold text-[#0A2A5E] dark:text-white block">1. Base Plan Rate & Shift Basis</span>
                        <span className="text-[10px] text-gray-400 dark:text-slate-400 block">
                          {formatMoney(overtime.basePlanRate)} ÷ {workingDaysBase} days ÷ {overtimeResult.shiftHours} hrs ({overtime.shiftType})
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center font-bold text-gray-700 dark:text-slate-200">{workingDaysBase} Days / {overtimeResult.shiftHours}h Shift</td>
                      <td className="py-2.5 px-3 text-right font-bold text-gray-700 dark:text-slate-200">{formatMoney(overtimeResult.baseHourlyRate)}/hr</td>
                    </tr>
                    <tr className="hover:bg-gray-50/60 dark:hover:bg-white/5 transition-colors">
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-[#0A2A5E] dark:text-white block">
                            2. Regular OT Hourly Rate ({(overtime.regularOtRateType || '150%') === '100%' ? '100% 1.0x Straight' : '150% 1.5x Multiplier'})
                          </span>
                          {(overtime.regularOtRateType || '150%') === '100%' && (
                            <span className="text-[9px] font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 px-1 py-0.2 rounded border border-amber-200 dark:border-amber-700/50">
                              Legacy Contract
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-gray-400 dark:text-slate-400 block">
                          {formatMoney(overtimeResult.baseHourlyRate)} × {overtimeResult.regularOtMultiplier} multiplier ({(overtime.regularOtRateType || '150%') === '100%' ? 'Straight-time base rate' : 'Time and a half'})
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center text-gray-500 dark:text-slate-400">
                        {(overtime.regularOtRateType || '150%') === '100%' ? '1.0x Base Rate' : '1.5x Multiplier'}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-gray-700 dark:text-slate-200">{formatMoney(overtimeResult.regularOtRate)}/hr</td>
                    </tr>
                    <tr className={`transition-colors ${(overtime.regularOtRateType || '150%') === '100%' ? 'bg-amber-50/40 dark:bg-amber-950/30 hover:bg-amber-100/40 dark:hover:bg-amber-950/50' : 'bg-[#F0F8FF] dark:bg-[#00B2FF]/15 hover:bg-[#E4F3FE] dark:hover:bg-[#00B2FF]/20'}`}>
                      <td className="py-2.5 px-3">
                        <span className={`font-bold block ${(overtime.regularOtRateType || '150%') === '100%' ? 'text-amber-900 dark:text-amber-200' : 'text-[#006AC1] dark:text-[#00B2FF]'}`}>
                          3. Regular Overtime Invoiced
                        </span>
                        <span className="text-[10px] text-gray-500 dark:text-slate-300 block">
                          {overtimeResult.regularOtHours} hrs logged × {formatMoney(overtimeResult.regularOtRate)}/hr
                        </span>
                      </td>
                      <td className={`py-2.5 px-3 text-center font-bold ${(overtime.regularOtRateType || '150%') === '100%' ? 'text-amber-800 dark:text-amber-300' : 'text-[#006AC1] dark:text-[#00B2FF]'}`}>
                        {overtimeResult.regularOtHours} {(overtime.regularOtRateType || '150%') === '100%' ? 'Straight' : 'Regular'} Hours
                      </td>
                      <td className="py-2.5 px-3 text-right font-black text-[#0A2A5E] dark:text-white">{formatMoney(overtimeResult.regularOtAmount)}</td>
                    </tr>
                    <tr className="hover:bg-gray-50/60 dark:hover:bg-white/5 transition-colors">
                      <td className="py-2.5 px-3">
                        <span className="font-semibold text-[#0A2A5E] dark:text-white block">4. Holiday OT Hourly Rate (200%)</span>
                        <span className="text-[10px] text-gray-400 dark:text-slate-400 block">
                          {formatMoney(overtimeResult.baseHourlyRate)} × 2.0 multiplier
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center text-gray-500 dark:text-slate-400">2.0x Multiplier</td>
                      <td className="py-2.5 px-3 text-right font-bold text-gray-700 dark:text-slate-200">{formatMoney(overtimeResult.holidayOtRate)}/hr</td>
                    </tr>
                    <tr className="bg-purple-50/60 dark:bg-purple-950/30 hover:bg-purple-100/60 dark:hover:bg-purple-950/50 transition-colors">
                      <td className="py-2.5 px-3">
                        <span className="font-bold text-purple-800 dark:text-purple-300 block">5. Holiday Overtime Invoiced</span>
                        <span className="text-[10px] text-gray-500 dark:text-slate-300 block">
                          {overtimeResult.holidayOtHours} hrs logged × {formatMoney(overtimeResult.holidayOtRate)}/hr
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center font-bold text-purple-700 dark:text-purple-300">{overtimeResult.holidayOtHours} Holiday Hours</td>
                      <td className="py-2.5 px-3 text-right font-black text-purple-900 dark:text-purple-200">{formatMoney(overtimeResult.holidayOtAmount)}</td>
                    </tr>
                    <tr className="font-extrabold text-sm border-t-2 border-gray-200 dark:border-white/15 bg-gray-50/50 dark:bg-[#07172C]">
                      <td className="py-3 px-3 text-[#0A2A5E] dark:text-white uppercase">
                        Final Overtime Amount Due
                        <span className="text-[10px] text-gray-400 dark:text-slate-400 font-normal block">
                          Regular OT ({formatMoney(overtimeResult.regularOtAmount)}) + Holiday OT ({formatMoney(overtimeResult.holidayOtAmount)})
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center text-[#00B2FF]">FINAL</td>
                      <td className="py-3 px-3 text-right text-base text-[#006AC1] dark:text-[#00B2FF] font-black">
                        {formatMoney(overtimeResult.totalOtAmountDue)}
                      </td>
                    </tr>
                  </>
                )}

              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
