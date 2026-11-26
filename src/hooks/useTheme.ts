import { useState, useEffect, useCallback } from 'react';

export type Theme = 'light' | 'dark';
export type ThemePreference = 'light' | 'dark' | 'auto';

const THEME_STORAGE_KEY = 'taskadjust_theme';
const DARK_MEDIA_QUERY = '(prefers-color-scheme: dark)';

function getSystemTheme(): Theme {
  if (typeof window === 'undefined' || !window.matchMedia) return 'light';
  return window.matchMedia(DARK_MEDIA_QUERY).matches ? 'dark' : 'light';
}

function readStoredPreference(): ThemePreference {
  if (typeof window === 'undefined') return 'auto';
  try {
    const saved = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === 'light' || saved === 'dark') {
      return saved;
    }
  } catch {
    // Ignore storage access errors in restricted environments
  }
  return 'auto';
}

function writeStoredPreference(pref: ThemePreference): void {
  if (typeof window === 'undefined') return;
  try {
    if (pref === 'auto') {
      window.localStorage.removeItem(THEME_STORAGE_KEY);
    } else {
      window.localStorage.setItem(THEME_STORAGE_KEY, pref);
    }
  } catch {
    // Ignore storage quota or private-mode errors
  }
}

export function useTheme() {
  // Current OS system color scheme ('light' or 'dark')
  const [systemTheme, setSystemTheme] = useState<Theme>(() => getSystemTheme());

  // User preference: 'auto' (follow OS) or manual override ('light' | 'dark')
  const [preference, setPreference] = useState<ThemePreference>(() => readStoredPreference());

  // Active resolved theme applied to the DOM root
  const theme: Theme = preference === 'auto' ? systemTheme : preference;
  const isAuto = preference === 'auto';

  // Apply resolved theme class and color-scheme to document.documentElement
  const applyTheme = useCallback((targetTheme: Theme) => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    if (targetTheme === 'dark') {
      root.classList.add('dark');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.remove('dark');
      root.style.colorScheme = 'light';
    }
  }, []);

  // Sync DOM root whenever resolved theme changes
  useEffect(() => {
    applyTheme(theme);
  }, [theme, applyTheme]);

  // Listen for dynamic OS prefers-color-scheme changes
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;

    const mediaQuery = window.matchMedia(DARK_MEDIA_QUERY);

    // Ensure initial system state matches live media query on mount
    setSystemTheme(mediaQuery.matches ? 'dark' : 'light');

    const handleSystemChange = (event: MediaQueryListEvent) => {
      setSystemTheme(event.matches ? 'dark' : 'light');
    };

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', handleSystemChange);
      return () => mediaQuery.removeEventListener('change', handleSystemChange);
    } else {
      // Fallback for older browsers
      mediaQuery.addListener(handleSystemChange);
      return () => mediaQuery.removeListener(handleSystemChange);
    }
  }, []);

  // Keep preference synchronized across multiple browser tabs
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key !== THEME_STORAGE_KEY) return;
      setPreference(readStoredPreference());
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Explicitly set 'light', 'dark', or 'auto'
  const setThemePreference = useCallback((pref: ThemePreference) => {
    writeStoredPreference(pref);
    setPreference(pref);
    if (pref === 'auto') {
      setSystemTheme(getSystemTheme());
    }
  }, []);

  // Toggle between light and dark as a manual override persisted in localStorage
  const toggleTheme = useCallback(() => {
    const nextTheme: Theme = theme === 'dark' ? 'light' : 'dark';
    setThemePreference(nextTheme);
  }, [theme, setThemePreference]);

  // Clear manual override and return to live OS system preference tracking
  const resetToSystem = useCallback(() => {
    setThemePreference('auto');
  }, [setThemePreference]);

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
    resetToSystem,
    toggleAuto,
  };
}
