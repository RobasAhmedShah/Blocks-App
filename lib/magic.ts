import { Magic } from '@magic-sdk/react-native-expo';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

const MAGIC_PUBLISHABLE_KEY = Constants.expoConfig?.extra?.magicPublishableKey;

// Check if we're in a browser environment (not SSR)
const isBrowser = typeof window !== 'undefined';
const isNative = Platform.OS === 'ios' || Platform.OS === 'android';

// Only initialize Magic SDK on native platforms or in browser (not during SSR)
let magicInstance: Magic | null = null;

function getMagic(): Magic | null {
  // Don't initialize during SSR
  if (!isBrowser && !isNative) {
    return null;
  }

  if (!MAGIC_PUBLISHABLE_KEY) {
    if (isNative) {
      // Only throw error on native platforms where Magic is required
      throw new Error('MAGIC_PUBLISHABLE_KEY is not configured in app.json');
    }
    return null;
  }

  if (!magicInstance) {
    try {
      magicInstance = new Magic(MAGIC_PUBLISHABLE_KEY);
    } catch (error) {
      // If initialization fails (e.g., during SSR), return null
      console.warn('Magic SDK initialization failed:', error);
      return null;
    }
  }

  return magicInstance;
}

// Lazy initialization - only create when accessed
export const magic = getMagic();

// Export Relayer component with fallback for web SSR
export const MagicRelayer = magic?.Relayer || (() => null);

