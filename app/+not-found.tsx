import { Link, Stack, useRouter } from 'expo-router';
import { View, TouchableOpacity, Dimensions } from 'react-native';
import { Text } from '@/components/nativewindui/Text';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  interpolate,
  Extrapolate,
  Easing,
} from 'react-native-reanimated';
import { useEffect } from 'react';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

export default function NotFoundScreen() {
  const router = useRouter();
  const rotation = useSharedValue(0);
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.5);
  const floatY = useSharedValue(0);

  useEffect(() => {
    // Rotating search icon
   // "Looking" (rocking) search icon
       rotation.value = withRepeat(
          withSequence(
            // Swing to 15 degrees
            withTiming(15, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
            // Swing to -15 degrees
            withTiming(-15, { duration: 2400, easing: Easing.inOut(Easing.ease) }),
            // Swing back to 0
            withTiming(0, { duration: 1200, easing: Easing.inOut(Easing.ease) })
          ),
          -1 // Repeat indefinitely
        );

    // Pulsing scale animation
    scale.value = withRepeat(
      withSequence(
        withTiming(1.1, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    // Opacity pulse
    opacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1000 }),
        withTiming(0.5, { duration: 1000 })
      ),
      -1,
      true
    );

    // Floating animation
    floatY.value = withRepeat(
      withSequence(
        withTiming(-15, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 2000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);

  const animatedIconStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${rotation.value}deg` },
      { scale: scale.value },
      { translateY: floatY.value },
    ],
    
  }));

  const animated404Style = useAnimatedStyle(() => ({
    transform: [{ translateY: floatY.value }],
    opacity: opacity.value,
  }));

  return (
    <>
      <Stack.Screen options={{ title: 'Page Not Found', headerShown: false }} />
      <View className="flex-1 bg-[#0D0D10] items-center justify-center p-5">
        {/* Animated 404 Number */}
        <Animated.View style={[animated404Style, { marginBottom: 20 }]}>
          <Text className="text-8xl font-bold text-white/20" style={{ fontFamily: 'monospace' }}>
            404
          </Text>
        </Animated.View>

        {/* Animated Search Icon */}
        <Animated.View style={animatedIconStyle}>
          <View className="items-center justify-center mb-8">
            <View className="bg-emerald-500/20 rounded-full p-6 mb-4">
              <Ionicons name="search" size={64} color="#34D399" />
            </View>
          </View>
        </Animated.View>

        {/* Main Message */}
        <View className="items-center mb-6 px-4">
          <Text className="text-white text-3xl font-bold text-center mb-3">
            Hmm, looking for something?
          </Text>
          <Text className="text-gray-400 text-base text-center leading-6">
            The page you're trying to reach doesn't exist or has been moved.
          </Text>
        </View>

        {/* Decorative Elements */}
        <View className="absolute top-20 left-10 opacity-30">
          <Ionicons name="cube-outline" size={40} color="#34D399" />
        </View>
        <View className="absolute bottom-32 right-10 opacity-30">
          <Ionicons name="home-outline" size={40} color="#34D399" />
        </View>
        <View className="absolute top-40 right-16 opacity-20">
          <Ionicons name="location-outline" size={30} color="#34D399" />
        </View>

        {/* Navigation Buttons */}
        <View className="mt-8 w-full max-w-md px-4 gap-4">
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/home')}
            className="w-full"
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#00FFC6', '#00B5FF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              className="rounded-full py-4 px-6"
            >
              <View className="flex-row items-center justify-center">
                <Ionicons name="home" size={20} color="#fff" />
                <Text className="text-white font-bold text-lg ml-2">
                  Go to Home
                </Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.back()}
            className="w-full border border-white/20 rounded-full py-4 px-6"
            activeOpacity={0.8}
          >
            <View className="flex-row items-center justify-center">
              <Ionicons name="arrow-back" size={20} color="#fff" />
              <Text className="text-white font-semibold text-base ml-2">
                Go Back
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Helpful Links */}
        <View className="mt-12 flex-row gap-6">
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/property')}
            className="items-center"
            activeOpacity={0.7}
          >
            <View className="bg-emerald-500/10 rounded-full p-3 mb-2">
              <Ionicons name="business" size={24} color="#34D399" />
            </View>
            <Text className="text-gray-400 text-xs">Properties</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push('/(tabs)/portfolio')}
            className="items-center"
            activeOpacity={0.7}
          >
            <View className="bg-emerald-500/10 rounded-full p-3 mb-2">
              <Ionicons name="pie-chart" size={24} color="#34D399" />
            </View>
            <Text className="text-gray-400 text-xs">Portfolio</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push('/(tabs)/wallet')}
            className="items-center"
            activeOpacity={0.7}
          >
            <View className="bg-emerald-500/10 rounded-full p-3 mb-2">
              <Ionicons name="wallet" size={24} color="#34D399" />
            </View>
            <Text className="text-gray-400 text-xs">Wallet</Text>
          </TouchableOpacity>
        </View>
      </View>
    </>
  );
}
