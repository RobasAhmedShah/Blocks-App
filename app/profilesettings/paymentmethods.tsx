import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from "expo-router";
import { useColorScheme } from "@/lib/useColorScheme";
import { paymentMethodsApi, PaymentMethod } from "@/services/api/paymentMethods.api";

// Card network color schemes and gradients
const getCardStyle = (provider: string, isDarkColorScheme: boolean) => {
  const cardStyles: Record<string, any> = {
    'Visa': {
      gradient: ['#1A1F71', '#2E3192', '#4B5DBD'],
      textColor: '#FFFFFF',
      shimmerColor: 'rgba(255, 255, 255, 0.1)',
      pattern: 'dots',
    },
    'Mastercard': {
      gradient: ['#1A1A1A', '#2D2D2D', '#000000'],
      textColor: '#FFFFFF',
      shimmerColor: 'rgba(255, 255, 255, 0.08)',
      pattern: 'circles',
    },
    'American Express': {
      gradient: ['#006FCF', '#0077D4', '#0099FF'],
      textColor: '#FFFFFF',
      shimmerColor: 'rgba(255, 255, 255, 0.12)',
      pattern: 'squares',
    },
    'Discover': {
      gradient: ['#FF6000', '#FF7A1F', '#FF9447'],
      textColor: '#FFFFFF',
      shimmerColor: 'rgba(255, 255, 255, 0.15)',
      pattern: 'waves',
    },
    'Default': {
      gradient: isDarkColorScheme 
        ? ['#1F2937', '#374151', '#4B5563']
        : ['#6366F1', '#8B5CF6', '#A855F7'],
      textColor: '#FFFFFF',
      shimmerColor: 'rgba(255, 255, 255, 0.1)',
      pattern: 'dots',
    },
  };

  return cardStyles[provider] || cardStyles['Default'];
};

// Format card number for display
const formatCardNumber = (number: string) => {
  return number.replace(/(.{4})/g, '$1 ').trim();
};

export default function PaymentMethodsScreen() {
  const router = useRouter();
  const { colors, isDarkColorScheme } = useColorScheme();
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadPaymentMethods();
  }, []);

  const loadPaymentMethods = async () => {
    try {
      setLoading(true);
      const methods = await paymentMethodsApi.getPaymentMethods();
      setPaymentMethods(methods);
    } catch (error: any) {
      console.error('Error loading payment methods:', error);
      Alert.alert('Error', error.message || 'Failed to load payment methods');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleSetDefault = async (methodId: string) => {
    try {
      // Optimistic update
      setPaymentMethods(prevMethods => 
        prevMethods.map(method => ({
          ...method,
          isDefault: method.id === methodId
        }))
      );
      
      await paymentMethodsApi.setDefaultPaymentMethod(methodId, true);
      await loadPaymentMethods();
    } catch (error: any) {
      await loadPaymentMethods();
      Alert.alert('Error', error.message || 'Failed to set default payment method');
    }
  };

  const handleRemoveMethod = (methodId: string) => {
    Alert.alert(
      "Remove Payment Method",
      "Are you sure you want to remove this payment method?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            try {
              await paymentMethodsApi.deletePaymentMethod(methodId);
              await loadPaymentMethods();
              Alert.alert('Success', 'Payment method removed');
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to remove payment method');
            }
          },
        },
      ]
    );
  };

  const handleAddCard = () => {
    router.push('../profilesettings/addcard');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified':
        return '#10B981';
      case 'pending':
        return '#F59E0B';
      case 'disabled':
        return '#EF4444';
      default:
        return colors.textMuted;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'verified':
        return 'Active';
      case 'pending':
        return 'Pending';
      case 'disabled':
        return 'Disabled';
      default:
        return status;
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle={isDarkColorScheme ? "light-content" : "dark-content"} />

      {/* Header */}
      <View 
        style={{ borderBottomWidth: 1, borderBottomColor: colors.border }}
        className="flex-row items-center px-4 py-4"
      >
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-12 h-12 items-center justify-center"
        >
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>

        <Text style={{ color: colors.textPrimary }} className="flex-1 text-center text-lg font-bold">
          Payment Methods
        </Text>

        <View className="w-12" />
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ color: colors.textSecondary }} className="mt-4">
            Loading payment methods...
          </Text>
        </View>
      ) : (
        <>
          <ScrollView 
            className="flex-1"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 100 }}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={async () => {
                  setRefreshing(true);
                  await loadPaymentMethods();
                }}
                tintColor={colors.primary}
              />
            }
          >
            <View className="px-4 py-6">
              {/* Info Card */}
              <View 
                style={{ 
                  backgroundColor: isDarkColorScheme 
                    ? 'rgba(13, 165, 165, 0.1)' 
                    : 'rgba(13, 165, 165, 0.05)',
                  borderWidth: 1,
                  borderColor: isDarkColorScheme 
                    ? 'rgba(13, 165, 165, 0.3)' 
                    : 'rgba(13, 165, 165, 0.2)'
                }}
                className="rounded-xl p-4 mb-6"
              >
                <View className="flex-row items-start gap-3">
                  <View 
                    style={{ 
                      backgroundColor: isDarkColorScheme 
                        ? 'rgba(13, 165, 165, 0.2)' 
                        : 'rgba(13, 165, 165, 0.15)' 
                    }}
                    className="w-10 h-10 items-center justify-center rounded-full"
                  >
                    <Ionicons name="shield-checkmark" size={22} color={colors.primary} />
                  </View>
                  <View className="flex-1">
                    <Text style={{ color: colors.textPrimary }} className="text-sm font-semibold mb-1">
                      Secure Payment Methods
                    </Text>
                    <Text style={{ color: colors.textSecondary }} className="text-xs leading-relaxed">
                      Your payment methods are encrypted and secured. Add cards to make deposits faster.
                    </Text>
                  </View>
                </View>
              </View>

              {/* Payment Methods List - Realistic Cards */}
              <View className="flex flex-col gap-5">
                {paymentMethods.map((method) => {
                  const cardStyle = getCardStyle(method.provider, isDarkColorScheme);
                  
                  return (
                    <View key={method.id}>
                      {/* Realistic Card Design */}
                      <View
                        className="rounded-2xl overflow-hidden"
                        style={{
                          shadowColor: '#000',
                          shadowOffset: { width: 0, height: 8 },
                          shadowOpacity: 0.3,
                          shadowRadius: 12,
                          elevation: 8,
                        }}
                      >
                        <LinearGradient
                          colors={cardStyle.gradient}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          className="relative"
                        >
                          {/* Card Background Pattern */}
                          <View className="absolute inset-0 opacity-20">
                            {cardStyle.pattern === 'dots' && (
                              <View className="flex-row flex-wrap">
                                {[...Array(100)].map((_, i) => (
                                  <View
                                    key={i}
                                    style={{
                                      width: 4,
                                      height: 4,
                                      backgroundColor: cardStyle.shimmerColor,
                                      borderRadius: 2,
                                      margin: 8,
                                    }}
                                  />
                                ))}
                              </View>
                            )}
                            {cardStyle.pattern === 'circles' && (
                              <View className="absolute -right-12 -top-12">
                                <View
                                  style={{
                                    width: 200,
                                    height: 200,
                                    borderRadius: 100,
                                    backgroundColor: cardStyle.shimmerColor,
                                  }}
                                />
                              </View>
                            )}
                            {cardStyle.pattern === 'waves' && (
                              <View className="absolute bottom-0 left-0 right-0">
                                <View
                                  style={{
                                    height: 60,
                                    backgroundColor: cardStyle.shimmerColor,
                                    borderTopLeftRadius: 60,
                                    borderTopRightRadius: 60,
                                  }}
                                />
                              </View>
                            )}
                          </View>

                          {/* Card Content */}
                          <View className="p-5 pb-6">
                            {/* Header Row */}
                            <View className="flex-row items-start justify-between mb-8">
                              {/* EMV Chip */}
                              <View
                                className="w-12 h-10 rounded-lg overflow-hidden"
                                style={{
                                  backgroundColor: 'rgba(255, 215, 0, 0.9)',
                                }}
                              >
                                <View className="flex-1 flex-row">
                                  <View className="flex-1 border-r border-[#000000]/20" />
                                  <View className="flex-1" />
                                </View>
                                <View className="h-px bg-[#000000]/20" />
                                <View className="flex-1 flex-row">
                                  <View className="flex-1 border-r border-[#000000]/20" />
                                  <View className="flex-1" />
                                </View>
                              </View>

                              {/* Card Network Logo & Status */}
                              <View className="items-end gap-2">
                                <View className="flex-row items-center gap-2">
                                  {method.isDefault && (
                                    <View className="bg-[#FFD700]/90 px-2.5 py-1 rounded-full flex-row items-center gap-1">
                                      <Ionicons name="star" size={12} color="#000" />
                                      <Text className="text-[#000] text-[10px] font-black">
                                        DEFAULT
                                      </Text>
                                    </View>
                                  )}
                                  <View
                                    className="px-3 py-1.5 rounded-full"
                                    style={{
                                      backgroundColor: cardStyle.shimmerColor,
                                    }}
                                  >
                                    <Text
                                      style={{ color: cardStyle.textColor }}
                                      className="text-xs font-bold tracking-wide"
                                    >
                                      {method.provider.toUpperCase()}
                                    </Text>
                                  </View>
                                </View>
                              </View>
                            </View>

                            {/* Card Number */}
                            {method.cardDetails && (
                              <View className="mb-6">
                                <Text
                                  style={{ color: cardStyle.textColor }}
                                  className="text-[22px] font-mono tracking-[3px] mb-1"
                                >
                                  {formatCardNumber(method.cardDetails.cardNumber)}
                                </Text>
                              </View>
                            )}

                            {/* Cardholder Info Row */}
                            {method.cardDetails && (
                              <View className="flex-row items-end justify-between">
                                <View className="flex-1">
                                  <Text
                                    style={{ color: cardStyle.textColor }}
                                    className="text-[9px] uppercase tracking-wide mb-1 opacity-70"
                                  >
                                    Card Holder
                                  </Text>
                                  <Text
                                    style={{ color: cardStyle.textColor }}
                                    className="text-sm font-semibold uppercase tracking-wide"
                                    numberOfLines={1}
                                  >
                                    {method.cardDetails.cardholderName}
                                  </Text>
                                </View>
                                <View className="items-end ml-4">
                                  <Text
                                    style={{ color: cardStyle.textColor }}
                                    className="text-[9px] uppercase tracking-wide mb-1 opacity-70"
                                  >
                                    Expires
                                  </Text>
                                  <Text
                                    style={{ color: cardStyle.textColor }}
                                    className="text-sm font-semibold font-mono tracking-wider"
                                  >
                                    {method.cardDetails.expiryMonth}/{method.cardDetails.expiryYear}
                                  </Text>
                                </View>
                              </View>
                            )}

                            {/* Contactless Indicator */}
                            <View className="absolute bottom-5 right-5">
                              <View className="flex-row">
                                {[0, 1, 2].map((i) => (
                                  <View
                                    key={i}
                                    style={{
                                      width: 16,
                                      height: 16,
                                      borderRadius: 8,
                                      borderWidth: 2,
                                      borderColor: cardStyle.textColor,
                                      opacity: 0.4,
                                      marginLeft: i > 0 ? -8 : 0,
                                    }}
                                  />
                                ))}
                              </View>
                            </View>
                          </View>

                          {/* Magnetic Strip Decoration */}
                          <View
                            className="h-12"
                            style={{
                              backgroundColor: 'rgba(0, 0, 0, 0.4)',
                            }}
                          />
                        </LinearGradient>
                      </View>

                      {/* Status Badge & Actions Below Card */}
                      <View className="mt-3 px-1 flex-row items-center justify-between">
                        <View
                          className="px-3 py-1.5 rounded-full flex-row items-center gap-1.5"
                          style={{
                            backgroundColor: getStatusColor(method.status) + '20',
                          }}
                        >
                          <View
                            style={{
                              width: 6,
                              height: 6,
                              borderRadius: 3,
                              backgroundColor: getStatusColor(method.status),
                            }}
                          />
                          <Text
                            style={{ color: getStatusColor(method.status) }}
                            className="text-xs font-bold"
                          >
                            {getStatusLabel(method.status)}
                          </Text>
                        </View>

                        {/* Quick Actions */}
                        <View className="flex-row gap-2">
                          {!method.isDefault && method.status === 'verified' && (
                            <TouchableOpacity
                              onPress={() => handleSetDefault(method.id)}
                              style={{
                                backgroundColor: colors.muted,
                                borderWidth: 1,
                                borderColor: colors.border,
                              }}
                              className="px-3 py-1.5 rounded-lg flex-row items-center gap-1.5"
                              activeOpacity={0.7}
                            >
                              <Ionicons name="star-outline" size={14} color={colors.primary} />
                              <Text style={{ color: colors.primary }} className="text-xs font-semibold">
                                Set Default
                              </Text>
                            </TouchableOpacity>
                          )}
                          <TouchableOpacity
                            onPress={() => handleRemoveMethod(method.id)}
                            style={{
                              backgroundColor: colors.muted,
                              borderWidth: 1,
                              borderColor: colors.border,
                            }}
                            className="px-3 py-1.5 rounded-lg"
                            activeOpacity={0.7}
                          >
                            <Ionicons name="trash-outline" size={14} color="#ff6b6b" />
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>

              {/* Empty State */}
              {paymentMethods.length === 0 && (
                <View className="items-center justify-center py-12">
                  <View 
                    style={{ backgroundColor: colors.muted }}
                    className="w-24 h-24 rounded-full items-center justify-center mb-4"
                  >
                    <Ionicons name="card-outline" size={48} color={colors.textMuted} />
                  </View>
                  <Text style={{ color: colors.textPrimary }} className="text-lg font-bold text-center mb-2">
                    No Payment Methods
                  </Text>
                  <Text style={{ color: colors.textSecondary }} className="text-sm text-center px-8">
                    Add a payment method to make deposits faster and easier
                  </Text>
                </View>
              )}
            </View>
          </ScrollView>

          {/* Add Card Button - Fixed at Bottom */}
          <View 
            style={{ 
              backgroundColor: colors.background,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: -4 },
              shadowOpacity: isDarkColorScheme ? 0.3 : 0.1,
              shadowRadius: 8,
              elevation: 8,
            }}
            className="absolute bottom-0 left-0 right-0 px-4 pb-6 pt-4"
          >
            <TouchableOpacity
              onPress={handleAddCard}
              style={{ backgroundColor: colors.primary }}
              className="h-14 rounded-xl flex-row items-center justify-center gap-2"
              activeOpacity={0.8}
            >
              <Ionicons name="add-circle-outline" size={24} color="white" />
              <Text className="text-white text-base font-bold">
                Add Payment Method
              </Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </SafeAreaView>
  );
}