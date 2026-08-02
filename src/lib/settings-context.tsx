import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';

export type ThemeMode = 'system' | 'light' | 'dark';

interface SettingsContextValue {
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  colorBlindPalette: boolean;
  setColorBlindPalette: (value: boolean) => void;
  loaded: boolean;
}

const STORAGE_KEY = 'habit-tracker/settings';

const SettingsContext = createContext<SettingsContextValue | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');
  const [colorBlindPalette, setColorBlindPaletteState] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          if (parsed.themeMode) setThemeModeState(parsed.themeMode);
          if (typeof parsed.colorBlindPalette === 'boolean') {
            setColorBlindPaletteState(parsed.colorBlindPalette);
          }
        } catch {
          // ignore malformed storage
        }
      }
      setLoaded(true);
    });
  }, []);

  function persist(next: { themeMode: ThemeMode; colorBlindPalette: boolean }) {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }

  const value = useMemo<SettingsContextValue>(
    () => ({
      themeMode,
      setThemeMode: (mode) => {
        setThemeModeState(mode);
        persist({ themeMode: mode, colorBlindPalette });
      },
      colorBlindPalette,
      setColorBlindPalette: (val) => {
        setColorBlindPaletteState(val);
        persist({ themeMode, colorBlindPalette: val });
      },
      loaded,
    }),
    [themeMode, colorBlindPalette, loaded]
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
}
