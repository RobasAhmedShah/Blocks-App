// Learn more https://docs.expo.io/guides/customizing-metro

// Polyfill for URL.canParse (Node.js compatibility)
require('./metro.config.polyfill');

const { getDefaultConfig } = require('expo/metro-config');

const { withNativeWind } = require('nativewind/metro');

/** @type {import('expo/metro-config').MetroConfig} */

const config = getDefaultConfig(__dirname);

// Add font file extensions to assetExts
config.resolver.assetExts.push(
  'ttf',
  'otf',
  'woff',
  'woff2',
  'eot'
);

module.exports = withNativeWind(config, { input: './global.css', inlineRem: 16 });
