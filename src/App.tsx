import React, { useState, useEffect } from 'react';
import { CalculationMode, CancellationInput, ProrationInput, ActiveCreditInput, OvertimeInput } from './types';
import { CalculatorView } from './components/CalculatorView';
import { ScenarioView } from './components/ScenarioView';
import { Footer } from './components/Footer';
import { TourGuideModal } from './components/TourGuideModal';
import { TaskAdjustLogoIcon } from './components/TaskAdjustLogo';
import { ThemeToggle } from './components/ThemeToggle';
import { useTheme } from './hooks/useTheme';
import { Calculator, TableProperties, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const DEFAULT_CANCELLATION: CancellationInput = {
  clientName: 'John Doe',
  paymentAmount: 1495,
  lastPaymentDate: '2026-07-08',
  coverageStart: '2026-07-09',
  billingCycleDays: 28,
  workingDaysInCycle: 20,
  lastWorkingDay: '2026-07-17',
  coverageEndMethod: 'Calculated',
  actualCoverageEndOverride: '2026-07-17',
  noticeStart: '2026-07-17',
  noticePeriodDays: 30,
  processingFee: 43.66,
  creditsOnFile: 0,
  calculationMethod: 'Working Days'
};

const DEFAULT_PRORATION: ProrationInput = {
  clientName: 'John Doe',
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
};

const DEFAULT_ACTIVE_CREDIT: ActiveCreditInput = {
  clientName: 'John Doe',
  billingCycleDays: 28,
  workingDaysInCycle: 20,
  planRatePaid: 1495,
  creditUnitType: 'Days',
  quantityToCredit: 3,
  shiftType: 'Full-Time',
  destination: 'Invoice Credit Balance',
  processingFee: 0
};

const DEFAULT_OVERTIME: OvertimeInput = {
  clientName: 'John Doe',
  billingCycleDays: 28,
  workingDaysInCycle: 20,
  basePlanRate: 1495,
  shiftType: 'Full-Time',
  regularOtRateType: '150%',
  regularOtHours: 5,
  holidayOtHours: 2
};

const DRAFT_STORAGE_KEY = 'taskadjust_draft_v1';

interface SavedDraft {
  mode?: CalculationMode;
  cancellation?: Partial<CancellationInput>;
  proration?: Partial<ProrationInput>;
  activeCredit?: Partial<ActiveCreditInput>;
  overtime?: Partial<OvertimeInput>;
}

function loadSavedDraft(): SavedDraft {
  try {
    const raw = localStorage.getItem(DRAFT_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export default function App() {
  const { theme, isDark, isAuto, preference, systemTheme, setThemePreference, toggleTheme, resetToSystem } = useTheme();
  const [isTourOpen, setIsTourOpen] = useState<boolean>(false);
  const [isFirstTimeTour, setIsFirstTimeTour] = useState<boolean>(false);
  const [tourOpenedFromTab, setTourOpenedFromTab] = useState<'calculator' | 'scenarios'>('calculator');
  const [activeTab, setActiveTab] = useState<'calculator' | 'scenarios'>('calculator');

  const initialDraft = loadSavedDraft();
  const [mode, setMode] = useState<CalculationMode>(
    initialDraft.mode && ['cancellation', 'proration', 'active_credit', 'overtime'].includes(initialDraft.mode)
      ? initialDraft.mode
      : 'cancellation'
  );
  
  const [cancellation, setCancellation] = useState<CancellationInput>({
    ...DEFAULT_CANCELLATION,
    ...(initialDraft.cancellation || {}),
  });
  const [proration, setProration] = useState<ProrationInput>({
    ...DEFAULT_PRORATION,
    ...(initialDraft.proration || {}),
  });
  const [activeCredit, setActiveCredit] = useState<ActiveCreditInput>({
    ...DEFAULT_ACTIVE_CREDIT,
    ...(initialDraft.activeCredit || {}),
  });
  const [overtime, setOvertime] = useState<OvertimeInput>({
    ...DEFAULT_OVERTIME,
    ...(initialDraft.overtime || {}),
  });

  // Persist active calculation draft across page refreshes
  useEffect(() => {
    try {
      const payload: SavedDraft = { mode, cancellation, proration, activeCredit, overtime };
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // Ignore storage quota or private-mode errors
    }
  }, [mode, cancellation, proration, activeCredit, overtime]);

  const handleResetMode = () => {
    if (mode === 'cancellation') setCancellation(DEFAULT_CANCELLATION);
    else if (mode === 'proration') setProration(DEFAULT_PRORATION);
    else if (mode === 'active_credit') setActiveCredit(DEFAULT_ACTIVE_CREDIT);
    else if (mode === 'overtime') setOvertime(DEFAULT_OVERTIME);
  };

  // Check if tour has ever been completed on initial mount
  useEffect(() => {
    const tourDone = localStorage.getItem('taskadjust_tour_completed');
    if (!tourDone) {
      setIsFirstTimeTour(true);
      setTourOpenedFromTab('calculator');
      setIsTourOpen(true);
    }
  }, []);

  const handleOpenTour = () => {
    setIsFirstTimeTour(false);
    setTourOpenedFromTab(activeTab);
    setIsTourOpen(true);
  };

  const tabs: Array<{ id: 'calculator' | 'scenarios'; label: string; icon: React.ComponentType<{ size?: number; className?: string }> }> = [
    { id: 'calculator', label: 'Calculator', icon: Calculator },
    { id: 'scenarios', label: 'Scenario Matrix', icon: TableProperties },
  ];

  return (
    <div className="min-h-screen flex flex-col justify-between w-full bg-[#F8F9FA] dark:bg-[#061325] text-[#0A2A5E] dark:text-[#E2E8F0] selection:bg-[#00B2FF]/20 transition-colors duration-200">
      
      {/* Interactive Tour Guide Modal */}
      <TourGuideModal 
        isOpen={isTourOpen} 
        onClose={() => setIsTourOpen(false)}
        onSelectTab={setActiveTab}
        initialTab={tourOpenedFromTab}
        isFirstTime={isFirstTimeTour}
      />

      {/* Modern Executive Header with TaskAdjust Branding & Controls */}
      <header className="bg-[#001736] dark:bg-[#030E1F] text-white border-b border-white/10 dark:border-white/5 sticky top-0 z-40 shadow-xl shadow-black/25 print:hidden transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-3 sm:gap-4">
          
          {/* Brand Logo & Title */}
          <motion.div 
            className="flex items-center min-w-0"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, ease: [0.2, 0, 0, 1] }}
          >
            {/* TaskAdjust Vector Logo with Sliders & Checklist glyph */}
            <div className="flex items-center shrink-0">
              <TaskAdjustLogoIcon className="w-9 h-6 sm:w-11 sm:h-8" />
            </div>

            {/* Vertical Divider Line */}
            <div className="h-7 sm:h-8 w-px bg-white/20 ml-2 mr-2.5 sm:ml-2.5 sm:mr-3.5 shrink-0" />

            {/* Brand Title and Operational Subtitle */}
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-black text-white tracking-tight font-display truncate">
                  TaskAdjust
                </h1>
                <span className="hidden sm:inline-block text-[10px] font-extrabold uppercase tracking-wider bg-[#06244C] border border-[#00B2FF]/40 text-[#00B2FF] px-2 py-0.5 rounded-full shadow-xs shrink-0">
                  FINANCIAL ENGINE
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-sky-200/80 font-medium tracking-wide truncate">
                Interactive Settlement, Refund &amp; Overtime Engine
              </p>
            </div>
          </motion.div>
          
          {/* Center Segmented Tab Switcher (Desktop) */}
          <div className="hidden md:flex bg-[#061D3D] dark:bg-[#041224] p-1.5 rounded-full border border-[#183B6D] dark:border-[#0F2D54] backdrop-blur-md shadow-inner relative items-center gap-1 shrink-0">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <motion.button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.94 }}
                  transition={{ type: 'spring', stiffness: 450, damping: 25 }}
                  className={`relative flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold cursor-pointer z-10 select-none transition-colors duration-150 ${
                    isActive 
                      ? 'text-white' 
                      : 'text-sky-200/80 hover:text-white'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeTabPill"
                      className="absolute inset-0 bg-[#0B2A58] border border-white/90 rounded-full shadow-md shadow-black/30"
                      style={{ zIndex: -1 }}
                      transition={{ type: 'spring', stiffness: 420, damping: 30 }}
                    />
                  )}
                  <Icon size={15} />
                  <span>{tab.label}</span>
                </motion.button>
              );
            })}
          </div>
          
          {/* Right Action Tools: Theme Toggle & Tour Guide */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            
            {/* Tactile Theme Toggle with 180deg Animated Sun/Moon & OS Auto Sync */}
            <ThemeToggle
              theme={theme}
              isDark={isDark}
              isAuto={isAuto}
              preference={preference}
              systemTheme={systemTheme}
              onToggle={toggleTheme}
              onResetToSystem={resetToSystem}
              onChange={setThemePreference}
            />

            {/* Tour Guide Pill Button */}
            <motion.button
              whileHover={{ scale: 1.03, y: -1 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              onClick={handleOpenTour}
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3.5 py-2 rounded-full bg-[#071F42] hover:bg-[#0C2B5B] border border-[#1E3E6F] text-white text-xs font-bold shadow-xs cursor-pointer transition-colors"
              title="Open Tour Guide"
              aria-label="Open Tour Guide"
            >
              <HelpCircle size={14} className="text-[#00B2FF]" />
              <span className="hidden sm:inline">Tour Guide</span>
            </motion.button>
          </div>
        </div>

        {/* Mobile Segmented Tab Switcher */}
        <div className="md:hidden border-t border-white/10 dark:border-white/5 px-4 py-2.5 bg-[#001430]/90 dark:bg-[#020B18]/90">
          <div className="grid grid-cols-2 gap-1 bg-[#061D3D] dark:bg-[#041224] p-1 rounded-full border border-[#183B6D] dark:border-[#0F2D54] shadow-inner">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative flex items-center justify-center gap-1.5 py-2 px-3 rounded-full text-xs font-bold cursor-pointer z-10 select-none transition-colors duration-150 ${
                    isActive
                      ? 'text-white'
                      : 'text-sky-200/80 hover:text-white'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeMobileTabPill"
                      className="absolute inset-0 bg-[#0B2A58] border border-white/80 rounded-full shadow-md shadow-black/30"
                      style={{ zIndex: -1 }}
                      transition={{ type: 'spring', stiffness: 420, damping: 30 }}
                    />
                  )}
                  <Icon size={14} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* Main Content Area with Material 3 Expressive Animated Page Transitions */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 print:p-0 print:m-0 print:max-w-none">
        <AnimatePresence mode="wait">
          {activeTab === 'calculator' && (
            <motion.div
              key="calculator"
              initial={{ opacity: 0, y: 14, scale: 0.985 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.985 }}
              transition={{ duration: 0.3, ease: [0.2, 0, 0, 1] }}
            >
              <CalculatorView 
                mode={mode} 
                setMode={setMode} 
                cancellation={cancellation} 
                setCancellation={setCancellation}
                proration={proration} 
                setProration={setProration}
                activeCredit={activeCredit}
                setActiveCredit={setActiveCredit}
                overtime={overtime}
                setOvertime={setOvertime}
                onResetMode={handleResetMode}
              />
            </motion.div>
          )}

          {activeTab === 'scenarios' && (
            <motion.div
              key="scenarios"
              initial={{ opacity: 0, y: 14, scale: 0.985 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.985 }}
              transition={{ duration: 0.3, ease: [0.2, 0, 0, 1] }}
              className="w-full flex justify-center"
            >
              <ScenarioView 
                setCancellation={setCancellation}
                setProration={setProration}
                setActiveCredit={setActiveCredit}
                setOvertime={setOvertime}
                setMode={setMode}
                navigateTab={setActiveTab}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Expressive Footer */}
      <Footer />
      
    </div>
  );
}
