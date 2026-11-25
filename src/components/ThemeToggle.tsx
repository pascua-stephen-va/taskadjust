import React from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { motion, LayoutGroup } from 'motion/react';
import { Theme, ThemePreference } from '../hooks/useTheme';

export interface ThemeToggleProps {
  theme?: Theme;
  isDark?: boolean;
  preference: ThemePreference;
  systemTheme?: Theme;
  onChange: (preference: ThemePreference) => void;
  className?: string;
  // Backwards compatibility props if called with onToggle
  onToggle?: () => void;
  isAuto?: boolean;
}

/**
 * Executive Light / Dark / Auto Segmented Capsule
 * Matches the reference design with pill container and Sun/Moon/Monitor icons.
 */
export function ThemeToggle({
  preference,
  systemTheme,
  onChange,
  className = ""
}: ThemeToggleProps) {
  const options: Array<{
    id: ThemePreference;
    label: string;
    icon: React.ComponentType<{ size?: number; className?: string }>;
  }> = [
    { id: 'light', label: 'Light', icon: Sun },
    { id: 'dark', label: 'Dark', icon: Moon },
    { id: 'auto', label: 'Auto', icon: Monitor },
  ];

  return (
    <div
      role="radiogroup"
      aria-label="Theme Selection"
      className={`relative inline-flex items-center p-1 rounded-full bg-[#001736] dark:bg-[#031329] border border-[#0052A3]/70 dark:border-[#0E427B] shadow-inner backdrop-blur-md select-none ${className}`}
    >
      <LayoutGroup id="header-theme-toggle">
        {options.map((option) => {
          const isSelected = preference === option.id;
          const Icon = option.icon;

          return (
            <motion.button
              key={option.id}
              role="radio"
              aria-checked={isSelected}
              aria-label={
                option.id === 'auto'
                  ? 'Auto Theme (Follow System)'
                  : `${option.label} Theme`
              }
              onClick={() => onChange(option.id)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 450, damping: 25 }}
              className={`relative z-10 flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full text-xs font-bold cursor-pointer transition-colors duration-200 outline-none focus-visible:ring-2 focus-visible:ring-[#00B2FF] ${
                isSelected
                  ? 'text-white'
                  : 'text-sky-200/70 hover:text-white hover:bg-white/5'
              }`}
              title={
                option.id === 'auto'
                  ? 'Auto Theme (Follow System)'
                  : `${option.label} Theme`
              }
            >
              {/* Sliding Active Pill Background */}
              {isSelected && (
                <motion.div
                  layoutId="activeThemeSegmentPill"
                  className="absolute inset-0 bg-[#0B2C58] dark:bg-[#0A2952] border border-[#18539E]/60 rounded-full shadow-md shadow-black/25"
                  style={{ zIndex: -1 }}
                  transition={{ type: 'spring', stiffness: 440, damping: 28 }}
                />
              )}

              {/* Segment Icon */}
              <Icon
                size={14}
                className={`shrink-0 transition-colors ${
                  isSelected
                    ? option.id === 'light'
                      ? 'text-amber-300'
                      : option.id === 'dark'
                      ? 'text-[#00B2FF]'
                      : 'text-white'
                    : 'text-sky-300/70'
                }`}
              />

              {/* Segment Label */}
              <span className="hidden sm:inline leading-none">{option.label}</span>
            </motion.button>
          );
        })}
      </LayoutGroup>
    </div>
  );
}

// Backwards-compatible aliases if needed
export { ThemeToggle as ThemeSegmentedToggle, ThemeToggle as ThemeControlGroup };
