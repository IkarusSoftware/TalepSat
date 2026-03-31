import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as SecureStore from 'expo-secure-store';
import { colors as darkColors, lightColors } from '../theme/colors';

export type ThemeMode = 'dark' | 'light';
export type ThemeColors = typeof darkColors;

type ThemeContextType = {
  theme: ThemeMode;
  isDark: boolean;
  colors: ThemeColors;
  toggleTheme: () => void;
  setTheme: (t: ThemeMode) => void;
};

const ThemeContext = createContext<ThemeContextType>({
  theme: 'dark',
  isDark: true,
  colors: darkColors,
  toggleTheme: () => {},
  setTheme: () => {},
});

const THEME_KEY = 'app_theme';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>('dark');

  useEffect(() => {
    SecureStore.getItemAsync(THEME_KEY)
      .then((val) => {
        if (val === 'light' || val === 'dark') setThemeState(val);
      })
      .catch(() => {});
  }, []);

  const setTheme = useCallback(async (t: ThemeMode) => {
    setThemeState(t);
    await SecureStore.setItemAsync(THEME_KEY, t).catch(() => {});
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  }, [theme, setTheme]);

  const themeColors = theme === 'dark' ? darkColors : (lightColors as unknown as ThemeColors);

  return (
    <ThemeContext.Provider value={{ theme, isDark: theme === 'dark', colors: themeColors, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

export function useThemeColors() {
  return useContext(ThemeContext).colors;
}
