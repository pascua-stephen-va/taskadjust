import React from 'react';
import { ShieldCheck, Layers, FileSpreadsheet, Sparkles, CheckCircle2 } from 'lucide-react';
import { TaskAdjustLogoIcon } from './TaskAdjustLogo';

export function Footer() {
  return (
    <footer className="mt-14 no-print relative overflow-hidden bg-[#001736] text-white print:hidden border-t border-white/10">
      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Brand & Mission Card */}
          <div className="lg:col-span-6 space-y-4">
            <div className="bg-white/5 backdrop-blur-md p-6 rounded-3xl border border-white/10 shadow-lg space-y-4">
              <div className="flex items-center gap-3">
                <TaskAdjustLogoIcon className="w-10 h-8" />
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-black tracking-tight text-white leading-none font-display">
                      TaskAdjust
                    </span>
                    <span className="text-[9px] font-extrabold uppercase tracking-wider bg-[#00B2FF]/20 text-[#00B2FF] border border-[#00B2FF]/40 px-1.5 py-0.5 rounded">
                      FINANCIAL ENGINE
                    </span>
                  </div>
                  <span className="text-[10px] font-medium tracking-wide text-sky-200/80 leading-none mt-1">
                    Interactive Settlement, Refund &amp; Overtime Engine
                  </span>
                </div>
              </div>

              <p className="text-xs text-sky-100/80 leading-relaxed">
                TaskAdjust provides precision client settlement mathematics, calendar cycle proration, and audit-ready ledger calculations. Built to ensure transparent, error-free financial reconciliations.
              </p>
              
              <div className="pt-3 border-t border-white/10 flex items-center gap-4 text-xs text-sky-200/90 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="text-emerald-300 font-semibold">Audit-Ready Accuracy</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <FileSpreadsheet className="w-4 h-4 text-[#00B2FF] shrink-0" />
                  <span>Excel &amp; CSV Multi-Sheet Export</span>
                </div>
              </div>
            </div>
          </div>

          {/* Engine Architecture & Specification Card */}
          <div className="lg:col-span-6 space-y-4">
            <div className="bg-white/5 border border-white/10 p-6 rounded-3xl backdrop-blur-md space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#00B2FF] bg-[#00B2FF]/15 px-2.5 py-1 rounded-full border border-[#00B2FF]/30">
                  CORE MODULES
                </span>
                <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
                  <CheckCircle2 size={12} />
                  Operational Standard
                </span>
              </div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Precision Adjustment Modules
              </h3>
              <p className="text-xs text-sky-100/75 leading-relaxed">
                Supports standard Monday–Friday business day proration, custom contract overrides, 28/30-day billing cycle reconciliation, multi-tier overtime tracking, and instant client invoice generation.
              </p>
              <div className="pt-2 flex flex-wrap gap-2 text-[11px] text-sky-200">
                <span className="px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10">28 &amp; 30-Day Cycles</span>
                <span className="px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10">Contract Cancellation</span>
                <span className="px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10">Plan Proration</span>
                <span className="px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10">Active Account Credits</span>
                <span className="px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10">Overtime Runs (1.0x, 1.5x, 2.0x)</span>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Copyright Bar */}
        <div className="mt-10 pt-6 border-t border-white/10 text-center space-y-1 text-xs text-sky-200/80">
          <p>&copy; 2026 TaskAdjust. All Rights Reserved.</p>
          <p className="text-sky-300/60 text-[11px]">Financial Operations &amp; Client Settlement Engine.</p>
        </div>
      </div>
    </footer>
  );
}
