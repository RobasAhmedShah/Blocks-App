import { Tabs, useRouter, useSegments } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { View, Platform, Dimensions, TouchableOpacity } from 'react-native';
import { useColorScheme } from '@/lib/useColorScheme';
import * as Haptics from 'expo-haptics';
import { useApp } from '@/contexts/AppContext';

export default function TabsLayout() {
  const { colors, isDarkColorScheme } = useColorScheme();
  const router = useRouter();
  const segments = useSegments();
  const { isFilterModalVisible } = useApp();

  // Haptic feedback handler for tab taps
  const handleTabPress = () => {
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  // Handle wallet button press
  const handleWalletPress = () => {
    handleTabPress();
    router.push('/(tabs)/wallet' as any);
  };

  // Check if wallet is active
  const isWalletActive = segments[segments.length - 1] === 'wallet';

  const screenWidth = Dimensions.get('window').width;
  const tabBarWidth = screenWidth * 0.7;
  const tabBarLeftOffset = 0.1 * screenWidth * 0.8;
  const tabBarRightEdge = tabBarLeftOffset + tabBarWidth;
  const walletButtonLeft = tabBarRightEdge + -5; // 12px spacing from tab bar
  const tabBarHeight = 80;
  const tabBarBottom = 10;
  const walletButtonBottom = tabBarBottom + (tabBarHeight - 64) / 2; // Center vertically with tab bar

  const tabs = [
    { name: 'home', icon: 'home-outline', title: 'Home' },
    { name: 'portfolio', icon: 'pie-chart-outline', title: 'Portfolio' },
    { name: 'property', icon: 'business-outline', title: 'Properties' },
    { name: 'profile', icon: 'person-outline', title: 'Profile' },
  ];

  return (
    <>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarShowLabel: false,

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
          },
          tabBarIconStyle: {
            height: '100%',
            width: '100%',
            justifyContent:'center',
            alignItems:'center',
          },

          tabBarStyle: {
            position: 'absolute',
            bottom: 20,
            height: isFilterModalVisible ? 0 : 70,
            width: '65%',
            transform: [{ translateX: tabBarLeftOffset }],
            borderRadius: 50,
            backgroundColor: colors.card,
            borderWidth: 1,
            borderColor: colors.border,
            opacity: isFilterModalVisible ? 0 : 1,
            pointerEvents: isFilterModalVisible ? 'none' : 'auto',

            // ✅ Theme-aware shadow
            shadowColor: isDarkColorScheme ? '#000' : '#000',
            shadowOpacity: isDarkColorScheme ? 0.25 : 0.08,
            shadowOffset: { width: 0, height: 6 },
            shadowRadius: 12,
            elevation: 8,
          },
        }}
      >
        {tabs.map((tab) => (
          <Tabs.Screen
            name={tab.name}
            listeners={{
              tabPress: () => {
                handleTabPress();
              },
            }}
            options={{
              title: tab.title,
              tabBarIcon: ({ focused, color }) => (
                <View style={{
                  backgroundColor: focused ? colors.background : 'rgba(255, 255, 255, 0)',
                  borderRadius: 100,
                  height:60,
                  width:60,
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginVertical: 0,
                }}>
                  <Ionicons
                    name={
                      focused
                        ? (tab.icon.replace('-outline', '') as any)
                        : (tab.icon as any)
                    }
                    size={30}
                    color={focused ? colors.primary : colors.textMuted}
                  />
                </View>
              ),
            }}
          />
        ))}
        
        {/* Wallet screen - hidden from tab bar */}
        <Tabs.Screen
          name="wallet"
          options={{
            href: null, // Hide from tab bar
          }}
        />
      </Tabs>

      {/* Floating Wallet Button */}
      {!isFilterModalVisible && (
        <TouchableOpacity
          onPress={handleWalletPress}
          activeOpacity={0.8}
          style={{
            position: 'absolute',
            bottom: 20,
            left: walletButtonLeft,
            width: 70,
            height: 70,
            borderRadius: 100,
            backgroundColor: isWalletActive ? colors.primary : colors.card,
            justifyContent: 'center',
            alignItems: 'center',
            borderWidth: 1,
            borderColor: isWalletActive ? colors.primary : colors.border,
            shadowColor: '#000',
            shadowOpacity: isWalletActive ? 0.3 : 0.15,
            shadowOffset: { width: 0, height: 6 },
            shadowRadius: 10,
            elevation: 10,
          }}
        >
          <Ionicons
            name={isWalletActive ? 'wallet' : 'wallet-outline'}
            size={30}
            color={isWalletActive ? colors.primaryForeground : colors.textMuted}
          />
        </TouchableOpacity>
      )}
    </>
  );
}
