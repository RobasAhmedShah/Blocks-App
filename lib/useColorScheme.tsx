import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';
import { useColorScheme as useNativewindColorScheme } from 'nativewind';
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
  
  // ✅ React Native's useColorScheme automatically detects system changes!
  const systemColorScheme = useRNColorScheme();
  const { setColorScheme: setNativewindColorScheme } = useNativewindColorScheme();
  
  // Calculate effective color scheme based on preference
  const effectiveColorScheme = useMemo<ColorScheme>(() => {
    if (themePreference === 'system') {
      return systemColorScheme === 'dark' ? 'dark' : 'light';
    }
    return themePreference;
  }, [themePreference, systemColorScheme]);

  // Sync NativeWind with effective color scheme
  useEffect(() => {
    setNativewindColorScheme(effectiveColorScheme);
  }, [effectiveColorScheme, setNativewindColorScheme]);

  const setThemePreference = (preference: ThemePreference) => {
    setThemePreferenceState(preference);
  };

  const setColorScheme = (scheme: ColorScheme) => {
    setThemePreferenceState(scheme);
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