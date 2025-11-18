import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Dimensions,
  Modal,
  Pressable,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  useSharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  interpolate,
  Extrapolate,
  type SharedValue,
} from "react-native-reanimated";
import { useColorScheme } from "@/lib/useColorScheme";
import { router } from "expo-router";

const { width } = Dimensions.get("window");
const CARD_WIDTH = width - 82; // Full width minus padding (16px on each side)
const SPACING = 16;

export function PropertyCardStack({ data }: { data: any[] }) {
  const scrollX = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
    },
  });

  return (
    <View style={{ height: 240, marginTop: 10 }}>
      <Animated.ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={CARD_WIDTH + SPACING}
        decelerationRate="fast"
        scrollEventThrottle={16}
        onScroll={onScroll}
        contentContainerStyle={{
          paddingLeft: 16, // Left padding to match screen edge
          paddingRight: 16, // Right padding for last card
        }}
      >
        {data.map((item, index) => (
          <AnimatedCard
            key={item.id || index}
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

function AnimatedCard({
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
  const [modalVisible, setModalVisible] = useState(false);
  const { colors: theme, isDarkColorScheme } = useColorScheme();

  const animatedStyle = useAnimatedStyle(() => {
    const inputRange = [
      (index - 1) * (CARD_WIDTH + SPACING),
      index * (CARD_WIDTH + SPACING),
      (index + 1) * (CARD_WIDTH + SPACING),
    ];
    const scale = interpolate(scrollX.value, inputRange, [0.95, 1, 0.95], Extrapolate.CLAMP);
    const opacity = interpolate(scrollX.value, inputRange, [0.7, 1, 0.7], Extrapolate.CLAMP);
    return { transform: [{ scale }], opacity };
  });

  const rentalPercentage = Math.min(
    (item.monthlyRentalIncome / item.currentValue) * 100,
    100
  );
  
  const handleDetailsPress = () => {
    router.push({
      pathname: "/portfolio/ownproperty/propertydetails",
      params: { id: item.property.id },
    });
    setModalVisible(false);
  };

  return (
    <>
      <Animated.View
        style={[
          {
            backgroundColor: theme.card,
            borderRadius: 24,
            width: CARD_WIDTH,
            height: 220,
            padding: 20,
            marginRight: isLast ? 0 : SPACING, // No margin on last card
            borderWidth: 1,
            borderColor: isDarkColorScheme
              ? "rgba(22, 163, 74, 0.2)"
              : theme.border,
            shadowColor: isDarkColorScheme ? "#000" : "rgba(45,55,72,0.08)",
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: isDarkColorScheme ? 0.3 : 0.08,
            shadowRadius: 12,
            elevation: 8,
            overflow: "hidden",
          },
          animatedStyle,
        ]}
      >
        <TouchableOpacity onPress={() => setModalVisible(true)} activeOpacity={0.9}>
          {/* Header */}
          <View className="flex-row items-center mb-4">
            <Image
              source={{ uri: item.property.images[0] }}
              style={{
                borderWidth: 2,
                borderColor: isDarkColorScheme
                  ? "rgba(22,163,74,0.3)"
                  : "rgba(22,163,74,0.2)",
              }}
              className="w-14 h-14 rounded-xl mr-3"
            />
            <View className="flex-1">
              <Text
                style={{ color: theme.textPrimary }}
                className="font-bold text-base"
                numberOfLines={1}
              >
                {item.property.title}
              </Text>
              <View className="flex-row items-center gap-1">
                <Ionicons name="trending-up" size={14} color={theme.primary} />
                <Text style={{ color: theme.primary }} className="font-bold text-xs">
                  +{item.roi.toFixed(1)}% ROI
                </Text>
                <Text style={{ color: theme.textSecondary }} className="text-xs ml-1">
                  Value ${item.currentValue.toLocaleString()}
                </Text>
              </View>
            </View>

            <TouchableOpacity 
              onPress={() => setModalVisible(true)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="ellipsis-vertical" size={20} color={theme.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Divider */}
          <View style={{ backgroundColor: theme.border }} className="h-px mb-3" />

          {/* Stats Row */}
          <View className="flex-row justify-between mb-3">
            <View>
              <Text style={{ color: theme.textSecondary }} className="text-xs">
                Monthly Income
              </Text>
              <Text style={{ color: theme.textPrimary }} className="font-bold text-base">
                ${item.monthlyRentalIncome.toLocaleString()}
              </Text>
            </View>
            <View className="items-end">
              <Text style={{ color: theme.textSecondary }} className="text-xs">
                Rental Yield
              </Text>
              <Text style={{ color: theme.textPrimary }} className="font-bold text-base">
                {rentalPercentage.toFixed(2)}%
              </Text>
            </View>
          </View>

          {/* Progress Bar */}
          <View className="gap-1">
            <View
              style={{ backgroundColor: theme.border }}
              className="h-[6px] rounded-full overflow-hidden"
            >
              <View
                style={{
                  backgroundColor: theme.primary,
                  width: `${rentalPercentage}%`,
                }}
                className="h-[6px] rounded-full"
              />
            </View>
            <Text style={{ color: theme.textMuted }} className="text-xs text-center">
              Portfolio Performance
            </Text>
          </View>
        </TouchableOpacity>
      </Animated.View>

      {/* Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        statusBarTranslucent
        presentationStyle="overFullScreen"
      >
        <Pressable
          style={{
            flex: 1,
            backgroundColor: isDarkColorScheme
              ? "rgba(0,0,0,0.7)"
              : "rgba(0,0,0,0.3)",
            justifyContent: "center",
            alignItems: "center",
          }}
          onPress={() => setModalVisible(false)}
        >
          <Pressable
            style={{
              width: "88%",
              backgroundColor: theme.card,
              borderRadius: 24,
              borderWidth: 1,
              borderColor: theme.border,
              paddingBottom: 16,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.2,
              shadowRadius: 12,
              elevation: 8,
            }}
            onPress={(e) => e.stopPropagation()}
          >
            <TouchableOpacity
              onPress={() => setModalVisible(false)}
              className="absolute top-4 right-4 z-10"
              style={{
                backgroundColor: isDarkColorScheme 
                  ? "rgba(0,0,0,0.5)" 
                  : "rgba(255,255,255,0.9)",
                width: 32,
                height: 32,
                borderRadius: 16,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name="close" size={20} color={theme.textPrimary} />
            </TouchableOpacity>

            <Image
              source={{ uri: item.property.images[0] }}
              className="w-full h-64 rounded-t-2xl mb-5"
              resizeMode="cover"
            />

            <View className="px-6 pb-6 -mt-24">
              <Text 
                style={{ 
                  color: '#FFFFFF', 
                  fontSize: 20, 
                  fontWeight: 'bold', 
                  marginBottom: 4,
                  textShadowColor: 'rgba(0, 0, 0, 0.8)',
                  textShadowOffset: { width: 0, height: 1 },
                  textShadowRadius: 3,
                }}
              >
                {item.property.title}
              </Text>
              <View className="flex-row items-center gap-2 mb-2">
                <Text 
                  style={{ 
                    color: '#FFFFFF', 
                    fontWeight: '600',
                    textShadowColor: 'rgba(0, 0, 0, 0.8)',
                    textShadowOffset: { width: 0, height: 1 },
                    textShadowRadius: 3,
                  }}
                >
                  +{item.roi.toFixed(1)}% ROI
                </Text>
                <Text 
                  style={{ 
                    color: '#FFFFFF', 
                    fontSize: 14,
                    textShadowColor: 'rgba(0, 0, 0, 0.8)',
                    textShadowOffset: { width: 0, height: 1 },
                    textShadowRadius: 3,
                  }}
                >
                  Current Value: ${item.currentValue.toLocaleString()}
                </Text>
              </View>

              {/* Stats */}
              <View className="flex-row justify-between mt-6">
                <View className="items-center">
                  <Text style={{ color: theme.textMuted, fontSize: 12 }}>
                    Last Dividend
                  </Text>
                  <Text style={{ color: theme.textPrimary, fontWeight: 'bold', fontSize: 14 }}>
                    ${item.lastDividend || "450.20"}
                  </Text>
                </View>
                <View className="items-center">
                  <Text style={{ color: theme.textMuted, fontSize: 12 }}>
                    Occupancy
                  </Text>
                  <Text style={{ color: theme.textPrimary, fontWeight: 'bold', fontSize: 14 }}>
                    {item.occupancy || "98%"}
                  </Text>
                </View>
                <View className="items-center">
                  <Text style={{ color: theme.textMuted, fontSize: 12 }}>
                    Next Payout
                  </Text>
                  <Text style={{ color: theme.textPrimary, fontWeight: 'bold', fontSize: 14 }}>
                    {item.nextPayout || "15 July"}
                  </Text>
                </View>
              </View>

              {/* Buttons */}
              <View className="flex-row mt-8 gap-3">
                <Pressable
                  onPress={() => {
                    setModalVisible(false);
                    router.push({
                      pathname: "/invest/[id]",
                      params: { id: item.property.id },
                    });
                  }}
                  style={{ 
                    backgroundColor: theme.primary, 
                    flex: 1, 
                    paddingVertical: 14, 
                    borderRadius: 12, 
                    alignItems: 'center',
                    shadowColor: theme.primary,
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.3,
                    shadowRadius: 8,
                    elevation: 6,
                  }}
                >
                  <Text style={{ color: theme.primaryForeground, fontWeight: 'bold', fontSize: 14 }}>
                    INVEST MORE
                  </Text>
                </Pressable>
                <Pressable
                  onPress={handleDetailsPress}
                  style={{
                    backgroundColor: isDarkColorScheme ? theme.muted : theme.secondary,
                    flex: 1,
                    paddingVertical: 14,
                    borderRadius: 12,
                    alignItems: 'center',
                    borderWidth: 1,
                    borderColor: theme.border,
                  }}
                >
                  <Text style={{ color: theme.textPrimary, fontWeight: 'bold', fontSize: 14 }}>
                    DETAILS
                  </Text>
                </Pressable>
              </View>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}