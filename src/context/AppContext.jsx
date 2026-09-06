import { createContext, useContext, useState, useCallback, useEffect, } from 'react';

import { supportedLanguages, translate, } from '@/i18n/translations';

const STORAGE_KEY = 'medikiosk.session.v1';
const THEME_STORAGE_KEY = 'medikiosk.theme.v1';

const AppContext = createContext(null);

function readPersisted() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw)) : {};
  } catch {
    return {};
  }
}

function getInitialTheme() {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === 'dark' || saved === 'light') return saved;
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
  } catch {
    /* fallback to light */
  }
  return 'light';
}

export function AppProvider({ children }) {
  const [persisted] = useState(readPersisted);
  // Always land as patient unless a staff station is actively unlocked.
  // Prevents a public kiosk from reopening on the doctor/admin screen after refresh.
  const [role, setRoleState] = useState('patient');
  const [language, setLanguageState] = useState(
    supportedLanguages.find(l => l.code === persisted.languageCode) ?? supportedLanguages[0]
);
  const [theme, setThemeState] = useState(getInitialTheme);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      /* ignore */
    }
  }, [theme]);

  // Keep the demo session in sync so a page refresh does not lose context.
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ role, languageCode: language.code }));
    } catch {
      /* storage unavailable — kiosk session continues in memory */
    }
  }, [role, language]);

  const setRole = useCallback((next) => setRoleState(next), []);
  const setLanguage = useCallback((next) => setLanguageState(next), []);
  const setTheme = useCallback((next) => setThemeState(next), []);
  const toggleTheme = useCallback(() => setThemeState(prev => (prev === 'dark' ? 'light' : 'dark')), []);

  const t = useCallback(
    (key, vars) => translate(language.code, key, vars),
    [language.code]
);

  return (
    <AppContext.Provider
      value={{
        role,
        setRole,
        language,
        setLanguage,
        languages: supportedLanguages,
        theme,
        setTheme,
        toggleTheme,
        t,
      }}
    >
      {children}
    </AppContext.Provider>
);
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
