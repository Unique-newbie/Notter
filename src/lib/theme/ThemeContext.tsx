'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export type ThemeId =
  | "dark"
  | "light"
  | "amoled"
  | "royal"
  | "crimson"
  | "arctic"
  | "forest"
  | "golden"
  | "sakura";

export type AccentColor = 'violet' | 'cyan' | 'emerald' | 'amber' | 'rose' | 'indigo' | 'blue';
export type Density = 'comfortable' | 'compact';
export type FontSize = 'sm' | 'md' | 'lg';
export type SidebarWidth = 'narrow' | 'default' | 'wide';

export interface ThemePreferences {
  theme: ThemeId;
  accent: AccentColor;
  density: Density;
  fontSize: FontSize;
  sidebarWidth: SidebarWidth;
  reducedMotion: boolean;
}

interface ThemeContextType extends ThemePreferences {
  setTheme: (t: ThemeId) => void;
  setAccent: (a: AccentColor) => void;
  setDensity: (d: Density) => void;
  setFontSize: (f: FontSize) => void;
  setSidebarWidth: (w: SidebarWidth) => void;
  setReducedMotion: (rm: boolean) => void;
  updatePreferences: (prefs: Partial<ThemePreferences>) => void;
}

const DEFAULT_PREFS: ThemePreferences = {
  theme: 'dark',
  accent: 'violet',
  density: 'comfortable',
  fontSize: 'md',
  sidebarWidth: 'default',
  reducedMotion: false
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [prefs, setPrefs] = useState<ThemePreferences>(DEFAULT_PREFS);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('notter_theme_prefs');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setPrefs({ ...DEFAULT_PREFS, ...parsed });
        } catch (e) {}
      }
    }
    setMounted(true);
  }, []);

  const savePrefs = (next: ThemePreferences) => {
    setPrefs(next);
    if (typeof window !== 'undefined') {
      localStorage.setItem('notter_theme_prefs', JSON.stringify(next));
      applyThemeToDocument(next);
    }
  };

  const updatePreferences = (partial: Partial<ThemePreferences>) => {
    savePrefs({ ...prefs, ...partial });
  };

  useEffect(() => {
    if (mounted) applyThemeToDocument(prefs);
  }, [prefs, mounted]);

  return (
    <ThemeContext.Provider
      value={{
        ...prefs,
        setTheme: (theme) => updatePreferences({ theme }),
        setAccent: (accent) => updatePreferences({ accent }),
        setDensity: (density) => updatePreferences({ density }),
        setFontSize: (fontSize) => updatePreferences({ fontSize }),
        setSidebarWidth: (sidebarWidth) => updatePreferences({ sidebarWidth }),
        setReducedMotion: (reducedMotion) => updatePreferences({ reducedMotion }),
        updatePreferences
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

function applyThemeToDocument(prefs: ThemePreferences) {
  const root = document.documentElement;
  root.setAttribute('data-theme', prefs.theme);
  root.setAttribute('data-density', prefs.density);
  root.setAttribute('data-font-size', prefs.fontSize);
  root.setAttribute('data-sidebar-width', prefs.sidebarWidth);

  if (prefs.reducedMotion) {
    root.classList.add('reduced-motion');
  } else {
    root.classList.remove('reduced-motion');
  }
}
