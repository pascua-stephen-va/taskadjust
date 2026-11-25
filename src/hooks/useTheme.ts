import { useState, useEffect, useCallback } from 'react';

export type Theme = 'light' | 'dark';
export type ThemePreference = 'light' | 'dark' | 'auto';

const THEME_STORAGE_KEY = 'taskadjust_theme';

export function useTheme() {
  const getSystemTheme = (): Theme => {
    if (typeof window === 'undefined') return 'light';
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  };

  // Current system theme ('light' or 'dark')
  const [systemTheme, setSystemTheme] = useState<Theme>(() => getSystemTheme());

  // User preference: 'light' | 'dark' | 'auto'
  const [preference, setPreference] = useState<ThemePreference>(() => {
    if (typeof window === 'undefined') return 'auto';
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === 'light' || saved === 'dark' || saved === 'auto') {
      return saved as ThemePreference;
    }
    return 'auto';
  });

  // Active resolved theme applied to the DOM root
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === 'undefined') return 'light';
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === 'light' || saved === 'dark') {
      return saved;
    }
    return getSystemTheme();
  });

  const isAuto = preference === 'auto';

  // Apply theme to document.documentElement
  const applyTheme = useCallback((targetTheme: Theme) => {
    const root = document.documentElement;
    if (targetTheme === 'dark') {
      root.classList.add('dark');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.remove('dark');
      root.style.colorScheme = 'light';
    }
  }, []);

  // Sync with document element on mount and theme change
  useEffect(() => {
    applyTheme(theme);
  }, [theme, applyTheme]);

  // Listen for OS system theme changes
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleSystemChange = (e: MediaQueryListEvent) => {
      const newSysTheme: Theme = e.matches ? 'dark' : 'light';
      setSystemTheme(newSysTheme);
      // Auto-update if in auto mode
      if (preference === 'auto') {
        setThemeState(newSysTheme);
        applyTheme(newSysTheme);
      }
    };

    mediaQuery.addEventListener('change', handleSystemChange);
    return () => mediaQuery.removeEventListener('change', handleSystemChange);
  }, [preference, applyTheme]);

  // Direct selection of theme preference
  const setThemePreference = useCallback((pref: ThemePreference) => {
    localStorage.setItem(THEME_STORAGE_KEY, pref);
    setPreference(pref);
    if (pref === 'auto') {
      const sysTheme = getSystemTheme();
      setSystemTheme(sysTheme);
      setThemeState(sysTheme);
      applyTheme(sysTheme);
    } else {
      setThemeState(pref);
      applyTheme(pref);
    }
  }, [applyTheme]);

  // Toggle between light and dark (manual mode override)
  const toggleTheme = useCallback(() => {
    const nextTheme: Theme = theme === 'dark' ? 'light' : 'dark';
    setThemePreference(nextTheme);
  }, [theme, setThemePreference]);

  // Toggle Auto mode on or off
  const toggleAuto = useCallback(() => {
    if (preference === 'auto') {
      setThemePreference(theme);
    } else {
      setThemePreference('auto');
    }
  }, [preference, theme, setThemePreference]);

  return {
    theme,
    isDark: theme === 'dark',
    preference,
    isAuto,
    systemTheme,
    hasManualOverride: !isAuto,
    setThemePreference,
    toggleTheme,
    toggleAuto,
  };
}
