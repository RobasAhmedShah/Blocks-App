import { Platform } from 'react-native';

const IOS_SYSTEM_COLORS = {
  white: 'rgb(255, 255, 255)',
  black: 'rgb(0, 0, 0)',
  light: {
    grey6: 'rgb(242, 242, 247)',
    grey5: 'rgb(230, 230, 235)',
    grey4: 'rgb(210, 210, 215)',
    grey3: 'rgb(199, 199, 204)',
    grey2: 'rgb(175, 176, 180)',
    grey: 'rgb(142, 142, 147)',
    background: 'rgb(248, 247, 245)', // #F8F7F5
    foreground: 'rgb(31, 41, 55)', // #1F2937
    root: 'rgb(255, 255, 255)',
    card: 'rgb(255, 255, 255)',
    cardForeground: 'rgb(31, 41, 55)', // #1F2937
    popover: 'rgb(255, 255, 255)',
    popoverForeground: 'rgb(31, 41, 55)',
    destructive: 'rgb(239, 68, 68)', // #EF4444
    primary: 'rgb(22, 163, 74)', // #16A34A - Emerald green
    primaryForeground: 'rgb(255, 255, 255)',
    primarySoft: 'rgb(34, 197, 94)', // #22C55E
    secondary: 'rgb(229, 231, 235)', // #E5E7EB
    secondaryForeground: 'rgb(31, 41, 55)',
    muted: 'rgb(229, 231, 235)', // #E5E7EB
    mutedForeground: 'rgb(107, 114, 128)', // #6B7280
    accent: 'rgb(22, 163, 74)', // Same as primary
    accentForeground: 'rgb(255, 255, 255)',
    border: 'rgba(0, 0, 0, 0.06)',
    input: 'rgb(229, 231, 235)',
    ring: 'rgb(22, 163, 74)',
    textPrimary: 'rgb(31, 41, 55)', // #1F2937
    textSecondary: 'rgb(75, 85, 99)', // #4B5563
    textMuted: 'rgb(107, 114, 128)', // #6B7280
    warning: 'rgb(234, 179, 8)', // #EAB308
  },
  dark: {
    grey6: 'rgb(11, 61, 54)', // #0B3D36
    grey5: 'rgb(26, 44, 38)', // #1a2c26
    grey4: 'rgb(55, 55, 57)',
    grey3: 'rgb(70, 70, 73)',
    grey2: 'rgb(99, 99, 102)',
    grey: 'rgb(142, 142, 147)',
    background: 'rgb(1, 42, 36)', // #012A24
    foreground: 'rgb(249, 250, 251)', // #F9FAFB
    root: 'rgb(1, 42, 36)',
    card: 'rgb(11, 61, 54)', // #0B3D36
    cardForeground: 'rgb(249, 250, 251)',
    popover: 'rgb(11, 61, 54)',
    popoverForeground: 'rgb(249, 250, 251)',
    destructive: 'rgb(239, 68, 68)', // #EF4444
    primary: 'rgb(22, 163, 74)', // #16A34A - Emerald green
    primaryForeground: 'rgb(255, 255, 255)',
    primarySoft: 'rgb(34, 197, 94)', // #22C55E
    secondary: 'rgb(55, 65, 81)', // #374151
    secondaryForeground: 'rgb(249, 250, 251)',
    muted: 'rgb(55, 65, 81)', // #374151
    mutedForeground: 'rgb(156, 163, 175)', // #9CA3AF
    accent: 'rgb(22, 163, 74)', // Same as primary
    accentForeground: 'rgb(255, 255, 255)',
    border: 'rgba(255, 255, 255, 0.08)',
    input: 'rgb(26, 44, 38)',
    ring: 'rgb(22, 163, 74)',
    textPrimary: 'rgb(249, 250, 251)', // #F9FAFB
    textSecondary: 'rgb(209, 213, 219)', // #D1D5DB
    textMuted: 'rgb(156, 163, 175)', // #9CA3AF
    warning: 'rgb(234, 179, 8)', // #EAB308
  },
} as const;

const ANDROID_COLORS = {
  white: 'rgb(255, 255, 255)',
  black: 'rgb(0, 0, 0)',
  light: {
    grey6: 'rgb(249, 249, 255)',
    grey5: 'rgb(215, 217, 228)',
    grey4: 'rgb(193, 198, 215)',
    grey3: 'rgb(113, 119, 134)',
    grey2: 'rgb(65, 71, 84)',
    grey: 'rgb(24, 28, 35)',
    background: 'rgb(248, 247, 245)', // #F8F7F5
    foreground: 'rgb(31, 41, 55)', // #1F2937
    root: 'rgb(255, 255, 255)',
    card: 'rgb(255, 255, 255)',
    cardForeground: 'rgb(31, 41, 55)', // #1F2937
    popover: 'rgb(255, 255, 255)',
    popoverForeground: 'rgb(31, 41, 55)',
    destructive: 'rgb(239, 68, 68)', // #EF4444
    primary: 'rgb(22, 163, 74)', // #16A34A - Emerald green
    primaryForeground: 'rgb(255, 255, 255)',
    primarySoft: 'rgb(34, 197, 94)', // #22C55E
    secondary: 'rgb(229, 231, 235)', // #E5E7EB
    secondaryForeground: 'rgb(31, 41, 55)',
    muted: 'rgb(229, 231, 235)', // #E5E7EB
    mutedForeground: 'rgb(107, 114, 128)', // #6B7280
    accent: 'rgb(22, 163, 74)', // Same as primary
    accentForeground: 'rgb(255, 255, 255)',
    border: 'rgba(0, 0, 0, 0.06)',
    input: 'rgb(229, 231, 235)',
    ring: 'rgb(22, 163, 74)',
    textPrimary: 'rgb(31, 41, 55)', // #1F2937
    textSecondary: 'rgb(75, 85, 99)', // #4B5563
    textMuted: 'rgb(107, 114, 128)', // #6B7280
    warning: 'rgb(234, 179, 8)', // #EAB308
  },
  dark: {
    grey6: 'rgb(11, 61, 54)', // #0B3D36
    grey5: 'rgb(26, 44, 38)', // #1a2c26
    grey4: 'rgb(49, 53, 61)',
    grey3: 'rgb(54, 57, 66)',
    grey2: 'rgb(139, 144, 160)',
    grey: 'rgb(193, 198, 215)',
    background: 'rgb(1, 42, 36)', // #012A24
    foreground: 'rgb(249, 250, 251)', // #F9FAFB
    root: 'rgb(1, 42, 36)',
    card: 'rgb(11, 61, 54)', // #0B3D36
    cardForeground: 'rgb(249, 250, 251)',
    popover: 'rgb(11, 61, 54)',
    popoverForeground: 'rgb(249, 250, 251)',
    destructive: 'rgb(239, 68, 68)', // #EF4444
    primary: 'rgb(22, 163, 74)', // #16A34A - Emerald green
    primaryForeground: 'rgb(255, 255, 255)',
    primarySoft: 'rgb(34, 197, 94)', // #22C55E
    secondary: 'rgb(55, 65, 81)', // #374151
    secondaryForeground: 'rgb(249, 250, 251)',
    muted: 'rgb(55, 65, 81)', // #374151
    mutedForeground: 'rgb(156, 163, 175)', // #9CA3AF
    accent: 'rgb(22, 163, 74)', // Same as primary
    accentForeground: 'rgb(255, 255, 255)',
    border: 'rgba(255, 255, 255, 0.08)',
    input: 'rgb(26, 44, 38)',
    ring: 'rgb(22, 163, 74)',
    textPrimary: 'rgb(249, 250, 251)', // #F9FAFB
    textSecondary: 'rgb(209, 213, 219)', // #D1D5DB
    textMuted: 'rgb(156, 163, 175)', // #9CA3AF
    warning: 'rgb(234, 179, 8)', // #EAB308
  },
} as const;

const COLORS = Platform.OS === 'ios' ? IOS_SYSTEM_COLORS : ANDROID_COLORS;

export { COLORS };
