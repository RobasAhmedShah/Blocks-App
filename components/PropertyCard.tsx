import React from 'react';
import { View, Text, TouchableOpacity, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  interpolate,
  Extrapolate,
  type SharedValue,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/lib/useColorScheme';
import { router } from 'expo-router';

const { width } = Dimensions.get('window');

const CARD_WIDTH = 180;
const CARD_HEIGHT = 160;
const SPACING = 14;

export function PropertyCardStack({ data }: { data: any[] }) {
  const scrollX = useSharedValue(0);

  const onScroll = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
    },
  });

  return (
    <View className="mt-2 h-[180px]">
      <Animated.ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={CARD_WIDTH + SPACING}
        decelerationRate="fast"
        scrollEventThrottle={16}
        onScroll={onScroll}
        contentContainerStyle={{ paddingHorizontal: 16 }}
      >
        {data.map((item, index) => (
          <PropertyMiniCard
            key={item.property?.id ?? index}
            item={item}
            index={index}
            scrollX={scrollX}
            isLast={index === data.length - 1}
          />
        ))}
      </Animated.ScrollView>
    </View>
  );
}

function PropertyMiniCard({
  item,
  index,
  scrollX,
  isLast,
}: {
  item: any;
  index: number;
  scrollX: SharedValue<number>;
  isLast: boolean;
}) {
  const { colors, isDarkColorScheme } = useColorScheme();

  const animatedStyle = useAnimatedStyle(() => {
    const inputRange = [
      (index - 1) * (CARD_WIDTH + SPACING),
      index * (CARD_WIDTH + SPACING),
      (index + 1) * (CARD_WIDTH + SPACING),
    ];

    return {
      transform: [
        {
          scale: interpolate(scrollX.value, inputRange, [0.95, 1, 0.95], Extrapolate.CLAMP),
        },
      ],
      opacity: interpolate(scrollX.value, inputRange, [0.75, 1, 0.75], Extrapolate.CLAMP),
    };
  });

  return (
    <Animated.View
      style={[
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          shadowColor: isDarkColorScheme ? '#000' : 'rgba(0,0,0,0.08)',
        },
        animatedStyle,
      ]}
      className={`mr-[14px] h-[160px] w-[180px] ${
        isLast ? 'mr-0' : ''
      } rounded-2xl border shadow-md`}
    >
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() =>
          router.push({
            pathname: '/portfolio/myassets/assets-first',
            params: { propertyId: item.property.id },
          })
        }
        className="flex-1 px-4 py-4"
      >
        {/* Header Row */}
        <View className="mb-3 flex-row items-center gap-3">
          <View
            style={{ backgroundColor: `${colors.primary}1F` }}
            className="h-9 w-9 items-center justify-center rounded-lg"
          >
            
            <Ionicons name="business-outline" size={18} color={colors.textSecondary} />
          </View>

          <View className="flex-1">
            <Text
              numberOfLines={1}
              style={{ color: colors.textPrimary }}
              className="text-sm font-semibold"
            >
              {item.property.title}
            </Text>

            <Text
              numberOfLines={1}
              style={{ color: colors.textMuted }}
              className="text-[11px]"
            >
              {item.property.city || '—'}
            </Text>
          </View>
        </View>

        {/* Spacer */}
        <View className="flex-1" />

        {/* Divider */}
        <View
          style={{ backgroundColor: colors.border }}
          className="mb-3 h-px"
        />

        {/* Tokens Section */}
        <Text
          style={{ color: colors.textMuted }}
          className="text-[10px] font-semibold tracking-widest"
        >
          TOKENS HELD
        </Text>

        <View className="mt-1 flex-row items-end">
          <Text
            style={{ color: colors.primary }}
            className="text-2xl font-extrabold"
          >
            {item.tokensHeld ?? item.tokens ?? 0}
          </Text>
          <Text
            style={{ color: colors.textMuted }}
            className="ml-1 mb-1 text-xs font-semibold"
          >
            TKN
          </Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

