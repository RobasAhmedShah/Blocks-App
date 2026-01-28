module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      [
        'babel-preset-expo',
        {
          jsxImportSource: 'nativewind',
          unstable_transformImportMeta: true, // Required for WalletConnect Modal (valtio dependency)
        },
      ],
      'nativewind/babel',
    ],
    plugins: ['react-native-reanimated/plugin'],
  };
};
