import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/lib/useColorScheme';
import { useWallet } from '@/services/useWallet';
import { MarketplaceListing } from '@/services/api/marketplace.api';
import { marketplaceAPI } from '@/services/api/marketplace.api';
import { AppAlert } from '@/components/AppAlert';
import { useRouter } from 'expo-router';

interface BuyTokenModalProps {
  visible: boolean;
  listing: MarketplaceListing | null;
  allPropertyListings?: MarketplaceListing[]; // All listings for the same property
  onClose: () => void;
  onSuccess?: () => void;
}

export function BuyTokenModal({
  visible,
  listing,
  allPropertyListings,
  onClose,
  onSuccess,
}: BuyTokenModalProps) {
  const router = useRouter();
  const { colors, isDarkColorScheme } = useColorScheme();
  const { balance } = useWallet();
  const [tokensToBuy, setTokensToBuy] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [alertState, setAlertState] = useState<{
    visible: boolean;
    title: string;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
    onConfirm?: () => void;
  }>({
    visible: false,
    title: '',
    message: '',
    type: 'info',
  });

  const handleAmountChange = (text: string) => {
    if (text === '' || /^\d*\.?\d{0,6}$/.test(text)) {
      setTokensToBuy(text);
    }
  };

  const handleMaxTokens = () => {
    if (listing) {
      // Calculate max tokens from all available listings
      const availableListings = (allPropertyListings || [listing])
        .filter(l => l.propertyId === listing.propertyId && l.status === 'active');
      const totalAvailable = availableListings.reduce((sum, l) => sum + l.remainingTokens, 0);
      setTokensToBuy(totalAvailable.toString());
    }
  };

  // Calculate purchase breakdown across multiple listings
  const calculatePurchaseBreakdown = useMemo(() => {
    if (!listing || !tokensToBuy) {
      return { breakdown: [], total: 0, totalTokens: 0 };
    }

    const tokens = parseFloat(tokensToBuy);
    if (isNaN(tokens) || tokens <= 0) {
      return { breakdown: [], total: 0, totalTokens: 0 };
    }

    // Get all available listings for this property, sorted by price (low to high)
    const availableListings = (allPropertyListings || [listing])
      .filter(l => l.propertyId === listing.propertyId && l.status === 'active')
      .sort((a, b) => a.pricePerToken - b.pricePerToken);

    const breakdown: Array<{
      price: number;
      tokens: number;
      listings: MarketplaceListing[];
      total: number;
    }> = [];

    let remainingTokens = tokens;
    let totalAmount = 0;

    // Group listings by price
    const priceGroups = new Map<number, MarketplaceListing[]>();
    availableListings.forEach((l) => {
      const price = l.pricePerToken;
      if (!priceGroups.has(price)) {
        priceGroups.set(price, []);
      }
      priceGroups.get(price)!.push(l);
    });

    // Process each price tier from lowest to highest
    const sortedPrices = Array.from(priceGroups.keys()).sort((a, b) => a - b);

    for (const price of sortedPrices) {
      if (remainingTokens <= 0) break;

      const listingsAtPrice = priceGroups.get(price)!;
      const availableAtPrice = listingsAtPrice.reduce((sum, l) => sum + l.remainingTokens, 0);

      if (availableAtPrice > 0) {
        const tokensToTake = Math.min(remainingTokens, availableAtPrice);
        breakdown.push({
          price,
          tokens: tokensToTake,
          listings: listingsAtPrice,
          total: tokensToTake * price,
        });
        totalAmount += tokensToTake * price;
        remainingTokens -= tokensToTake;
      }
    }

    return {
      breakdown,
      total: totalAmount,
      totalTokens: tokens - remainingTokens, // Actual tokens that can be purchased
      insufficientTokens: remainingTokens > 0,
    };
  }, [listing, tokensToBuy, allPropertyListings]);

  const calculateTotal = () => {
    return calculatePurchaseBreakdown.total;
  };

  const validatePurchase = () => {
    if (!listing) return { valid: false, error: 'Listing not found' };

    const tokens = parseFloat(tokensToBuy);
    if (isNaN(tokens) || tokens <= 0) {
      return { valid: false, error: 'Please enter a valid token amount' };
    }

    const { totalTokens, insufficientTokens } = calculatePurchaseBreakdown;

    // Check if we can fulfill the requested amount
    if (insufficientTokens || totalTokens < tokens) {
      const availableListings = (allPropertyListings || [listing])
        .filter(l => l.propertyId === listing.propertyId && l.status === 'active');
      const totalAvailable = availableListings.reduce((sum, l) => sum + l.remainingTokens, 0);
      return {
        valid: false,
        error: `Only ${totalAvailable.toFixed(2)} tokens available across all listings`,
      };
    }

    const total = calculateTotal();
    // if (total < listing.minOrderUSDT) {
    //   return {
    //     valid: false,
    //     error: `Minimum order is ${listing.minOrderUSDT.toFixed(2)} USDT`,
    //   };
    // }

    // if (total > listing.maxOrderUSDT) {
    //   return {
    //     valid: false,
    //     error: `Maximum order is ${listing.maxOrderUSDT.toFixed(2)} USDT`,
    //   };
    // }

    if (total > balance.usdc) {
      return {
        valid: false,
        error: `Insufficient balance. Available: ${balance.usdc.toFixed(2)} USDC`,
      };
    }

    return { valid: true, error: null };
  };

  const handleBuy = async () => {
    if (!listing) return;

    const validation = validatePurchase();
    if (!validation.valid) {
      setAlertState({
        visible: true,
        title: 'Invalid Purchase',
        message: validation.error || 'Please check your input',
        type: 'error',
        onConfirm: () => setAlertState((prev) => ({ ...prev, visible: false })),
      });
      return;
    }

    setIsProcessing(true);
    try {
      const { breakdown } = calculatePurchaseBreakdown;
      let totalTokensPurchased = 0;
      const errors: string[] = [];

      // Process each price tier
      for (const item of breakdown) {
        let remainingTokensForPrice = item.tokens;

        // Distribute tokens across listings at this price
        for (const listingAtPrice of item.listings) {
          if (remainingTokensForPrice <= 0) break;

          const tokensFromThisListing = Math.min(
            remainingTokensForPrice,
            listingAtPrice.remainingTokens
          );

          if (tokensFromThisListing > 0) {
            try {
              await marketplaceAPI.buyTokens(listingAtPrice.id, {
                listingId: listingAtPrice.id,
                tokensToBuy: tokensFromThisListing,
              });
              totalTokensPurchased += tokensFromThisListing;
              remainingTokensForPrice -= tokensFromThisListing;
            } catch (error: any) {
              errors.push(
                `Failed to buy ${tokensFromThisListing} tokens at $${item.price.toFixed(2)}: ${error.message || 'Unknown error'}`
              );
            }
          }
        }
      }

      if (errors.length > 0) {
        setAlertState({
          visible: true,
          title: 'Partial Purchase',
          message: `Purchased ${totalTokensPurchased.toFixed(2)} tokens. Some errors occurred:\n${errors.join('\n')}`,
          type: totalTokensPurchased > 0 ? 'warning' : 'error',
          onConfirm: () => {
            setAlertState((prev) => ({ ...prev, visible: false }));
            if (totalTokensPurchased > 0) {
              setTokensToBuy('');
              onClose();
              if (onSuccess) {
                onSuccess();
              }
            }
          },
        });
      } else {
        setAlertState({
          visible: true,
          title: 'Purchase Successful!',
          message: `You successfully purchased ${totalTokensPurchased.toFixed(2)} tokens`,
          type: 'success',
          onConfirm: () => {
            setAlertState((prev) => ({ ...prev, visible: false }));
            setTokensToBuy('');
            onClose();
            if (onSuccess) {
              onSuccess();
            } else {
              router.back();
            }
          },
        });
      }
    } catch (error: any) {
      setAlertState({
        visible: true,
        title: 'Purchase Failed',
        message: error.message || 'Failed to complete purchase',
        type: 'error',
        onConfirm: () => {
          setAlertState((prev) => ({ ...prev, visible: false }));
        },
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const total = calculateTotal();
  const validation = validatePurchase();

  if (!listing) return null;

  return (
    <>
      <Modal
        visible={visible}
        animationType="slide"
        transparent={true}
        onRequestClose={onClose}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <View
            style={{
              flex: 1,
              backgroundColor: 'rgba(0,0,0,0.5)',
              justifyContent: 'flex-end',
            }}
          >
            <View
              style={{
                backgroundColor: colors.card,
                borderTopLeftRadius: 24,
                borderTopRightRadius: 24,
                padding: 24,
                maxHeight: '90%',
              }}
            >
              <View className="flex-row items-center justify-between mb-6">
                <Text style={{ color: colors.textPrimary }} className="text-2xl font-bold">
                  Buy Tokens
                </Text>
                <TouchableOpacity onPress={onClose}>
                  <Ionicons name="close" size={28} color={colors.textMuted} />
                </TouchableOpacity>
              </View>
              
              <ScrollView>
              {/* Property Info */}
              <View
                style={{
                  backgroundColor: isDarkColorScheme
                    ? 'rgba(255,255,255,0.05)'
                    : 'rgba(6,78,59,0.05)',
                  borderRadius: 12,
                  padding: 12,
                  marginBottom: 20,
                }}
              >
                <Text
                  style={{ color: colors.textPrimary }}
                  className="font-semibold mb-1"
                >
                  {listing.property.title}
                </Text>
                <Text style={{ color: colors.textMuted }} className="text-xs">
                  {listing.property.displayCode} • ${listing.pricePerToken.toFixed(2)} per token
                </Text>
              </View>

              {/* Token Amount Input */}
              <View className="mb-4">
                <Text style={{ color: colors.textMuted }} className="text-sm mb-2">
                  Amount to Buy
                </Text>
                <View
                  style={{
                    backgroundColor: colors.background,
                    borderRadius: 16,
                    padding: 20,
                    borderWidth: 1,
                    borderColor: validation.valid && tokensToBuy
                      ? colors.primary
                      : colors.border,
                  }}
                >
                  <View className="flex-row items-center justify-between">
                    <TextInput
                      style={{
                        color: colors.textPrimary,
                        fontSize: 32,
                        fontWeight: 'bold',
                        flex: 1,
                      }}
                      value={tokensToBuy}
                      onChangeText={handleAmountChange}
                      placeholder="0"
                      placeholderTextColor={colors.textMuted}
                      keyboardType="decimal-pad"
                    />
                    <View className="items-end">
                      <Text style={{ color: colors.textMuted }} className="text-sm mb-1">
                        Tokens
                      </Text>
                      <TouchableOpacity
                        onPress={handleMaxTokens}
                        style={{
                          backgroundColor: colors.primary,
                          paddingHorizontal: 12,
                          paddingVertical: 6,
                          borderRadius: 8,
                        }}
                      >
                        <Text style={{ color: '#ffffff' }} className="text-xs font-semibold">
                          MAX
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                  <Text style={{ color: colors.textMuted }} className="text-xs mt-2">
                    Max: {(() => {
                      const availableListings = (allPropertyListings || [listing])
                        .filter(l => l.propertyId === listing.propertyId && l.status === 'active');
                      const totalAvailable = availableListings.reduce((sum, l) => sum + l.remainingTokens, 0);
                      return totalAvailable.toFixed(2);
                    })()} tokens
                  </Text>
                </View>
              </View>

              {/* Purchase Breakdown */}
              {tokensToBuy && calculatePurchaseBreakdown.breakdown.length > 0 && (
                <View
                  style={{
                    backgroundColor: colors.background,
                    borderRadius: 16,
                    padding: 16,
                    marginBottom: 16,
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                >
                  <Text style={{ color: colors.textPrimary }} className="text-sm font-semibold mb-3">
                    Purchase Breakdown
                  </Text>
                  {calculatePurchaseBreakdown.breakdown.map((item, index) => (
                    <View
                      key={index}
                      style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        paddingVertical: 8,
                        borderBottomWidth: index < calculatePurchaseBreakdown.breakdown.length - 1 ? 1 : 0,
                        borderBottomColor: colors.border,
                      }}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: colors.textMuted }} className="text-xs">
                          {item.tokens.toFixed(2)} tokens @ ${item.price.toFixed(2)}
                        </Text>
                        <Text style={{ color: colors.textMuted }} className="text-xs mt-1">
                          {item.listings.length} {item.listings.length === 1 ? 'listing' : 'listings'}
                        </Text>
                      </View>
                      <Text style={{ color: colors.textPrimary }} className="text-sm font-semibold">
                        ${item.total.toFixed(2)}
                      </Text>
                    </View>
                  ))}
                  <View
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      paddingTop: 12,
                      marginTop: 8,
                      borderTopWidth: 1,
                      borderTopColor: colors.border,
                    }}
                  >
                    <View>
                      <Text style={{ color: colors.textMuted }} className="text-xs">
                        Total Tokens
                      </Text>
                      <Text style={{ color: colors.textPrimary }} className="text-sm font-semibold">
                        {calculatePurchaseBreakdown.totalTokens.toFixed(2)} tokens
                      </Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={{ color: colors.textMuted }} className="text-xs">
                        Total Amount
                      </Text>
                      <Text style={{ color: colors.primary }} className="text-base font-bold">
                        ${total.toFixed(2)}
                      </Text>
                    </View>
                  </View>
                </View>
              )}

              {/* Total Cost */}
              <View
                style={{
                //   backgroundColor: colors.primary + '20',
                  borderRadius: 16,
                  padding: 20,
                  marginBottom: 20,
                }}
              >
                <Text style={{ color: colors.textMuted }} className="text-sm mb-2">
                  You will pay
                </Text>
                <Text style={{ color: colors.primary }} className="text-3xl font-bold">
                  ${total.toFixed(2)} USDT
                </Text>
                {tokensToBuy && calculatePurchaseBreakdown.breakdown.length === 0 && (
                  <Text style={{ color: colors.textMuted }} className="text-xs mt-2">
                    ≈ {tokensToBuy} tokens × ${listing.pricePerToken.toFixed(2)}
                  </Text>
                )}
              </View>

              {/* Wallet Balance */}
              <View
                style={{
                  backgroundColor: colors.background,
                  borderRadius: 12,
                  padding: 16,
                  marginBottom: 20,
                }}
              >
                <View className="flex-row items-center justify-between">
                  <Text style={{ color: colors.textMuted }} className="text-sm">
                    Available Balance
                  </Text>
                  <Text style={{ color: colors.textPrimary }} className="text-sm font-semibold">
                    ${balance.usdc.toFixed(2)} USDC
                  </Text>
                </View>
              </View>

              {/* Buy Button */}
              <TouchableOpacity
                onPress={handleBuy}
                disabled={!validation.valid || isProcessing}
                style={{
                  backgroundColor:
                    validation.valid && tokensToBuy ? colors.primary : colors.border,
                  borderRadius: 16,
                  paddingVertical: 18,
                  alignItems: 'center',
                  opacity: validation.valid && tokensToBuy ? 1 : 0.6,
                }}
              >
                {isProcessing ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={{ color: '#ffffff' }} className="text-lg font-bold">
                    Confirm Purchase
                  </Text>
                )}
              </TouchableOpacity>

              {!validation.valid && tokensToBuy && (
                <Text
                  style={{ color: colors.destructive }}
                  className="text-xs text-center mt-3"
                >
                  {validation.error}
                </Text>
              )}
              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <AppAlert
        visible={alertState.visible}
        title={alertState.title}
        message={alertState.message}
        type={alertState.type}
        onConfirm={() => {
          if (alertState.onConfirm) {
            alertState.onConfirm();
          } else {
            setAlertState((prev) => ({ ...prev, visible: false }));
          }
        }}
      />
    </>
  );
}

