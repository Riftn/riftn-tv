import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_THEME, findTheme, type TvTheme, type TvThemeKey } from '../config/themes';

/**
 * The chosen theme, per television.
 *
 * Stored on the device, not the account: a TV is shared by the room, and the
 * person who picked Horror on their phone has not picked it for the living
 * room. It also has to work signed out, which is how most TVs are used.
 *
 * The provider renders nothing until the saved choice is read (one small
 * AsyncStorage read, while the splash is still up). Rendering System first and
 * swapping a moment later would repaint the whole screen in front of the
 * viewer, which on a TV is a full-panel flash.
 */

const STORAGE_KEY = 'riftn.tv.theme';

interface ThemeValue {
  theme: TvTheme;
  setTheme: (key: TvThemeKey) => void;
}

const ThemeContext = createContext<ThemeValue>({ theme: DEFAULT_THEME, setTheme: () => undefined });

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<TvTheme | null>(null);

  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((saved) => !cancelled && setThemeState(findTheme(saved)))
      .catch(() => !cancelled && setThemeState(DEFAULT_THEME));
    return () => {
      cancelled = true;
    };
  }, []);

  const setTheme = useCallback((key: TvThemeKey) => {
    setThemeState(findTheme(key));
    void AsyncStorage.setItem(STORAGE_KEY, key).catch(() => undefined);
  }, []);

  const value = useMemo(() => (theme ? { theme, setTheme } : null), [theme, setTheme]);
  if (!value) return null;
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTvTheme(): ThemeValue {
  return useContext(ThemeContext);
}
