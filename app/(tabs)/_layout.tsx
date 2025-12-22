import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Platform, View } from 'react-native';
import { COLORS } from '@/theme/colors';
import { useColorScheme } from '@/lib/useColorScheme';

export default function TabsLayout() {
  const { colors, isDarkColorScheme } = useColorScheme();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: '#FFD700',
        tabBarInactiveTintColor: 'rgba(255,255,255,0.6)',
        tabBarLabelStyle: {
          fontSize: 9,
          fontWeight: '600',
          marginTop: 2,
          marginBottom: 2,
          textTransform: 'uppercase',
        },
        tabBarItemStyle: {
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingVertical: 0,
          height: '80%',
        },
        tabBarIconStyle: {
          marginTop: 0,
          marginBottom: 0,
        },
        tabBarStyle: {
          position: 'absolute',
          left: 20,
          right: 20,
          bottom: 10,
          height: 80,
          marginHorizontal: 10,
          borderRadius: 50,
          paddingBottom: 8,
          paddingTop: 5,
          // backgroundColor: "rgba(0, 0, 0, 0.9)",
          backgroundColor: colors.card,
          // borderWidth: 4,
          // borderTopWidth: 4,
          boxShadow: '0px 0px 10px rgba(0, 0, 0, 0.5)',
          // borderColor: 'rgba(255, 255, 255, 0.15)',
          borderColor: colors.border,

          // Center the entire tab bar content
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'center',
          paddingHorizontal: 10,

          // Shadow
          shadowColor: '#000',
          shadowOpacity: 0.08,
          shadowOffset: { width: 0, height: 6 },
          shadowRadius: 12,
          elevation: 6,
        },
      }}>
      {[
        { name: 'home', icon: 'home-outline', title: 'Home' },
        { name: 'portfolio', icon: 'pie-chart-outline', title: 'Portfolio' },
        { name: 'property', icon: 'business-outline', title: 'Property' },
        { name: 'wallet', icon: 'wallet-outline', title: 'Wallet' },
        { name: 'profile', icon: 'person-outline', title: 'Profile' },
      ].map((tab) =>
        tab.name === 'property' ? (
          <Tabs.Screen
            key={tab.name}
            name={tab.name}
            options={{
              // title: tab.title,
              title: '',
              tabBarIcon: ({ color, focused }) => (
                <View
                  style={{
                    backgroundColor: colors.primary,
                    borderRadius: 50,
                    height: 65,
                    width: 65,
                    borderColor: colors.border,
                    boxShadow: '0px 0px 10px rgba(0, 0, 0, 0.5)',
                    // marginTop: 15,
                    marginBottom: 10,
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}>
                  <Ionicons
                    name={focused ? (tab.icon.replace('-outline', '') as any) : (tab.icon as any)}
                    size={32}
                    color={colors.background}
                  />
                </View>
              ),
            }}
          />
        ) : (
          <Tabs.Screen
            key={tab.name}
            name={tab.name}
            options={{
              title: tab.title,
              tabBarIcon: ({ color, focused }) => (
                <Ionicons
                  name={focused ? (tab.icon.replace('-outline', '') as any) : (tab.icon as any)}
                  size={24}
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
