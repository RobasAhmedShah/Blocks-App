import { Stack } from 'expo-router';
import { useColorScheme } from '@/lib/useColorScheme';

export default function WalletLayout() {
  const { colors } = useColorScheme();
  
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    />
  );
}

