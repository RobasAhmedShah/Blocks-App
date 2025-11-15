import { Magic } from '@magic-sdk/react-native-expo';
import Constants from 'expo-constants';

const MAGIC_PUBLISHABLE_KEY = Constants.expoConfig?.extra?.magicPublishableKey;

if (!MAGIC_PUBLISHABLE_KEY) {
  throw new Error('MAGIC_PUBLISHABLE_KEY is not configured in app.json');
}

export const magic = new Magic(MAGIC_PUBLISHABLE_KEY);

// Export Relayer component for use in app root
export const MagicRelayer = magic.Relayer;

