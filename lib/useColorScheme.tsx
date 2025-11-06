import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useColorScheme as useNativewindColorScheme } from 'nativewind';
import { Appearance } from 'react-native';

import { COLORS } from '@/theme/colors';

type ThemePreference = 'light' | 'dark' | 'system';
type ColorScheme = 'light' | 'dark';

interface ThemeContextType {
  themePreference: ThemePreference;
  colorScheme: ColorScheme;
  isDarkColorScheme: boolean;
  setThemePreference: (preference: ThemePreference) => void;
  setColorScheme: (scheme: ColorScheme) => void;
  toggleColorScheme: () => void;
  colors: typeof COLORS.light | typeof COLORS.dark;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themePreference, setThemePreferenceState] = useState<ThemePreference>('system');
  const { colorScheme: nativewindColorScheme, setColorScheme: setNativewindColorScheme } = useNativewindColorScheme();
  
  // Resolve the effective color scheme based on preference
  const getEffectiveColorScheme = (): ColorScheme => {
    if (themePreference === 'system') {
      const systemScheme = Appearance.getColorScheme();
      return systemScheme === 'dark' ? 'dark' : 'light';
    }
    return themePreference;
  };

  const [effectiveColorScheme, setEffectiveColorScheme] = useState<ColorScheme>(getEffectiveColorScheme());

  // Update effective color scheme when preference changes
  useEffect(() => {
    const newScheme = getEffectiveColorScheme();
    setEffectiveColorScheme(newScheme);
    setNativewindColorScheme(newScheme);
  }, [themePreference]);

  // Listen to system theme changes when in system mode
  useEffect(() => {
    if (themePreference === 'system') {
      const subscription = Appearance.addChangeListener(({ colorScheme }) => {
        const newScheme = colorScheme === 'dark' ? 'dark' : 'light';
        setEffectiveColorScheme(newScheme);
        setNativewindColorScheme(newScheme);
      });
      return () => subscription.remove();
    }
  }, [themePreference]);

  const setThemePreference = (preference: ThemePreference) => {
    setThemePreferenceState(preference);
  };

  const setColorScheme = (scheme: ColorScheme) => {
    setThemePreferenceState(scheme);
    setEffectiveColorScheme(scheme);
    setNativewindColorScheme(scheme);
  };

  const toggleColorScheme = () => {
    const newScheme = effectiveColorScheme === 'light' ? 'dark' : 'light';
    setColorScheme(newScheme);
  };

  const value: ThemeContextType = {
    themePreference,
    colorScheme: effectiveColorScheme,
    isDarkColorScheme: effectiveColorScheme === 'dark',
    setThemePreference,
    setColorScheme,
    toggleColorScheme,
    colors: COLORS[effectiveColorScheme],
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useColorScheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useColorScheme must be used within a ThemeProvider');
  }
  return context;
}
