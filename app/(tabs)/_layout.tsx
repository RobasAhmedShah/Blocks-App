import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { View, Platform } from 'react-native';
import { useColorScheme } from '@/lib/useColorScheme';
import * as Haptics from 'expo-haptics';

export default function TabsLayout() {
  const { colors, isDarkColorScheme } = useColorScheme();

  // Haptic feedback handler for tab taps
  const handleTabPress = () => {
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,

        // ✅ Theme-aware colors
        tabBarActiveTintColor: colors.warning,
        tabBarInactiveTintColor: colors.textMuted,


        tabBarLabelStyle: {
          fontSize: 9,
          fontWeight: '600',
          marginTop: 2,
          marginBottom: 2,
          textTransform: 'uppercase',
        },

        tabBarItemStyle: {
          justifyContent: 'center',
          alignItems: 'center',
          height: '100%',
        },

        tabBarStyle: {
          position: 'absolute',
          left: 20,
          right: 20,
          bottom: 10,
          height: 80,
          borderRadius: 50,
          // paddingBottom: 8,
          paddingTop: 14,
          backgroundColor: colors.card,
          borderWidth: 1,
          borderColor: colors.border,

          // ✅ Theme-aware shadow
          shadowColor: isDarkColorScheme ? '#000' : '#000',
          shadowOpacity: isDarkColorScheme ? 0.25 : 0.08,
          shadowOffset: { width: 0, height: 6 },
          shadowRadius: 12,
          elevation: 8,
        },
      }}
    >
      {[
        { name: 'home', icon: 'home-outline', title: 'Home' },
        { name: 'portfolio', icon: 'pie-chart-outline', title: 'Portfolio' },
        { name: 'property', icon: 'business-outline', title: '' },
        { name: 'wallet', icon: 'wallet-outline', title: 'Wallet' },
        { name: 'profile', icon: 'person-outline', title: 'Profile' },
      ].map((tab) =>
        tab.name === 'property' ? (
          <Tabs.Screen
            key={tab.name}
            name={tab.name}
            listeners={{
              tabPress: () => {
                handleTabPress();
              },
            }}
            options={{
              title: '',
              tabBarIcon: ({ focused }) => (
                <View
                  style={{
                    backgroundColor: colors.primary,
                    height: 64,
                    width: 64,
                    borderRadius: 32,
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginBottom: 24,
                    borderWidth: 1,
                    borderColor: colors.border,
                    shadowColor: '#000',
                    shadowOpacity: 0.3,
                    shadowOffset: { width: 0, height: 6 },
                    shadowRadius: 10,
                    elevation: 10,
                  }}
                >
                  <Ionicons
                    name={
                      focused
                        ? (tab.icon.replace('-outline', '') as any)
                        : (tab.icon as any)
                    }
                    size={30}
                    color={colors.primaryForeground}
                  />
                </View>
              ),
            }}
          />
        ) : (
          <Tabs.Screen
            key={tab.name}
            name={tab.name}
            listeners={{
              tabPress: () => {
                handleTabPress();
              },
            }}
            options={{
              title: tab.title,
              tabBarIcon: ({ focused, color }) => (
                <Ionicons
                  name={
                    focused
                      ? (tab.icon.replace('-outline', '') as any)
                      : (tab.icon as any)
                  }
                  size={26}
                  color={color}
                />
              ),
            }}
          />
        )
      )}
    </Tabs>
  );
}
