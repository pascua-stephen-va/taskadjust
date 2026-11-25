import React from 'react';

interface TaskAdjustLogoProps {
  className?: string;
  variant?: 'light' | 'dark';
}

/**
 * TaskAdjust Vector Icon
 * Modern geometric adjustment sliders with integrated task checkmark glyph
 */
export function TaskAdjustLogoIcon({ className = "w-10 h-7" }: { className?: string }) {
  return (
    <svg 
      viewBox="0 0 44 36" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="TaskAdjust Logo"
    >
      {/* Background Rounded Shield / Tile */}
      <rect x="1" y="1" width="42" height="34" rx="8" fill="url(#taGradient)" stroke="#00B2FF" strokeOpacity="0.4" strokeWidth="1.5" />

      {/* Top Track & Node */}
      <line x1="8" y1="12" x2="26" y2="12" stroke="#00B2FF" strokeWidth="2.2" strokeLinecap="round" strokeOpacity="0.5" />
      <circle cx="20" cy="12" r="3.2" fill="#00B2FF" />
      <circle cx="20" cy="12" r="1.4" fill="#FFFFFF" />

      {/* Bottom Track & Node */}
      <line x1="8" y1="22" x2="26" y2="22" stroke="#00B2FF" strokeWidth="2.2" strokeLinecap="round" strokeOpacity="0.5" />
      <circle cx="14" cy="22" r="3.2" fill="#00E599" />
      <circle cx="14" cy="22" r="1.4" fill="#FFFFFF" />

      {/* Right Task Checklist Column with dynamic checkmark */}
      <rect x="29" y="8" width="6" height="18" rx="3" fill="#00B2FF" fillOpacity="0.18" />
      <path 
        d="M26 18.5L28.8 21.2L34.5 14.5" 
        stroke="#FFFFFF" 
        strokeWidth="2.2" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
      />

      <defs>
        <linearGradient id="taGradient" x1="2" y1="2" x2="42" y2="34" gradientUnits="userSpaceOnUse">
          <stop stopColor="#082552" />
          <stop offset="1" stopColor="#02142E" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/**
 * TaskAdjust Full Wordmark + Icon Lockup
 */
export function TaskAdjustFullLogo({ 
  className = "", 
  variant = "light" 
}: TaskAdjustLogoProps) {
  const isLight = variant === 'light'; // Light text for dark backgrounds
  
  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      <TaskAdjustLogoIcon className="w-10 h-8 shrink-0" />
      <div className="flex flex-col">
        <div className="flex items-center gap-1.5">
          <span className={`text-lg font-black tracking-tight font-display leading-tight ${isLight ? 'text-white' : 'text-[#0A2A5E]'}`}>
            TaskAdjust
          </span>
          <span className="text-[9px] font-extrabold uppercase tracking-wider bg-[#00B2FF]/15 text-[#00B2FF] border border-[#00B2FF]/30 px-1.5 py-0.5 rounded">
            PRO
          </span>
        </div>
        <span className={`text-[10px] font-semibold tracking-wider uppercase leading-none mt-0.5 ${isLight ? 'text-sky-200/80' : 'text-slate-500'}`}>
          Settlement &amp; Overtime Engine
        </span>
      </div>
    </div>
  );
}
