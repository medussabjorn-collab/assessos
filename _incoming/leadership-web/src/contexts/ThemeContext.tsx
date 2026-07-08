import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Theme } from '../types';

interface ThemeContextValue {
  theme: Theme;
  isDark: boolean;
  setTheme: (t: Theme) => void;
  toggleDark: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() =>
    (localStorage.getItem('la_theme') as Theme) || 'light'
  );

  const isDark = theme === 'dark' ||
    (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) root.classList.add('dark');
    else root.classList.remove('dark');
  }, [isDark]);

  const setTheme = (t: Theme) => {
    setThemeState(t);
    localStorage.setItem('la_theme', t);
  };

  const toggleDark = () => setTheme(isDark ? 'light' : 'dark');

  return (
    <ThemeContext.Provider value={{ theme, isDark, setTheme, toggleDark }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
