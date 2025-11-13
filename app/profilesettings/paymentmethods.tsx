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
import { useRouter } from "expo-router";
import { useColorScheme } from "@/lib/useColorScheme";
import { paymentMethodsApi, PaymentMethod } from "@/services/api/paymentMethods.api";

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
      await paymentMethodsApi.setDefaultPaymentMethod(methodId, true);
      await loadPaymentMethods();
      Alert.alert('Success', 'Default payment method updated');
    } catch (error: any) {
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

  const getCardIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'visa':
        return 'card';
      case 'mastercard':
        return 'card';
      default:
        return 'card-outline';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified':
        return '#10B981'; // green
      case 'pending':
        return '#F59E0B'; // amber
      case 'disabled':
        return '#EF4444'; // red
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
                    <Ionicons name="information-circle" size={24} color={colors.primary} />
                  </View>
                  <View className="flex-1">
                    <Text style={{ color: colors.textPrimary }} className="text-sm font-semibold mb-1">
                      Secure Payment Methods
                    </Text>
                    <Text style={{ color: colors.textSecondary }} className="text-xs leading-relaxed">
                      Your payment methods are encrypted and secured. Add cards to make deposits faster. Cards are ready to use immediately.
                    </Text>
                  </View>
                </View>
              </View>

              {/* Payment Methods List */}
              <View className="flex flex-col gap-4">
                {paymentMethods.map((method) => (
                  <View
                    key={method.id}
                    className="overflow-hidden rounded-xl"
                    style={{
                      backgroundColor: colors.card,
                      borderWidth: method.isDefault ? 2 : 1,
                      borderColor: method.isDefault ? colors.primary : colors.border,
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.15,
                      shadowRadius: 4,
                      elevation: 3,
                    }}
                  >
                    <View className="p-4">
                      {/* Header */}
                      <View className="flex-row items-center justify-between mb-3">
                        <View className="flex-row items-center gap-3">
                          <View 
                            style={{ backgroundColor: colors.primary + '20' }}
                            className="w-12 h-12 rounded-full items-center justify-center"
                          >
                            <Ionicons 
                              name={method.type === 'card' ? 'card' : 'wallet'} 
                              size={24} 
                              color={colors.primary} 
                            />
                          </View>
                          <View>
                            <Text style={{ color: colors.textPrimary }} className="text-base font-bold">
                              {method.provider}
                            </Text>
                            <Text style={{ color: colors.textSecondary }} className="text-xs capitalize">
                              {method.type}
                            </Text>
                          </View>
                        </View>
                        {method.isDefault && (
                          <View className="bg-[#FFD700]/25 px-3 py-1.5 rounded-full flex-row items-center gap-1.5">
                            <Ionicons name="star" size={14} color="#FFD700" />
                            <Text className="text-[#FFD700] text-xs font-bold">
                              DEFAULT
                            </Text>
                          </View>
                        )}
                      </View>

                      {/* Card Details */}
                      {method.cardDetails && (
                        <View className="mb-3">
                          <Text style={{ color: colors.textPrimary }} className="text-lg font-mono tracking-widest mb-1">
                            {method.cardDetails.cardNumber}
                          </Text>
                          <Text style={{ color: colors.textSecondary }} className="text-sm">
                            {method.cardDetails.cardholderName}
                          </Text>
                          <Text style={{ color: colors.textSecondary }} className="text-xs mt-1">
                            Expires {method.cardDetails.expiryMonth}/{method.cardDetails.expiryYear}
                          </Text>
                        </View>
                      )}

                      {/* Status */}
                      <View className="flex-row items-center gap-2 mb-3">
                        <View 
                          style={{ backgroundColor: getStatusColor(method.status) + '20' }}
                          className="px-2 py-1 rounded-full"
                        >
                          <Text 
                            style={{ color: getStatusColor(method.status) }} 
                            className="text-xs font-semibold"
                          >
                            {getStatusLabel(method.status)}
                          </Text>
                        </View>
                      </View>

                      {/* Actions */}
                      <View className="flex-row gap-2">
                        {!method.isDefault && method.status === 'verified' && (
                          <TouchableOpacity
                            onPress={() => handleSetDefault(method.id)}
                            style={{ backgroundColor: colors.primary + '20' }}
                            className="flex-1 px-3 py-2.5 rounded-lg flex-row items-center justify-center gap-2"
                            activeOpacity={0.7}
                          >
                            <Ionicons name="star-outline" size={16} color={colors.primary} />
                            <Text style={{ color: colors.primary }} className="text-xs font-semibold">
                              Set as Default
                            </Text>
                          </TouchableOpacity>
                        )}
                        <TouchableOpacity
                          onPress={() => handleRemoveMethod(method.id)}
                          style={{ 
                            backgroundColor: colors.card,
                            borderWidth: 1,
                            borderColor: colors.border
                          }}
                          className="flex-1 px-3 py-2.5 rounded-lg flex-row items-center justify-center gap-2"
                          activeOpacity={0.7}
                        >
                          <Ionicons name="trash-outline" size={16} color="#ff6b6b" />
                          <Text className="text-[#ff6b6b] text-xs font-semibold">
                            Remove
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                ))}
              </View>

              {/* Empty State */}
              {paymentMethods.length === 0 && (
                <View className="items-center justify-center py-12">
                  <View 
                    style={{ backgroundColor: colors.card }}
                    className="w-20 h-20 rounded-full items-center justify-center mb-4"
                  >
                    <Ionicons name="card-outline" size={40} color={colors.textMuted} />
                  </View>
                  <Text style={{ color: colors.textSecondary }} className="text-base text-center mb-2">
                    No Payment Methods
                  </Text>
                  <Text style={{ color: colors.textMuted }} className="text-sm text-center px-8">
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

