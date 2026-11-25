import React, { useState, useRef, useEffect } from 'react';
import { CalculationMode, CancellationInput, ProrationInput, ActiveCreditInput, OvertimeInput, Scenario } from '../types';
import { 
  Play, 
  Download, 
  Upload, 
  CheckCircle2, 
  Tag, 
  Info, 
  RefreshCw, 
  UserX, 
  Layers,
  Search,
  Check,
  FileSpreadsheet,
  FileText,
  AlertCircle,
  ChevronDown,
  Coins,
  Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { exportScenariosToXLSX, exportScenariosToCSV, importScenariosFromFile } from '../utils/spreadsheet';

interface ScenarioViewProps {
  setCancellation: (c: CancellationInput) => void;
  setProration: (p: ProrationInput) => void;
  setActiveCredit: (a: ActiveCreditInput) => void;
  setOvertime: (o: OvertimeInput) => void;
  setMode: (m: CalculationMode) => void;
  navigateTab: (tab: 'calculator') => void;
}

const BUILT_IN_SCENARIOS: Scenario[] = [
  // ==========================================
  // PLAN PRORATION SCENARIOS
  // ==========================================
  {
    id: 'PRO-01',
    name: 'Part-Time ($1,295) to Full-Time ($2,295) Upgrade (28-Day Cycle)',
    category: 'Upgrade Proration',
    description: 'Part-time plan ($1,295 paid July 11) covering July 9 to Aug 5 (28-day cycle, 20 working days). Full-time ($2,295) effective July 28. 13 working days used ($841.75 @ $64.75/day), $453.25 part-time credit applied. One-time invoice: $1,841.75. Recurring billing starts Aug 22.',
    mode: 'proration',
    inputs: {
      clientName: 'Acme Corp (Benchmark Upgrade - 28 Days)',
      currentPlanRate: 1295,
      newPlanRate: 2295,
      lastPaymentDate: '2026-07-11',
      coverageStart: '2026-07-09',
      billingCycleDays: 28,
      workingDaysInCycle: 20,
      planChangeEffectiveDate: '2026-07-28',
      coverageEndMethod: 'Calculated',
      actualCoverageEndOverride: '',
      creditsOnFile: 0
    },
    expectedRefund: 0,
    expectedPayment: 1841.75
  },
  {
    id: 'PRO-01B',
    name: 'Part-Time ($1,295) to Full-Time ($2,295) Upgrade (30-Day Cycle)',
    category: 'Upgrade Proration',
    description: 'Part-time plan ($1,295 paid July 11) covering July 9 to Aug 7 (30-day cycle, 22 working days). Full-time ($2,295) effective July 28. 13 working days used ($765.18 @ $58.86/day), $529.82 credit applied. One-time invoice: $1,765.18. Recurring billing starts Aug 24.',
    mode: 'proration',
    inputs: {
      clientName: 'Acme Corp (Benchmark Upgrade - 30 Days)',
      currentPlanRate: 1295,
      newPlanRate: 2295,
      lastPaymentDate: '2026-07-11',
      coverageStart: '2026-07-09',
      billingCycleDays: 30,
      workingDaysInCycle: 22,
      planChangeEffectiveDate: '2026-07-28',
      coverageEndMethod: 'Calculated',
      actualCoverageEndOverride: '',
      creditsOnFile: 0
    },
    expectedRefund: 0,
    expectedPayment: 1765.18
  },
  {
    id: 'PRO-02',
    name: 'Starter ($995) to Dedicated Assistant ($1,995) Mid-Cycle Upgrade',
    category: 'Upgrade Proration',
    description: 'Starter plan ($995 paid Aug 1) covering Aug 3 to Aug 30 (28-day cycle, 20 working days). Upgrading to Dedicated Assistant ($1,995) on Aug 17. 10 working days on old plan ($497.50 @ $49.75/day), $497.50 credit applied. One-time invoice: $1,497.50.',
    mode: 'proration',
    inputs: {
      clientName: 'Beacon Real Estate',
      currentPlanRate: 995,
      newPlanRate: 1995,
      lastPaymentDate: '2026-08-01',
      coverageStart: '2026-08-03',
      billingCycleDays: 28,
      workingDaysInCycle: 20,
      planChangeEffectiveDate: '2026-08-17',
      coverageEndMethod: 'Calculated',
      actualCoverageEndOverride: '',
      creditsOnFile: 0
    },
    expectedRefund: 0,
    expectedPayment: 1497.50
  },
  {
    id: 'PRO-03',
    name: 'Early Cycle Upgrade with $150 Client Credit Offset',
    category: 'Upgrade Proration',
    description: 'Current plan $1,495 paid Sep 1, upgrading to Premium $2,895 on Sep 8 (5 working days used @ $74.75/day = $373.75). Remaining credit $1,121.25 plus $150 credit on file applied. One-time invoice: $1,623.75.',
    mode: 'proration',
    inputs: {
      clientName: 'Horizon Creative Studio',
      currentPlanRate: 1495,
      newPlanRate: 2895,
      lastPaymentDate: '2026-09-01',
      coverageStart: '2026-09-01',
      billingCycleDays: 28,
      workingDaysInCycle: 20,
      planChangeEffectiveDate: '2026-09-08',
      coverageEndMethod: 'Calculated',
      actualCoverageEndOverride: '',
      creditsOnFile: 150
    },
    expectedRefund: 0,
    expectedPayment: 1623.75
  },

  // ==========================================
  // CANCELLATION SCENARIOS
  // ==========================================
  {
    id: 'CAN-01',
    name: 'Mid-Cycle Termination with $43.66 Processing Fee (28-Day Cycle)',
    category: 'Cancellation Tie-Up',
    description: 'Plan $1,495 paid July 8, coverage July 9 to Aug 5 (28-day cycle, 20 working days). Last working day July 17 (7 working days worked @ $74.75/day = $523.25). Gross refund $971.75 less $43.66 processing fee = $928.09 final refund.',
    mode: 'cancellation',
    inputs: {
      clientName: 'Beta Logistics (Benchmark Cancellation - 28 Days)',
      paymentAmount: 1495,
      lastPaymentDate: '2026-07-08',
      coverageStart: '2026-07-09',
      billingCycleDays: 28,
      workingDaysInCycle: 20,
      lastWorkingDay: '2026-07-17',
      coverageEndMethod: 'Override',
      actualCoverageEndOverride: '2026-07-17',
      noticeStart: '2026-07-17',
      noticePeriodDays: 30,
      processingFee: 43.66,
      creditsOnFile: 0,
      calculationMethod: 'Working Days'
    },
    expectedRefund: 928.09,
    expectedPayment: 0
  },
  {
    id: 'CAN-01B',
    name: 'Mid-Cycle Termination with $43.66 Processing Fee (30-Day Cycle)',
    category: 'Cancellation Tie-Up',
    description: 'Plan $1,495 paid July 8, coverage July 9 to Aug 7 (30-day cycle, 22 working days). Last working day July 17 (7 working days worked @ $67.95/day = $475.65). Gross refund $1,019.35 less $43.66 processing fee = $975.69 final refund.',
    mode: 'cancellation',
    inputs: {
      clientName: 'Beta Logistics (Benchmark Cancellation - 30 Days)',
      paymentAmount: 1495,
      lastPaymentDate: '2026-07-08',
      coverageStart: '2026-07-09',
      billingCycleDays: 30,
      workingDaysInCycle: 22,
      lastWorkingDay: '2026-07-17',
      coverageEndMethod: 'Override',
      actualCoverageEndOverride: '2026-07-17',
      noticeStart: '2026-07-17',
      noticePeriodDays: 30,
      processingFee: 43.66,
      creditsOnFile: 0,
      calculationMethod: 'Working Days'
    },
    expectedRefund: 975.69,
    expectedPayment: 0
  },
  {
    id: 'CAN-02',
    name: '30-Day Notice Settlement - Bob ($2,195.00 Plan)',
    category: 'Cancellation Tie-Up',
    description: 'Monthly service fee $2,195.00 billed on the 13th (June 13 to July 12, 2025). 30-day cancellation notice given June 8, setting service end date to July 8. Daily rate $99.77 ($2,195 ÷ 22 business days). 18 business days used ($1,795.86 value), 3 unused business days (July 9–12). Refund due to client: $299.31.',
    mode: 'cancellation',
    inputs: {
      clientName: 'Bob (30-Day Notice Settlement)',
      paymentAmount: 2195,
      lastPaymentDate: '2025-06-13',
      coverageStart: '2025-06-13',
      billingCycleDays: 30,
      workingDaysInCycle: 22,
      lastWorkingDay: '2025-07-08',
      coverageEndMethod: 'Override',
      actualCoverageEndOverride: '2025-07-08',
      noticeStart: '2025-06-08',
      noticePeriodDays: 30,
      processingFee: 0,
      creditsOnFile: 0,
      calculationMethod: 'Working Days'
    },
    expectedRefund: 299.31,
    expectedPayment: 1895.69
  },

  // ==========================================
  // ACTIVE REFUND / ACCOUNT CREDIT SCENARIOS
  // ==========================================
  {
    id: 'ACT-01',
    name: '3-Day Service Credit on $1,495 Retainer (28-Day Cycle)',
    category: 'Active Account Credit',
    description: 'Active Full-Time plan ($1,495, 20 working days, $74.75/day). Crediting 3 days due to scheduled maintenance downtime. Net credit due: $224.25 applied directly to Invoice Credit Balance.',
    mode: 'active_credit',
    inputs: {
      clientName: 'Apex Health Systems',
      billingCycleDays: 28,
      workingDaysInCycle: 20,
      planRatePaid: 1495,
      creditUnitType: 'Days',
      quantityToCredit: 3,
      shiftType: 'Full-Time',
      destination: 'Invoice Credit Balance',
      processingFee: 0
    },
    expectedRefund: 224.25,
    expectedPayment: 0
  },
  {
    id: 'ACT-02',
    name: '16-Hour Direct Cash Refund ($2,295 Plan, 30-Day Cycle)',
    category: 'Active Account Credit',
    description: 'Full-Time plan ($2,295 paid, 22 working days = $104.32/day, $13.04/hr). Crediting 16 hours of unused support via Direct Cash Refund less $15.00 processing fee. Final refund: $193.64.',
    mode: 'active_credit',
    inputs: {
      clientName: 'Quantum Media Corp',
      billingCycleDays: 30,
      workingDaysInCycle: 22,
      planRatePaid: 2295,
      creditUnitType: 'Hours',
      quantityToCredit: 16,
      shiftType: 'Full-Time',
      destination: 'Direct Refund (Cash)',
      processingFee: 15.00
    },
    expectedRefund: 193.64,
    expectedPayment: 0
  },

  // ==========================================
  // OVERTIME (OT) SCENARIOS
  // ==========================================
  {
    id: 'OT-01',
    name: 'Standard Overtime Settlement (8 Regular OT + 4 Holiday OT)',
    category: 'Overtime Calculation',
    description: 'Base plan $1,495 (20 working days, 8h shift = $9.34/hr base rate). 8.0 Regular OT hours (1.5x = $14.02/hr = $112.13) and 4.0 Holiday OT hours (2.0x = $18.69/hr = $74.75). Total OT Invoiced: $186.88.',
    mode: 'overtime',
    inputs: {
      clientName: 'TechFlow Labs',
      billingCycleDays: 28,
      workingDaysInCycle: 20,
      basePlanRate: 1495,
      shiftType: 'Full-Time',
      regularOtRateType: '150%',
      regularOtHours: 8,
      holidayOtHours: 4
    },
    expectedRefund: 0,
    expectedPayment: 186.88
  },
  {
    id: 'OT-02',
    name: 'Part-Time Overtime Run (12 Regular OT Hours on $1,295 Plan)',
    category: 'Overtime Calculation',
    description: 'Part-time plan $1,295 (20 working days, 4h shift = $16.19/hr base rate). 12.0 Regular OT hours (1.5x = $24.28/hr = $291.38). Total OT Invoiced: $291.38.',
    mode: 'overtime',
    inputs: {
      clientName: 'Vanguard Retail Ventures',
      billingCycleDays: 28,
      workingDaysInCycle: 20,
      basePlanRate: 1295,
      shiftType: 'Part-Time',
      regularOtRateType: '150%',
      regularOtHours: 12,
      holidayOtHours: 0
    },
    expectedRefund: 0,
    expectedPayment: 291.38
  },
  {
    id: 'OT-03',
    name: 'Legacy Account Overtime (10.0 Hours @ 100% Straight Rate)',
    category: 'Overtime Calculation',
    description: 'Legacy client agreement billed at 100% straight-time base rate (1.0x). Base plan $1,495 (20 working days, 8h shift = $9.34/hr). 10.0 regular OT hours selected with 100% legacy rate = $93.40. Total OT Invoiced: $93.40.',
    mode: 'overtime',
    inputs: {
      clientName: 'Heritage Capital Partners',
      billingCycleDays: 28,
      workingDaysInCycle: 20,
      basePlanRate: 1495,
      shiftType: 'Full-Time',
      regularOtRateType: '100%',
      regularOtHours: 10,
      holidayOtHours: 0
    },
    expectedRefund: 0,
    expectedPayment: 93.40
  }
];

export function ScenarioView({ 
  setCancellation, 
  setProration, 
  setActiveCredit,
  setOvertime,
  setMode, 
  navigateTab 
}: ScenarioViewProps) {
  const [scenarios, setScenarios] = useState<Scenario[]>(BUILT_IN_SCENARIOS);
  const [activeFilter, setActiveFilter] = useState<'all' | 'proration' | 'cancellation' | 'active_credit' | 'overtime'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loadedId, setLoadedId] = useState<string | null>(null);
  const [importStatus, setImportStatus] = useState<{ type: 'success' | 'warning' | 'error'; message: string } | null>(null);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const exportDropdownRef = useRef<HTMLDivElement>(null);
  const statusTimerRef = useRef<number | null>(null);

  const showImportStatus = (type: 'success' | 'warning' | 'error', message: string) => {
    if (statusTimerRef.current) {
      window.clearTimeout(statusTimerRef.current);
    }
    setImportStatus({ type, message });
    statusTimerRef.current = window.setTimeout(() => {
      setImportStatus(null);
      statusTimerRef.current = null;
    }, 4500);
  };

  useEffect(() => {
    return () => {
      if (statusTimerRef.current) window.clearTimeout(statusTimerRef.current);
    };
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (exportDropdownRef.current && !exportDropdownRef.current.contains(event.target as Node)) {
        setIsExportMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  const handleLoad = (scenario: Scenario) => {
    setMode(scenario.mode);
    if (scenario.mode === 'cancellation') {
      setCancellation(scenario.inputs as CancellationInput);
    } else if (scenario.mode === 'proration') {
      setProration(scenario.inputs as ProrationInput);
    } else if (scenario.mode === 'active_credit') {
      setActiveCredit(scenario.inputs as ActiveCreditInput);
    } else if (scenario.mode === 'overtime') {
      setOvertime(scenario.inputs as OvertimeInput);
    }
    setLoadedId(scenario.id);
    navigateTab('calculator');
  };

  const filteredScenarios = scenarios.filter(s => {
    if (activeFilter !== 'all' && s.mode !== activeFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        s.name.toLowerCase().includes(q) ||
        (s.inputs.clientName || '').toLowerCase().includes(q) ||
        s.id.toLowerCase().includes(q) ||
        (s.description || '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  const prorationCount = scenarios.filter(s => s.mode === 'proration').length;
  const cancellationCount = scenarios.filter(s => s.mode === 'cancellation').length;
  const activeCreditCount = scenarios.filter(s => s.mode === 'active_credit').length;
  const overtimeCount = scenarios.filter(s => s.mode === 'overtime').length;

  const handleExportXLSX = () => {
    exportScenariosToXLSX(scenarios, 'TaskAdjust_Settlement_Scenarios.xlsx');
  };

  const handleExportCSV = () => {
    exportScenariosToCSV(scenarios, 'TaskAdjust_Settlement_Scenarios.csv');
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const imported = await importScenariosFromFile(file);
      if (imported.length > 0) {
        setScenarios(prev => [...prev, ...imported]);
        showImportStatus('success', `Successfully imported ${imported.length} scenarios from ${file.name}!`);
      } else {
        showImportStatus('warning', `No valid scenarios found in ${file.name}.`);
      }
    } catch (err) {
      console.error('Failed to import file', err);
      showImportStatus('error', 'Error importing file. Please ensure it is a valid .xlsx or .csv.');
    }

    if (fileInputRef.current) fileInputRef.current.value = '';
  };
  
  const formatMoney = (val: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      
      {/* Top Banner with XLSX & CSV Import/Export */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.2, 0, 0, 1] }}
        className="bg-gradient-to-r from-[#0A2A5E] to-[#006AC1] text-white p-6 sm:p-7 rounded-3xl shadow-sm flex flex-col lg:flex-row justify-between items-start lg:items-center gap-5 relative"
      >
        {/* Subtle decorative glow container (clipped) */}
        <div className="absolute inset-0 rounded-3xl overflow-hidden pointer-events-none">
          <div 
            className="absolute -right-20 -bottom-20 w-80 h-80 rounded-full opacity-20"
            style={{ background: 'radial-gradient(circle, #00B2FF 0%, transparent 70%)' }}
          />
        </div>

        <div className="space-y-1.5 relative z-10">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-black uppercase tracking-wider bg-white/20 text-white px-2.5 py-0.5 rounded-full">
              Benchmark Library
            </span>
            <span className="text-xs text-cyan-200 font-semibold">{scenarios.length} Scenarios &bull; 4 Settlement Modes</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight font-display">Preloaded Settlement Matrix</h2>
          <p className="text-xs text-gray-200 max-w-2xl leading-relaxed">
            Click <strong>Load Scenario</strong> on any scenario below to instantly populate the calculator with cancellation tie-ups, plan prorations, active account credits, or overtime runs.
          </p>
        </div>

        {/* Action Buttons: Import & Single Combined Export with Dropdown */}
        <div className="flex items-center gap-2 flex-wrap shrink-0 relative z-20">
          <input 
            type="file" 
            accept=".xlsx, .xls, .csv" 
            className="hidden" 
            ref={fileInputRef} 
            onChange={handleImport} 
          />
          <motion.button 
            whileHover={{ scale: 1.03, y: -1 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 22 }}
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3.5 py-2.5 bg-white/15 hover:bg-white/25 text-white border border-white/20 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
            title="Import scenarios from Excel (.xlsx) or CSV"
          >
            <Upload size={14} />
            <span>Import (.xlsx / .csv)</span>
          </motion.button>
          
          {/* Combined Export Button with Dropdown */}
          <div className="relative" ref={exportDropdownRef}>
            <motion.button 
              whileHover={{ scale: 1.03, y: -1 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 400, damping: 22 }}
              onClick={() => setIsExportMenuOpen(prev => !prev)}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-white text-[#0A2A5E] hover:bg-gray-50 rounded-xl text-xs font-black transition-all shadow-xs cursor-pointer"
              title="Export scenarios as XLSX or CSV"
              aria-expanded={isExportMenuOpen}
              aria-haspopup="true"
            >
              <Download size={14} className="text-[#006AC1]" />
              <span>Export</span>
              <ChevronDown size={14} className={`text-gray-500 transition-transform duration-200 ${isExportMenuOpen ? 'rotate-180' : ''}`} />
            </motion.button>

            <AnimatePresence>
              {isExportMenuOpen && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95, y: 5 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 5 }}
                  transition={{ duration: 0.15, ease: [0.2, 0, 0, 1] }}
                  className="absolute right-0 mt-2 w-56 bg-white dark:bg-[#091E3A] rounded-2xl shadow-2xl border border-gray-200/90 dark:border-white/15 p-1.5 z-50 select-none"
                >
                  <div className="px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-gray-400 dark:text-slate-400">
                    Select Export Format
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => {
                      handleExportXLSX();
                      setIsExportMenuOpen(false);
                    }}
                    className="w-full px-3 py-2.5 flex items-center gap-2.5 text-left rounded-xl text-xs font-bold text-[#0A2A5E] dark:text-slate-100 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-900 dark:hover:text-emerald-300 transition-colors cursor-pointer"
                  >
                    <div className="p-1.5 bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 rounded-lg shrink-0">
                      <FileSpreadsheet size={15} />
                    </div>
                    <div>
                      <div className="font-extrabold text-gray-900 dark:text-white">XLSX</div>
                      <div className="text-[10px] font-normal text-gray-500 dark:text-slate-400">Excel Workbook (.xlsx)</div>
                    </div>
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => {
                      handleExportCSV();
                      setIsExportMenuOpen(false);
                    }}
                    className="w-full px-3 py-2.5 flex items-center gap-2.5 text-left rounded-xl text-xs font-bold text-[#0A2A5E] dark:text-slate-100 hover:bg-sky-50 dark:hover:bg-sky-950/40 hover:text-[#006AC1] dark:hover:text-sky-300 transition-colors cursor-pointer"
                  >
                    <div className="p-1.5 bg-sky-100 dark:bg-sky-900/60 text-[#006AC1] dark:text-sky-300 rounded-lg shrink-0">
                      <FileText size={15} />
                    </div>
                    <div>
                      <div className="font-extrabold text-gray-900 dark:text-white">CSV</div>
                      <div className="text-[10px] font-normal text-gray-500 dark:text-slate-400">Comma-Separated (.csv)</div>
                    </div>
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>

      {/* Import Notification Toast */}
      <AnimatePresence>
        {importStatus && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            role="status"
            className={`px-4 py-3 rounded-2xl text-xs font-bold flex items-center justify-between gap-3 border shadow-xs ${
              importStatus.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-700/60 text-emerald-800 dark:text-emerald-200'
                : importStatus.type === 'warning'
                ? 'bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-700/60 text-amber-800 dark:text-amber-200'
                : 'bg-rose-50 dark:bg-rose-950/50 border-rose-200 dark:border-rose-700/60 text-rose-800 dark:text-rose-200'
            }`}
          >
            <div className="flex items-center gap-2">
              {importStatus.type === 'success' ? (
                <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle
                  size={16}
                  className={`shrink-0 ${
                    importStatus.type === 'warning'
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-rose-600 dark:text-rose-400'
                  }`}
                />
              )}
              <span>{importStatus.message}</span>
            </div>
            <button
              onClick={() => setImportStatus(null)}
              className={`text-xs font-bold cursor-pointer shrink-0 transition-colors ${
                importStatus.type === 'success'
                  ? 'text-emerald-700 dark:text-emerald-300 hover:text-emerald-950 dark:hover:text-white'
                  : importStatus.type === 'warning'
                  ? 'text-amber-700 dark:text-amber-300 hover:text-amber-950 dark:hover:text-white'
                  : 'text-rose-700 dark:text-rose-300 hover:text-rose-950 dark:hover:text-white'
              }`}
            >
              Dismiss
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filter Tabs & Search Bar */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.05, ease: [0.2, 0, 0, 1] }}
        className="bg-white dark:bg-[#0B1E38] p-4 rounded-3xl border border-gray-200/80 dark:border-white/10 shadow-xs flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4"
      >
        
        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 relative">
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 22 }}
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeFilter === 'all'
                ? 'bg-[#0A2A5E] dark:bg-[#00B2FF] text-white dark:text-[#001736] shadow-xs'
                : 'bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 text-gray-600 dark:text-slate-300 border border-gray-200 dark:border-white/10'
            }`}
          >
            <Layers size={13} />
            <span>All ({scenarios.length})</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 22 }}
            onClick={() => setActiveFilter('proration')}
            className={`px-3 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeFilter === 'proration'
                ? 'bg-[#00B2FF] text-white shadow-xs'
                : 'bg-[#F0F8FF] dark:bg-[#00B2FF]/10 hover:bg-[#E1F2FE] dark:hover:bg-[#00B2FF]/20 text-[#006AC1] dark:text-[#00B2FF] border border-[#7FA3D8]/30 dark:border-[#00B2FF]/30'
            }`}
          >
            <RefreshCw size={13} />
            <span>Proration ({prorationCount})</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 22 }}
            onClick={() => setActiveFilter('cancellation')}
            className={`px-3 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeFilter === 'cancellation'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-amber-50 dark:bg-amber-950/30 hover:bg-amber-100 dark:hover:bg-amber-950/50 text-amber-900 dark:text-amber-300 border border-amber-200 dark:border-amber-800/50'
            }`}
          >
            <UserX size={13} />
            <span>Cancellation ({cancellationCount})</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 22 }}
            onClick={() => setActiveFilter('active_credit')}
            className={`px-3 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeFilter === 'active_credit'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-emerald-50 dark:bg-emerald-950/30 hover:bg-emerald-100 dark:hover:bg-emerald-950/50 text-emerald-900 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50'
            }`}
          >
            <Coins size={13} />
            <span>Active Credit ({activeCreditCount})</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 22 }}
            onClick={() => setActiveFilter('overtime')}
            className={`px-3 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeFilter === 'overtime'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'bg-purple-50 dark:bg-purple-950/30 hover:bg-purple-100 dark:hover:bg-purple-950/50 text-purple-900 dark:text-purple-300 border border-purple-200 dark:border-purple-800/50'
            }`}
          >
            <Clock size={13} />
            <span>Overtime ({overtimeCount})</span>
          </motion.button>
        </div>

        {/* Search Box */}
        <div className="relative min-w-[220px]">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search scenarios or clients..."
            className="w-full pl-9 pr-3 py-2 bg-gray-50 dark:bg-[#07172C] border border-gray-200 dark:border-white/15 rounded-xl text-xs font-semibold text-[#0A2A5E] dark:text-white focus:bg-white dark:focus:bg-[#091F3B] focus:border-[#00B2FF] focus:ring-2 focus:ring-[#00B2FF]/20 outline-none transition-all"
          />
        </div>

      </motion.div>

      {/* Scenarios Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredScenarios.map((s, index) => {
          const isCancel = s.mode === 'cancellation';
          const isProration = s.mode === 'proration';
          const isActiveCredit = s.mode === 'active_credit';
          const isOvertime = s.mode === 'overtime';
          const isLoaded = loadedId === s.id;
          const isPrimary = s.id === 'PRO-01' || s.id === 'CAN-01' || s.id === 'ACT-01' || s.id === 'OT-01';

          let categoryBadgeColor = 'bg-[#F0F8FF] dark:bg-[#00B2FF]/15 text-[#006AC1] dark:text-[#00B2FF] border border-[#7FA3D8]/30 dark:border-[#00B2FF]/30';
          if (isCancel) categoryBadgeColor = 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-700/50';
          if (isActiveCredit) categoryBadgeColor = 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700/50';
          if (isOvertime) categoryBadgeColor = 'bg-purple-50 dark:bg-purple-950/40 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-700/50';

          return (
              <motion.div 
              key={s.id} 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.04, ease: [0.2, 0, 0, 1] }}
              whileHover={{ y: -3, scale: 1.01 }}
              className={`bg-white dark:bg-[#0B1E38] rounded-3xl p-6 border transition-all duration-200 shadow-xs hover:shadow-md flex flex-col justify-between relative overflow-hidden ${
                isPrimary 
                  ? 'border-[#00B2FF]/40 ring-1 ring-[#00B2FF]/20' 
                  : isCancel ? 'border-amber-200/60 dark:border-amber-800/40' : 'border-gray-200/80 dark:border-white/10'
              }`}
            >
              {isPrimary && (
                <div className="absolute top-0 right-0">
                  <span className="bg-[#00B2FF] text-white text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-bl-xl shadow-xs inline-block">
                    Primary Benchmark
                  </span>
                </div>
              )}

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[11px] font-bold text-gray-400 dark:text-slate-400 bg-gray-100 dark:bg-white/10 px-2 py-0.5 rounded-md">{s.id}</span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${categoryBadgeColor}`}>
                    {s.category}
                  </span>
                </div>

                <h3 className="text-base font-black text-[#0A2A5E] dark:text-white leading-snug font-display">
                  {s.name}
                </h3>

                {s.description && (
                  <p className="text-xs text-gray-600 dark:text-slate-300 leading-relaxed bg-gray-50/80 dark:bg-[#07172C] p-3 rounded-2xl border border-gray-100 dark:border-white/10 font-medium">
                    {s.description}
                  </p>
                )}

                {/* Key Metrics Pill Grid */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div className="bg-gray-50 dark:bg-[#07172C] p-2.5 rounded-xl border border-gray-100 dark:border-white/10">
                    <span className="text-[10px] font-bold text-gray-400 dark:text-slate-400 uppercase block">Expected Result</span>
                    <span className={`text-sm font-black block mt-0.5 font-display ${
                      isCancel || isActiveCredit ? 'text-emerald-600 dark:text-emerald-400' : 'text-[#006AC1] dark:text-[#00B2FF]'
                    }`}>
                      {isCancel && `${formatMoney(s.expectedRefund || 0)} Refund`}
                      {isProration && `${formatMoney(s.expectedPayment || 0)} Invoice`}
                      {isActiveCredit && `${formatMoney(s.expectedRefund || 0)} Credit`}
                      {isOvertime && `${formatMoney(s.expectedPayment || 0)} OT Due`}
                    </span>
                  </div>

                  <div className="bg-gray-50 dark:bg-[#07172C] p-2.5 rounded-xl border border-gray-100 dark:border-white/10">
                    <span className="text-[10px] font-bold text-gray-400 dark:text-slate-400 uppercase block">Basis & Cycle</span>
                    <span className="text-xs font-bold text-gray-700 dark:text-slate-200 block mt-0.5">
                      {s.inputs.workingDaysInCycle || 20} Work Days &bull; {s.inputs.billingCycleDays || 28}d
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-5 mt-4 border-t border-gray-100 dark:border-white/10 flex items-center justify-between">
                <span className="text-[11px] font-semibold text-gray-500 dark:text-slate-400">
                  Client: <strong className="text-[#0A2A5E] dark:text-white">{s.inputs.clientName}</strong>
                </span>
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.94 }}
                  transition={{ type: 'spring', stiffness: 450, damping: 25 }}
                  onClick={() => handleLoad(s)}
                  className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-xs ${
                    isLoaded 
                      ? 'bg-emerald-600 text-white'
                      : isPrimary 
                        ? 'bg-[#00B2FF] hover:bg-[#009ee3] text-white' 
                        : 'bg-[#0A2A5E] dark:bg-[#00B2FF] hover:bg-[#061d44] dark:hover:bg-[#009ee3] text-white dark:text-[#001736]'
                  }`}
                >
                  {isLoaded ? <Check size={13} /> : <Play size={13} />}
                  <span>{isLoaded ? 'Loaded!' : 'Load Scenario'}</span>
                </motion.button>
              </div>

            </motion.div>
          );
        })}
      </div>

      {filteredScenarios.length === 0 && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white dark:bg-[#0B1E38] rounded-3xl p-12 text-center border border-gray-200 dark:border-white/10"
        >
          <p className="text-sm font-semibold text-gray-500 dark:text-slate-400">No scenarios matched "{searchQuery}".</p>
          <button
            onClick={() => { setSearchQuery(''); setActiveFilter('all'); }}
            className="mt-3 px-4 py-2 bg-[#F0F8FF] dark:bg-[#00B2FF]/10 text-[#006AC1] dark:text-[#00B2FF] text-xs font-bold rounded-xl border border-[#7FA3D8]/30 dark:border-[#00B2FF]/30 cursor-pointer"
          >
            Clear Filters
          </button>
        </motion.div>
      )}

      {/* Bottom Information Card */}
      <div className="bg-white dark:bg-[#0B1E38] p-5 rounded-3xl border border-gray-200/80 dark:border-white/10 flex items-center gap-3 text-xs text-gray-500 dark:text-slate-400 shadow-xs">
        <Info size={18} className="text-[#00B2FF] shrink-0" />
        <p>
          <strong>Spreadsheet Integration:</strong> The <strong>Export</strong> menu allows downloading multi-sheet Microsoft Excel workbooks (<strong>XLSX</strong>) with dedicated tabs or plain text format (<strong>CSV</strong>). <strong>Import (.xlsx / .csv)</strong> allows loading custom scenarios seamlessly.
        </p>
      </div>

    </div>
  );
}
