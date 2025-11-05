import { Stack } from 'expo-router';

export default function WalletLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#00363A' },
      }}
    />
  );
}

