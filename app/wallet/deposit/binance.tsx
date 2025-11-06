import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  TextInput,
  Image,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useColorScheme } from '@/lib/useColorScheme';
import { quickAmounts } from '@/data/mockWallet';
import { useWallet } from '@/services/useWallet';

export default function BinancePayDepositScreen() {
  const router = useRouter();
  const { amount: suggestedAmount } = useLocalSearchParams();
  const { colors, isDarkColorScheme } = useColorScheme();
  const { deposit } = useWallet();

  const [amount, setAmount] = useState(suggestedAmount ? suggestedAmount.toString() : '');
  const [showQR, setShowQR] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const payId = 'BLOCKS_' + Math.random().toString(36).substring(7).toUpperCase();

  const handleGenerateQR = () => {
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }
    setShowQR(true);
  };

  const handleConfirmDeposit = async () => {
    try {
      setIsProcessing(true);
      const depositAmount = parseFloat(amount);
      await deposit(depositAmount, 'Binance Pay');
      router.push({
        pathname: '/wallet/deposit/card-successfull',
        params: {
          amount: depositAmount.toString(),
          method: 'Binance Pay',
        },
      } as any);
    } catch (error) {
      Alert.alert('Error', 'Failed to process deposit');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle={isDarkColorScheme ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View
        style={{
          paddingHorizontal: 16,
          paddingTop: StatusBar.currentHeight ? StatusBar.currentHeight + 16 : 48,
          paddingBottom: 16,
          backgroundColor: `${colors.background}CC`,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              width: 40,
              height: 40,
              borderRadius: 9999,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: isDarkColorScheme ? `${colors.card}99` : colors.muted,
            }}
          >
            <MaterialIcons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={{ color: colors.textPrimary, fontSize: 18, fontWeight: 'bold' }}>
            Binance Pay
          </Text>
          <View style={{ width: 40, height: 40 }} />
        </View>
      </View>

      <ScrollView style={{ flex: 1, paddingHorizontal: 16, paddingTop: 24 }} showsVerticalScrollIndicator={false}>
        {/* Binance Logo */}
        <View style={{ alignItems: 'center', marginBottom: 24 }}>
          <View style={{
            width: 80,
            height: 80,
            borderRadius: 9999,
            backgroundColor: 'rgba(240, 185, 11, 0.2)',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 12,
          }}>
            <Text style={{ fontSize: 40 }}>💳</Text>
          </View>
          <Text style={{ color: colors.textPrimary, fontSize: 20, fontWeight: 'bold' }}>
            Pay with Binance
          </Text>
          <Text style={{ color: colors.textSecondary, fontSize: 14 }}>
            Fast and secure payment
          </Text>
        </View>

        {!showQR ? (
          <>
            {/* Amount Input */}
            <View style={{ marginBottom: 24 }}>
              <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: '500', marginBottom: 8 }}>
                Amount to Deposit
              </Text>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: 16,
                  paddingVertical: 16,
                  borderRadius: 12,
                  backgroundColor: isDarkColorScheme ? colors.card : colors.muted,
                  borderWidth: isDarkColorScheme ? 1 : 0,
                  borderColor: `${colors.primary}33`,
                }}
              >
                <MaterialIcons name="attach-money" size={24} color="#F0B90B" />
                <TextInput
                  value={amount}
                  onChangeText={setAmount}
                  keyboardType="numeric"
                  placeholder="0.00"
                  placeholderTextColor={colors.textMuted}
                  style={{
                    flex: 1,
                    marginLeft: 12,
                    fontSize: 24,
                    fontWeight: 'bold',
                    color: colors.textPrimary,
                  }}
                />
                <Text style={{ color: colors.textSecondary, fontSize: 14 }}>
                  USDC
                </Text>
              </View>

              {/* Quick Amount Buttons */}
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
                {quickAmounts.map((qa) => (
                  <TouchableOpacity
                    key={qa}
                    onPress={() => setAmount(qa.toString())}
                    style={{
                      flex: 1,
                      paddingVertical: 8,
                      borderRadius: 9999,
                      backgroundColor: amount === qa.toString()
                        ? '#F0B90B'
                        : isDarkColorScheme
                        ? `${colors.card}66`
                        : colors.muted,
                      borderWidth: amount === qa.toString() ? 0 : 1,
                      borderColor: amount === qa.toString() ? 'transparent' : 'rgba(240, 185, 11, 0.2)',
                    }}
                  >
                    <Text
                      style={{
                        textAlign: 'center',
                        fontSize: 14,
                        fontWeight: '600',
                        color: amount === qa.toString()
                          ? '#000000'
                          : colors.textPrimary,
                      }}
                    >
                      ${qa}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Benefits */}
            <View style={{
              padding: 16,
              borderRadius: 16,
              marginBottom: 24,
              backgroundColor: colors.card,
            }}>
              <Text style={{ color: colors.textPrimary, fontWeight: 'bold', marginBottom: 12 }}>
                Why Binance Pay?
              </Text>
              <View style={{ gap: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <MaterialIcons name="check-circle" size={20} color={colors.primary} />
                  <Text style={{ marginLeft: 12, color: colors.textSecondary }}>
                    Instant deposits
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <MaterialIcons name="check-circle" size={20} color={colors.primary} />
                  <Text style={{ marginLeft: 12, color: colors.textSecondary }}>
                    Low transaction fees
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <MaterialIcons name="check-circle" size={20} color={colors.primary} />
                  <Text style={{ marginLeft: 12, color: colors.textSecondary }}>
                    Secure and verified
                  </Text>
                </View>
              </View>
            </View>

            {/* Fee Info */}
            <View style={{
              padding: 16,
              borderRadius: 16,
              marginBottom: 24,
              backgroundColor: isDarkColorScheme ? `${colors.card}66` : colors.muted,
            }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text style={{ color: colors.textSecondary }}>
                  Deposit Amount
                </Text>
                <Text style={{ color: colors.textPrimary, fontWeight: '500' }}>
                  ${parseFloat(amount || '0').toFixed(2)}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text style={{ color: colors.textSecondary }}>
                  Processing Fee
                </Text>
                <Text style={{ color: colors.primary, fontWeight: '500' }}>$0.00</Text>
              </View>
              <View style={{ height: 1, marginVertical: 8, backgroundColor: colors.border }} />
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ color: colors.textPrimary, fontWeight: 'bold' }}>
                  You'll Receive
                </Text>
                <Text style={{ color: '#F0B90B', fontWeight: 'bold' }}>
                  ${parseFloat(amount || '0').toFixed(2)} USDC
                </Text>
              </View>
            </View>
          </>
        ) : (
          <>
            {/* QR Code Screen */}
            <View style={{
              alignItems: 'center',
              padding: 24,
              borderRadius: 16,
              marginBottom: 24,
              backgroundColor: colors.card,
            }}>
              <Text style={{ color: colors.textPrimary, fontSize: 18, fontWeight: 'bold', marginBottom: 16 }}>
                Scan to Pay
              </Text>
              <View style={{
                width: 224,
                height: 224,
                backgroundColor: '#FFFFFF',
                padding: 12,
                borderRadius: 12,
                marginBottom: 16,
              }}>
                <Image
                  source={{
                    uri: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=binancepay://${payId}`,
                  }}
                  style={{ width: '100%', height: '100%' }}
                  resizeMode="contain"
                />
              </View>
              <View style={{
                width: '100%',
                padding: 12,
                borderRadius: 12,
                backgroundColor: isDarkColorScheme ? colors.background : colors.muted,
              }}>
                <Text style={{
                  textAlign: 'center',
                  fontFamily: 'monospace',
                  fontSize: 14,
                  color: colors.textPrimary,
                }}>
                  {payId}
                </Text>
              </View>
              <Text style={{
                textAlign: 'center',
                marginTop: 16,
                color: colors.textSecondary,
              }}>
                Open Binance app and scan this QR code to complete payment
              </Text>
            </View>

            {/* Status */}
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              padding: 16,
              borderRadius: 16,
              backgroundColor: colors.card,
            }}>
              <View style={{
                width: 8,
                height: 8,
                borderRadius: 9999,
                backgroundColor: '#F0B90B',
                marginRight: 12,
              }} />
              <Text style={{ color: '#F0B90B', fontWeight: '500' }}>Waiting for payment...</Text>
            </View>

            {/* Cancel Button */}
            <TouchableOpacity
              onPress={handleConfirmDeposit}
              disabled={isProcessing}
              style={{
                backgroundColor: colors.primary,
                marginTop: 16,
                paddingVertical: 16,
                borderRadius: 12,
                alignItems: 'center',
                opacity: isProcessing ? 0.6 : 1,
              }}
            >
              <Text style={{ color: colors.primaryForeground, fontWeight: '600', fontSize: 16 }}>
                {isProcessing ? 'Processing...' : 'I\'ve Completed Payment'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setShowQR(false)}
              style={{
                marginTop: 16,
                paddingVertical: 12,
                borderRadius: 12,
                alignItems: 'center',
              }}
            >
              <Text style={{ color: colors.primary, fontWeight: '600' }}>Cancel Payment</Text>
            </TouchableOpacity>
          </>
        )}

        <View style={{ height: 128 }} />
      </ScrollView>

      {/* Bottom CTA */}
      {!showQR && (
        <View
          style={{
            paddingHorizontal: 16,
            paddingVertical: 16,
            borderTopWidth: 1,
            borderTopColor: colors.border,
            backgroundColor: `${colors.background}CC`,
          }}
        >
          <TouchableOpacity
            onPress={handleGenerateQR}
            style={{
              backgroundColor: '#F0B90B',
              paddingVertical: 16,
              borderRadius: 12,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ color: '#000000', fontSize: 18, fontWeight: 'bold' }}>
              Generate Payment QR
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

