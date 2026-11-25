import React, { useState, useEffect } from 'react';
import { 
  X, 
  ChevronRight, 
  ChevronLeft, 
  CheckCircle2, 
  Calculator, 
  FileText, 
  TableProperties, 
  ShieldCheck, 
  HelpCircle, 
  Sparkles, 
  DollarSign, 
  Calendar, 
  ListChecks, 
  Printer, 
  RotateCcw,
  BookOpen,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence, LayoutGroup } from 'motion/react';

interface TourGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTab?: (tab: 'calculator' | 'scenarios') => void;
  initialTab?: 'calculator' | 'scenarios';
  isFirstTime?: boolean;
}

interface TourStep {
  title: string;
  category: string;
  icon: React.ElementType;
  badgeColor: string;
  summary: string;
  points: {
    heading: string;
    description: string;
  }[];
  exampleBox?: {
    title: string;
    content: string;
  };
  recommendedTab?: 'calculator' | 'scenarios';
}

const TOUR_STEPS: TourStep[] = [
  {
    title: 'Welcome to TaskAdjust',
    category: 'System Overview',
    icon: ShieldCheck,
    badgeColor: 'bg-[#00B2FF]/10 dark:bg-[#00B2FF]/20 text-[#006AC1] dark:text-[#38C5FF] border-[#00B2FF]/30',
    summary: 'The TaskAdjust operations tool designed for high-precision client billing tie-ups, cancellations, and plan adjustments.',
    points: [
      {
        heading: 'Internal Operations Standard',
        description: 'Eliminates manual spreadsheet formulas and ensures 100% mathematical auditability across all client accounts.'
      },
      {
        heading: 'Global Business Day Architecture',
        description: 'Calculates standard Monday–Friday business days globally for client and VA schedules worldwide.'
      },
      {
        heading: 'Integrated Workflow',
        description: 'Seamlessly transition from raw parameter calculation to a live itemized audit, scenario testing, and Excel export.'
      }
    ],
    recommendedTab: 'calculator'
  },
  {
    title: 'Four Operational Settlement Modes',
    category: 'Settlement Engines',
    icon: Calculator,
    badgeColor: 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700/50',
    summary: 'Switch effortlessly between four specialized calculation modules at the top of the settlement parameters panel.',
    points: [
      {
        heading: 'Cancellation Mode (Termination Tie-Up)',
        description: 'Computes earned revenue, unused coverage, and determines whether a Direct Client Refund or Balance Due applies.'
      },
      {
        heading: 'Plan Proration Mode (Upgrade / Downgrade)',
        description: 'Prorates unused portion of old plan coverage and credits it toward the new plan one-time invoice.'
      },
      {
        heading: 'Active Refund / Account Credit Mode',
        description: 'Computes day-based or hour-based account credits (with 8h Full-Time / 4h Part-Time shift rates) for invoice balance or cash refund.'
      },
      {
        heading: 'Overtime (OT) Calculation Mode',
        description: 'Derives base hourly rate from plan and calculates 100% legacy straight overtime (1.0x), regular overtime (150%), and holiday overtime (200%).'
      }
    ],
    exampleBox: {
      title: 'Pro-Tip',
      content: 'Toggle between any of the 4 settlement modes in the control panel at any time.'
    },
    recommendedTab: 'calculator'
  },
  {
    title: 'Billing Cycles & Linked Working Days Basis',
    category: 'Core Formula',
    icon: Calendar,
    badgeColor: 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-700/50',
    summary: 'Daily pro-rates form the foundation for all financial calculations in the settlement engine.',
    points: [
      {
        heading: '28-Day Cycle (20 Working Days)',
        description: 'Standard 4-week retainer cycle automatically pairs with 20 working days basis.'
      },
      {
        heading: '30-Day Cycle (22 Working Days)',
        description: 'Standard calendar month cycle automatically pairs with standard 22 working days basis.'
      },
      {
        heading: 'Prepaid Retainer vs. Existing Credits',
        description: 'Payment Amount is the current cycle retainer used to compute daily rates. "Credits on File" represents separate historical account ledger balances applied as a final deduction.'
      }
    ],
    exampleBox: {
      title: 'Formula Reference',
      content: 'Daily Pro-Rate = Plan Payment ÷ Working Days Basis ($2,195.00 ÷ 22 working days = $99.77/day)'
    },
    recommendedTab: 'calculator'
  },
  {
    title: 'Coverage End Methods & Notice Windows',
    category: 'Timeline Control',
    icon: DollarSign,
    badgeColor: 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-700/50',
    summary: 'Control how service termination dates and notice periods interact.',
    points: [
      {
        heading: 'Calculated Coverage End',
        description: 'Automatically calculates the natural end date of the paid cycle (Coverage Start + Billing Cycle Days - 1).'
      },
      {
        heading: 'Manual Override Stop Date',
        description: 'Specify an earlier hard stop date if service ended before the paid cycle finished. The system automatically computes unused paid business days for refund.'
      },
      {
        heading: 'Notice Period & Business Days',
        description: 'Defines the contractual notice window (e.g., 30 days) and counts valid Monday–Friday business days.'
      }
    ],
    recommendedTab: 'calculator'
  },
  {
    title: 'Live Itemized Tie-Up Audit Breakdown',
    category: 'Audit & Transparency',
    icon: ListChecks,
    badgeColor: 'bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-700/50',
    summary: 'Review every financial movement line-by-line with complete transparency for client billing reviews.',
    points: [
      {
        heading: 'Detailed Line Items',
        description: 'Displays the paid retainer, daily pro-rate base, effective coverage span, notice business days, and net adjustment subtotal.'
      },
      {
        heading: 'Dynamic Explanations',
        description: 'The audit table dynamically generates clear explanations tailored to the selected calculation method and override status.'
      },
      {
        heading: 'Immediate Visual Feedback',
        description: 'Highlights Client Refunds in emerald green and Balances Due in orange for rapid at-a-glance auditing.'
      }
    ],
    recommendedTab: 'calculator'
  },
  {
    title: 'Scenario Matrix Benchmarking & Export',
    category: 'Quality Assurance',
    icon: TableProperties,
    badgeColor: 'bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-700/50',
    summary: 'Verify calculations against verified operational benchmarks or test custom scenarios.',
    points: [
      {
        heading: 'Built-in Test Cases',
        description: 'Includes preloaded benchmark cases like Bob ($2,195 with 30-day notice and 3 unused days refund) and Acme Corp ($1,295 to $2,295 Upgrade).'
      },
      {
        heading: 'One-Click Load',
        description: 'Click "Load Scenario" to immediately populate all calculator parameters and inspect the result.'
      },
      {
        heading: 'Excel / CSV Multi-Sheet Export',
        description: 'Export clean audit spreadsheets directly from the Scenario Matrix tab anytime.'
      }
    ],
    recommendedTab: 'scenarios'
  }
];

// Material 3 Expressive shared-axis slide variants
const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 36 : -36,
    opacity: 0,
    scale: 0.98,
    filter: 'blur(3px)',
  }),
  center: {
    x: 0,
    opacity: 1,
    scale: 1,
    filter: 'blur(0px)',
    transition: {
      x: { type: 'spring', stiffness: 340, damping: 28 },
      opacity: { duration: 0.28, ease: [0.2, 0, 0, 1] },
      scale: { type: 'spring', stiffness: 340, damping: 28 },
      filter: { duration: 0.2 },
      staggerChildren: 0.05,
      delayChildren: 0.04,
    }
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -36 : 36,
    opacity: 0,
    scale: 0.98,
    filter: 'blur(3px)',
    transition: {
      x: { type: 'spring', stiffness: 340, damping: 28 },
      opacity: { duration: 0.2, ease: [0.3, 0, 0.8, 0.15] },
      scale: { type: 'spring', stiffness: 340, damping: 28 },
      filter: { duration: 0.15 }
    }
  })
};

// Expressive point item cascade
const pointVariants = {
  enter: {
    opacity: 0,
    y: 10,
    scale: 0.97,
  },
  center: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 26,
    }
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: {
      duration: 0.15,
      ease: [0.2, 0, 0, 1]
    }
  }
};

export function TourGuideModal({ isOpen, onClose, onSelectTab, initialTab, isFirstTime }: TourGuideModalProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [direction, setDirection] = useState<number>(1);

  // Reset step index when opened fresh
  useEffect(() => {
    if (isOpen) {
      setCurrentStepIndex(0);
      setDirection(1);
    }
  }, [isOpen]);

  // Keyboard navigation (Arrow keys & Escape)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleFinish();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentStepIndex]);

  const currentStep = TOUR_STEPS[currentStepIndex];
  const isFirst = currentStepIndex === 0;
  const isLast = currentStepIndex === TOUR_STEPS.length - 1;

  const returnToDestinationTab = () => {
    if (onSelectTab) {
      if (isFirstTime) {
        onSelectTab('calculator');
      } else if (initialTab) {
        onSelectTab(initialTab);
      }
    }
  };

  const handleNext = () => {
    if (isLast) {
      localStorage.setItem('taskadjust_tour_completed', 'true');
      returnToDestinationTab();
      onClose();
    } else {
      setDirection(1);
      setCurrentStepIndex(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (!isFirst) {
      setDirection(-1);
      setCurrentStepIndex(prev => prev - 1);
    }
  };

  const handleJumpToStep = (index: number) => {
    if (index === currentStepIndex) return;
    setDirection(index > currentStepIndex ? 1 : -1);
    setCurrentStepIndex(index);
  };

  const handleFinish = () => {
    localStorage.setItem('taskadjust_tour_completed', 'true');
    returnToDestinationTab();
    onClose();
  };

  const StepIcon = currentStep.icon;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-hidden select-none">
          
          {/* Material 3 Expressive Scrim / Backdrop with Blur */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.2, 0, 0, 1] }}
            onClick={handleFinish}
            className="absolute inset-0 bg-[#0A2A5E]/60 backdrop-blur-xs"
          />

          {/* Material 3 Expressive Surface / Modal Container */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.92, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 12 }}
            transition={{ 
              type: 'spring', 
              stiffness: 380, 
              damping: 28 
            }}
            className="relative bg-white dark:bg-[#07172C] w-full max-w-2xl rounded-3xl shadow-2xl shadow-black/40 border border-[#7FA3D8]/30 dark:border-white/10 overflow-hidden flex flex-col max-h-[92vh] z-10"
            role="dialog"
            aria-modal="true"
          >
            {/* Top Header Bar */}
            <div className="px-6 py-4 border-b border-gray-100 dark:border-white/10 bg-[#F0F8FF]/50 dark:bg-[#091E38]/60 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <motion.span 
                  whileHover={{ scale: 1.08, rotate: 5 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 18 }}
                  className="p-1.5 bg-white dark:bg-[#0B254E] rounded-lg border border-gray-200 dark:border-white/10 text-[#006AC1] dark:text-[#00B2FF] shadow-xs flex items-center justify-center cursor-default"
                >
                  <BookOpen size={16} className="text-[#00B2FF]" />
                </motion.span>
                <div>
                  <span className="text-[10px] sm:text-[11px] font-extrabold text-[#006AC1] dark:text-[#00B2FF] uppercase tracking-wider block">
                    Internal Operations Tour
                  </span>
                  <div className="flex items-center gap-1 text-xs font-semibold text-gray-600 dark:text-slate-300 mt-0.5 leading-tight">
                    <span>Step</span>
                    <AnimatePresence mode="wait" initial={false}>
                      <motion.span
                        key={currentStepIndex}
                        initial={{ opacity: 0, y: direction > 0 ? 5 : -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: direction > 0 ? -5 : 5 }}
                        transition={{ duration: 0.18, ease: [0.2, 0, 0, 1] }}
                        className="inline-block min-w-[0.75rem] text-center text-[#0A2A5E] dark:text-white font-extrabold tabular-nums"
                      >
                        {currentStepIndex + 1}
                      </motion.span>
                    </AnimatePresence>
                    <span>of {TOUR_STEPS.length}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 sm:gap-2">
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                  onClick={handleFinish}
                  className="text-xs font-semibold text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 px-2.5 py-1 rounded-lg hover:bg-gray-100/80 dark:hover:bg-white/10 transition-colors cursor-pointer"
                >
                  Skip Tour
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 22 }}
                  onClick={handleFinish}
                  className="p-1.5 text-gray-400 hover:text-[#0A2A5E] dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-colors cursor-pointer"
                  aria-label="Close tour"
                >
                  <X size={18} />
                </motion.button>
              </div>
            </div>

            {/* Expressive Linear Progress Indicator with Spring Physics */}
            <div className="w-full bg-gray-100 dark:bg-white/10 h-1.5 overflow-hidden">
              <motion.div 
                className="bg-gradient-to-r from-[#00B2FF] via-[#0088E0] to-[#006AC1] h-1.5 rounded-r-full"
                initial={false}
                animate={{ width: `${((currentStepIndex + 1) / TOUR_STEPS.length) * 100}%` }}
                transition={{ type: 'spring', stiffness: 220, damping: 26 }}
              />
            </div>

            {/* Step Body Animated Container */}
            <div className="relative p-6 sm:p-8 overflow-y-auto flex-1 min-h-[340px]">
              <AnimatePresence custom={direction} mode="wait" initial={false}>
                <motion.div
                  key={currentStepIndex}
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  className="space-y-6"
                >
                  {/* Step Header */}
                  <div className="flex items-start gap-4">
                    <motion.div 
                      initial={{ scale: 0.8, rotate: direction > 0 ? 8 : -8 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 22 }}
                      className="p-3.5 bg-gradient-to-br from-[#00B2FF]/15 to-[#006AC1]/15 text-[#006AC1] dark:text-[#00B2FF] rounded-2xl border border-[#00B2FF]/30 shrink-0 shadow-xs"
                    >
                      <StepIcon size={24} className="text-[#006AC1] dark:text-[#00B2FF]" />
                    </motion.div>
                    
                    <div className="space-y-1">
                      <motion.span 
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.05, duration: 0.25, ease: [0.2, 0, 0, 1] }}
                        className={`inline-block text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${currentStep.badgeColor}`}
                      >
                        {currentStep.category}
                      </motion.span>
                      <motion.h2 
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.08, duration: 0.28, ease: [0.2, 0, 0, 1] }}
                        className="text-lg sm:text-xl font-black text-[#0A2A5E] dark:text-white tracking-tight font-display"
                      >
                        {currentStep.title}
                      </motion.h2>
                      <motion.p 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.12, duration: 0.3 }}
                        className="text-xs sm:text-sm text-gray-600 dark:text-slate-300 font-medium leading-relaxed"
                      >
                        {currentStep.summary}
                      </motion.p>
                    </div>
                  </div>

                  {/* Detailed Points Cascading with Expressive Motion */}
                  <div className="space-y-3 pt-2 border-t border-gray-100 dark:border-white/10">
                    {currentStep.points.map((pt, idx) => (
                      <motion.div 
                        key={idx} 
                        variants={pointVariants}
                        whileHover={{ scale: 1.012, y: -1 }}
                        transition={{ type: 'spring', stiffness: 450, damping: 25 }}
                        className="bg-gray-50/90 dark:bg-[#091E3A] p-3.5 sm:p-4 rounded-2xl border border-gray-100 dark:border-white/10 flex items-start gap-3 hover:bg-gray-50 dark:hover:bg-[#0D294D] transition-colors shadow-2xs"
                      >
                        <div className="p-1 bg-white dark:bg-[#06172E] rounded-full border border-gray-200 dark:border-white/15 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5 shadow-xs">
                          <CheckCircle2 size={13} />
                        </div>
                        <div className="space-y-0.5">
                          <h3 className="text-xs sm:text-sm font-bold text-[#0A2A5E] dark:text-white">
                            {pt.heading}
                          </h3>
                          <p className="text-xs text-gray-600 dark:text-slate-300 leading-relaxed font-normal">
                            {pt.description}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  {/* Example Box (Optional) */}
                  {currentStep.exampleBox && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.96, y: 8 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      transition={{ delay: 0.18, type: 'spring', stiffness: 350, damping: 25 }}
                      whileHover={{ scale: 1.01 }}
                      className="bg-[#F0F8FF] dark:bg-[#00B2FF]/10 p-4 rounded-2xl border border-[#7FA3D8]/30 dark:border-[#00B2FF]/30 flex items-start gap-3 shadow-2xs"
                    >
                      <Sparkles size={16} className="text-[#00B2FF] shrink-0 mt-0.5 animate-pulse" />
                      <div className="text-xs">
                        <span className="font-bold text-[#006AC1] dark:text-[#00B2FF] block">{currentStep.exampleBox.title}</span>
                        <p className="text-gray-600 dark:text-slate-300 font-medium mt-0.5">{currentStep.exampleBox.content}</p>
                      </div>
                    </motion.div>
                  )}

                </motion.div>
              </AnimatePresence>
            </div>

            {/* Step Dots & Footer Controls */}
            <div className="px-6 py-4 bg-gray-50/90 dark:bg-[#091E38]/90 border-t border-gray-100 dark:border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
              
              {/* Expressive Morphing Step Indicators (Liquid Pills) */}
              <div className="flex items-center gap-1.5">
                <LayoutGroup id="tour-step-indicators">
                  {TOUR_STEPS.map((step, idx) => {
                    const isActive = idx === currentStepIndex;
                    const isPassed = idx < currentStepIndex;

                    return (
                      <motion.button
                        key={idx}
                        onClick={() => handleJumpToStep(idx)}
                        aria-label={`Go to step ${idx + 1}: ${step.title}`}
                        whileHover={{ scale: 1.2 }}
                        whileTap={{ scale: 0.9 }}
                        transition={{ type: 'spring', stiffness: 450, damping: 25 }}
                        className="relative h-6 flex items-center justify-center p-1 rounded-full cursor-pointer group"
                      >
                        {isActive ? (
                          <motion.div 
                            layoutId="activePillIndicator"
                            className="w-7 h-2.5 bg-gradient-to-r from-[#00B2FF] to-[#006AC1] rounded-full shadow-xs shadow-[#00B2FF]/40"
                            transition={{ type: 'spring', stiffness: 420, damping: 30 }}
                          />
                        ) : (
                          <div 
                            className={`h-2 rounded-full transition-all duration-200 ${
                              isPassed 
                                ? 'w-2 bg-[#7FA3D8]/70 group-hover:bg-[#00B2FF]' 
                                : 'w-2 bg-gray-300 dark:bg-gray-600 group-hover:bg-gray-400'
                            }`}
                          />
                        )}
                      </motion.button>
                    );
                  })}
                </LayoutGroup>
              </div>

              {/* Expressive Prev / Next Buttons */}
              <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
                <AnimatePresence>
                  {!isFirst && (
                    <motion.button
                      initial={{ opacity: 0, scale: 0.88, x: 10 }}
                      animate={{ opacity: 1, scale: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.88, x: 10 }}
                      whileHover={{ scale: 1.03, x: -2 }}
                      whileTap={{ scale: 0.95 }}
                      transition={{ type: 'spring', stiffness: 450, damping: 25 }}
                      onClick={handlePrev}
                      className="px-4 py-2.5 bg-white dark:bg-[#0B254E] border border-gray-200 dark:border-white/15 hover:bg-gray-50 dark:hover:bg-[#0F3266] text-gray-700 dark:text-slate-200 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      <ChevronLeft size={16} className="text-gray-500 dark:text-slate-300 transition-transform group-hover:-translate-x-0.5" />
                      <span>Back</span>
                    </motion.button>
                  )}
                </AnimatePresence>

                <motion.button
                  whileHover={{ scale: 1.03, y: -1 }}
                  whileTap={{ scale: 0.95, y: 1 }}
                  transition={{ type: 'spring', stiffness: 450, damping: 25 }}
                  onClick={handleNext}
                  className={`px-5 py-2.5 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-md transition-colors flex items-center gap-2 cursor-pointer ml-auto sm:ml-0 ${
                    isLast 
                      ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/25' 
                      : 'bg-[#00B2FF] hover:bg-[#009ee0] shadow-[#00B2FF]/25'
                  }`}
                >
                  <AnimatePresence mode="wait" initial={false}>
                    {isLast ? (
                      <motion.div
                        key="get-started"
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.15 }}
                        className="flex items-center gap-1.5"
                      >
                        <span>Get Started</span>
                        <CheckCircle2 size={15} />
                      </motion.div>
                    ) : (
                      <motion.div
                        key="next-step"
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.15 }}
                        className="flex items-center gap-1.5"
                      >
                        <span>Next Step</span>
                        <ChevronRight size={15} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.button>
              </div>

            </div>

          </motion.div>

        </div>
      )}
    </AnimatePresence>
  );
}

