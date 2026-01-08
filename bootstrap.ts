// WalletConnect polyfill bootstrap
// This file ensures crypto polyfills load before any WalletConnect SDK imports

// Import crypto polyfill FIRST
import 'react-native-get-random-values';

// Import Expo Router entry point LAST
import 'expo-router/entry';
