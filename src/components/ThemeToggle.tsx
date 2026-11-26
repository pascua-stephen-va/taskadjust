import React from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Theme, ThemePreference } from '../hooks/useTheme';

export interface ThemeToggleProps {
  theme: Theme;
  isDark: boolean;
  isAuto: boolean;
  preference: ThemePreference;
  systemTheme?: Theme;
  onToggle: () => void;
  onResetToSystem?: () => void;
  onChange?: (preference: ThemePreference) => void;
  className?: string;
}

/**
 * Tactile Theme Toggle Button
 * Automatically reflects OS prefers-color-scheme and animates a smooth 180deg
 * Sun/Moon rotation via Framer Motion on both manual clicks and automatic OS changes.
 */
export function ThemeToggle({
  theme,
  isDark,
  isAuto,
  systemTheme,
  onToggle,
  onResetToSystem,
  onChange,
  className = '',
}: ThemeToggleProps) {
  const handleReset = () => {
    if (onResetToSystem) {
      onResetToSystem();
    } else if (onChange) {
      onChange('auto');
    }
  };

  const nextThemeLabel = isDark ? 'light' : 'dark';
  const toggleTooltip = isAuto
    ? `Following system (${theme} mode) — click to switch to ${nextThemeLabel} mode`
    : `Manual ${theme} mode — click to switch to ${nextThemeLabel} mode`;

  return (
    <div
      className={`inline-flex items-center p-1 rounded-full bg-[#061D3D] dark:bg-[#041224] border border-[#183B6D] dark:border-[#0F2D54] shadow-inner backdrop-blur-md select-none ${className}`}
    >
      {/* Primary Tactile Theme Toggle Button with 180deg Rotating Sun/Moon Icon */}
      <motion.button
        type="button"
        onClick={onToggle}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.93 }}
        transition={{ type: 'spring', stiffness: 450, damping: 24 }}
        aria-label={`Switch to ${nextThemeLabel} mode`}
        aria-pressed={isDark}
        title={toggleTooltip}
        className="relative inline-flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-full bg-[#0B2C58] hover:bg-[#10396E] dark:bg-[#0A2952] dark:hover:bg-[#11396E] border border-[#18539E]/60 text-white text-xs font-bold shadow-md shadow-black/20 cursor-pointer transition-colors duration-200 outline-none focus-visible:ring-2 focus-visible:ring-[#00B2FF]"
      >
        {/* 180-Degree Animated Sun / Moon Icon Stage */}
        <span
          className="relative flex items-center justify-center w-4 h-4 shrink-0"
          aria-hidden="true"
        >
          {/* Sun Icon (visible in Light mode; rotates 0 -> 180deg on exit) */}
          <motion.span
            initial={false}
            animate={{
              rotate: isDark ? 180 : 0,
              scale: isDark ? 0 : 1,
              opacity: isDark ? 0 : 1,
            }}
            transition={{
              type: 'spring',
              stiffness: 260,
              damping: 20,
              mass: 0.75,
            }}
            className="absolute inset-0 flex items-center justify-center text-amber-300 drop-shadow-[0_0_6px_rgba(252,211,77,0.45)]"
          >
            <Sun size={15} strokeWidth={2.25} />
          </motion.span>

          {/* Moon Icon (visible in Dark mode; rotates -180 -> 0deg on enter) */}
          <motion.span
            initial={false}
            animate={{
              rotate: isDark ? 0 : -180,
              scale: isDark ? 1 : 0,
              opacity: isDark ? 1 : 0,
            }}
            transition={{
              type: 'spring',
              stiffness: 260,
              damping: 20,
              mass: 0.75,
            }}
            className="absolute inset-0 flex items-center justify-center text-[#00B2FF] drop-shadow-[0_0_6px_rgba(0,178,255,0.5)]"
          >
            <Moon size={15} strokeWidth={2.25} />
          </motion.span>
        </span>

        {/* Theme Label & Subtle Auto Sync Indicator */}
        <span className="hidden sm:inline-flex items-center gap-1.5 leading-none">
          <span>{isDark ? 'Dark' : 'Light'}</span>
          {isAuto && (
            <span className="text-[9px] font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-white/10 text-sky-200/90 border border-white/10">
              Auto
            </span>
          )}
        </span>
      </motion.button>

      {/* Subtle Reset-to-System Action (appears when manual override is active) */}
      <AnimatePresence initial={false}>
        {!isAuto && (
          <motion.button
            key="reset-system-theme"
            type="button"
            initial={{ opacity: 0, width: 0, marginLeft: 0 }}
            animate={{ opacity: 1, width: 'auto', marginLeft: 4 }}
            exit={{ opacity: 0, width: 0, marginLeft: 0 }}
            transition={{ type: 'spring', stiffness: 420, damping: 30 }}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.94 }}
            onClick={handleReset}
            aria-label={`Sync with system color scheme (${systemTheme || 'auto'})`}
            title={`Reset to system theme (${systemTheme === 'dark' ? 'Dark' : 'Light'})`}
            className="overflow-hidden inline-flex items-center gap-1 px-2 py-1.5 rounded-full text-[11px] font-semibold text-sky-200/80 hover:text-white hover:bg-white/10 cursor-pointer transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[#00B2FF] whitespace-nowrap"
          >
            <Monitor size={13} className="shrink-0 text-sky-300" />
            <span className="hidden sm:inline leading-none">Auto</span>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}

// Backwards-compatible aliases
export { ThemeToggle as ThemeSegmentedToggle, ThemeToggle as ThemeControlGroup };
