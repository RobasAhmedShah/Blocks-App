import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useColorScheme } from '@/lib/useColorScheme';
import { marketplaceAPI } from '@/services/api/marketplace.api';
import { usePortfolio } from '@/services/usePortfolio';
import { LinearGradient } from 'expo-linear-gradient';
import { AppAlert } from '@/components/AppAlert';
import { useAuth } from '@/contexts/AuthContext';
import { SignInGate } from '@/components/common/SignInGate';

export default function SellTokensScreen() {
  const router = useRouter();
  const { colors, isDarkColorScheme } = useColorScheme();
  const { isAuthenticated, isGuest } = useAuth();
  const { investments, loadInvestments } = usePortfolio();
  const [selectedProperty, setSelectedProperty] = useState<any>(null);
  const [availableTokens, setAvailableTokens] = useState<string>('0');
  const [pricePerToken, setPricePerToken] = useState('');
  const [tokensToSell, setTokensToSell] = useState('');
  const [totalValueUSDT, setTotalValueUSDT] = useState(''); // Editable selling amount
  const [loadingAvailable, setLoadingAvailable] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPropertySelector, setShowPropertySelector] = useState(false);
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

  useEffect(() => {
    if (isAuthenticated && !isGuest && loadInvestments) {
      loadInvestments();
    }
  }, [isAuthenticated, isGuest, loadInvestments]);

  useEffect(() => {
    if (selectedProperty) {
      loadAvailableTokens();
    }
  }, [selectedProperty]);

  const loadAvailableTokens = async () => {
    if (!selectedProperty) {
      setAvailableTokens('0');
      return;
    }
    
    // Use tokens from investment directly instead of calling API
    // The investment object already contains the user's token balance
    const tokens = selectedProperty.tokens || 0;
    setAvailableTokens(tokens.toString());
    
    // Optionally, we could subtract tokens that are already listed for sale
    // But for now, we'll use the full token balance as available
    try {
      setLoadingAvailable(true);
      // Check if there are any active listings for this property to calculate remaining tokens
      const propertyId = selectedProperty.property?.id;
      if (propertyId) {
        try {
          const myListings = await marketplaceAPI.getMyListings();
          const activeListingsForProperty = myListings.filter(
            (listing) => listing.propertyId === propertyId && listing.status === 'active'
          );
          
          // Calculate total tokens already listed
          const listedTokens = activeListingsForProperty.reduce(
            (sum, listing) => sum + (listing.totalTokens - listing.remainingTokens),
            0
          );
          
          // Available tokens = owned tokens - tokens already listed
          const available = Math.max(0, tokens - listedTokens);
          setAvailableTokens(available.toString());
        } catch (error) {
          // If fetching listings fails, just use the full token balance
          console.log('Could not fetch listings, using full token balance');
          setAvailableTokens(tokens.toString());
        }
      } else {
        setAvailableTokens(tokens.toString());
      }
    } catch (error: any) {
      console.error('Failed to load available tokens:', error);
      // Fallback to using investment tokens directly
      const tokens = selectedProperty.tokens || 0;
      setAvailableTokens(tokens.toString());
    } finally {
      setLoadingAvailable(false);
    }
  };

  const handlePropertySelect = (investment: any) => {
    setSelectedProperty(investment);
    setShowPropertySelector(false);
    // Auto-fill price with property's current price (or suggest market price)
    // Mobile API returns tokenPrice, not pricePerTokenUSDT
    if (investment.property?.tokenPrice) {
      setPricePerToken(investment.property.tokenPrice.toString());
    }
  };

  const handleTokensChange = (text: string) => {
    if (text === '' || /^\d*\.?\d{0,6}$/.test(text)) {
      setTokensToSell(text);
      // Auto-suggest selling price when tokens change (user can edit it)
      if (text && pricePerToken) {
        const tokens = parseFloat(text);
        const price = parseFloat(pricePerToken);
        if (!isNaN(tokens) && !isNaN(price) && tokens > 0) {
          const suggestedPrice = tokens * price;
          setTotalValueUSDT(suggestedPrice.toFixed(2));
        } else {
          setTotalValueUSDT('');
        }
      } else {
        setTotalValueUSDT('');
      }
    }
  };

  // Price per token is now read-only, so we don't need handlePriceChange
  // It's set automatically when property is selected

  // Handle selling price/amount change (user can edit this)
  const handleSellingPriceChange = (text: string) => {
    if (text === '' || /^\d*\.?\d{0,2}$/.test(text)) {
      setTotalValueUSDT(text);
      // Min/max are calculated on-the-fly, not stored
    }
  };

  // Calculate suggested selling price based on market price
  const getSuggestedSellingPrice = () => {
    const tokens = parseFloat(tokensToSell) || 0;
    const price = parseFloat(pricePerToken) || 0;
    return tokens * price;
  };

  // Calculate min/max limits (10% decrease/increase from selling price)
  const getMinLimit = () => {
    const sellingPrice = parseFloat(totalValueUSDT) || 0;
    return sellingPrice * 0.9;
  };

  const getMaxLimit = () => {
    const sellingPrice = parseFloat(totalValueUSDT) || 0;
    return sellingPrice * 1.1;
  };

  const handleQuickSelect = (percentage: number) => {
    if (!availableTokens) return;
    const available = parseFloat(availableTokens);
    const tokens = (available * percentage) / 100;
    setTokensToSell(tokens.toFixed(2));
    handleTokensChange(tokens.toFixed(2));
  };

  const calculateTotalValue = () => {
    // Use the editable total value if available, otherwise calculate from tokens × price
    if (totalValueUSDT) {
      return parseFloat(totalValueUSDT) || 0;
    }
    const tokens = parseFloat(tokensToSell) || 0;
    const price = parseFloat(pricePerToken) || 0;
    return tokens * price;
  };

  const validateForm = () => {
    if (!selectedProperty) {
      return { valid: false, error: 'Please select a property' };
    }

    const tokens = parseFloat(tokensToSell);
    const available = parseFloat(availableTokens);

    if (isNaN(tokens) || tokens <= 0) {
      return { valid: false, error: 'Please enter a valid token amount' };
    }

    // Minimum 0.1 tokens required
    if (tokens < 0.1) {
      return { valid: false, error: 'Minimum 0.1 tokens required to sell' };
    }

    if (tokens > available) {
      return {
        valid: false,
        error: `Only ${available.toFixed(2)} tokens available`,
      };
    }

    const price = parseFloat(pricePerToken);
    if (isNaN(price) || price <= 0) {
      return { valid: false, error: 'Please enter a valid price per token' };
    }

    const sellingPrice = parseFloat(totalValueUSDT);
    if (isNaN(sellingPrice) || sellingPrice <= 0) {
      return { valid: false, error: 'Please enter a valid selling price' };
    }

    // Validate selling price is within suggested range (±10%)
    const suggestedPrice = getSuggestedSellingPrice();
    const minLimit = suggestedPrice * 0.9;
    const maxLimit = suggestedPrice * 1.1;

    if (sellingPrice < minLimit) {
      return { 
        valid: false, 
        error: `Selling price too low. Minimum: $${minLimit.toFixed(2)} (90% of market value)` 
      };
    }

    if (sellingPrice > maxLimit) {
      return { 
        valid: false, 
        error: `Selling price too high. Maximum: $${maxLimit.toFixed(2)} (110% of market value)` 
      };
    }

    return { valid: true, error: null };
  };

  const handlePublish = async () => {
    const validation = validateForm();
    if (!validation.valid) {
      setAlertState({
        visible: true,
        title: 'Invalid Listing',
        message: validation.error || 'Please check your input',
        type: 'error',
        onConfirm: () => setAlertState((prev) => ({ ...prev, visible: false })),
      });
      return;
    }

    setIsProcessing(true);
    try {
      // Get propertyId from investment - mobile API returns property.id
      const propertyId = selectedProperty.property?.id;
      if (!propertyId) {
        throw new Error('Property ID not found');
      }

      // Use the editable selling price to calculate actual price per token for listing
      const tokens = parseFloat(tokensToSell);
      const sellingPrice = parseFloat(totalValueUSDT);
      const actualPricePerToken = tokens > 0 ? sellingPrice / tokens : parseFloat(pricePerToken);
      
      // Calculate min/max based on selling price (90% and 110%)
      const minOrder = sellingPrice * 0.9;
      const maxOrder = sellingPrice * 1.1;

      await marketplaceAPI.createListing({
        propertyId: propertyId,
        pricePerToken: actualPricePerToken,
        totalTokens: tokens,
        minOrderUSDT: minOrder,
        maxOrderUSDT: maxOrder,
      });

      setAlertState({
        visible: true,
        title: 'Listing Published!',
        message: 'Your tokens are now available for purchase on the marketplace',
        type: 'success',
        onConfirm: () => {
          setAlertState((prev) => ({ ...prev, visible: false }));
          router.back();
        },
      });
    } catch (error: any) {
      setAlertState({
        visible: true,
        title: 'Publish Failed',
        message: error.message || 'Failed to publish listing',
        type: 'error',
        onConfirm: () => {
          setAlertState((prev) => ({ ...prev, visible: false }));
        },
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (isGuest || !isAuthenticated) {
    return <SignInGate />;
  }

  const totalValue = calculateTotalValue();
  const validation = validateForm();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle={isDarkColorScheme ? 'light-content' : 'dark-content'} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          {/* Header */}
          <LinearGradient
            colors={
              isDarkColorScheme ? ['#022c22', '#064e3b'] : ['#ecfdf5', '#d1fae5']
            }
            className="px-4 pb-6"
            style={{ paddingTop: StatusBar.currentHeight ? StatusBar.currentHeight + 16 : 48 }}
          >
            <View className="flex-row items-center justify-between mb-4">
              <TouchableOpacity onPress={() => router.back()}>
                <Ionicons name="arrow-back" size={24} color={isDarkColorScheme ? '#ffffff' : '#064e3b'} />
              </TouchableOpacity>
              <Text
                style={{ color: isDarkColorScheme ? '#ffffff' : '#064e3b' }}
                className="text-xl font-bold"
              >
                Sell Tokens
              </Text>
              <View style={{ width: 24 }} />
            </View>
          </LinearGradient>

          <View className="px-4 py-6">
            {/* Property Selector */}
            <TouchableOpacity
              onPress={() => setShowPropertySelector(true)}
              style={{
                backgroundColor: colors.card,
                borderRadius: 16,
                padding: 20,
                marginBottom: 24,
                borderWidth: 1,
                borderColor: selectedProperty ? colors.primary : colors.border,
                borderStyle: selectedProperty ? 'solid' : 'dashed',
              }}
            >
              {selectedProperty ? (
                <View>
                  <View className="flex-row items-center mb-2">
                    {selectedProperty.property?.images?.[0] && (
                      <Image
                        source={{ uri: selectedProperty.property.images[0] }}
                        style={{ width: 60, height: 60, borderRadius: 12, marginRight: 12 }}
                      />
                    )}
                    <View className="flex-1">
                      <Text
                        style={{ color: colors.textPrimary }}
                        className="text-lg font-bold mb-1"
                      >
                        {selectedProperty.property?.title || 'Property'}
                      </Text>
                      <Text style={{ color: colors.textMuted }} className="text-sm">
                        {selectedProperty.property?.city || 'Location'}
                      </Text>
                    </View>
                  </View>
                  {loadingAvailable ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : (
                    <View className="flex-row justify-between mt-3">
                      <View>
                        <Text style={{ color: colors.textMuted }} className="text-xs mb-1">
                          Available Tokens
                        </Text>
                        <Text style={{ color: colors.textPrimary }} className="text-lg font-bold">
                          {parseFloat(availableTokens).toFixed(2)}
                        </Text>
                      </View>
                      <View className="items-end">
                        <Text style={{ color: colors.textMuted }} className="text-xs mb-1">
                          Current Value
                        </Text>
                        <Text style={{ color: colors.primary }} className="text-lg font-bold">
                          $
                          {(
                            parseFloat(availableTokens) *
                            (selectedProperty.property?.tokenPrice || 0)
                          ).toFixed(2)}
                        </Text>
                      </View>
                    </View>
                  )}
                </View>
              ) : (
                <View className="items-center py-4">
                  <MaterialIcons name="add-business" size={48} color={colors.textMuted} />
                  <Text style={{ color: colors.textMuted }} className="text-base mt-2">
                    Select Property to Sell
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            {selectedProperty && (
              <>
                {/* Price per Token (Read-only) */}
                <View className="mb-4">
                  <Text style={{ color: colors.textMuted }} className="text-sm mb-2">
                    Price per Token (USDT)
                  </Text>
                  <View
                    style={{
                      backgroundColor: colors.card,
                      borderRadius: 16,
                      padding: 20,
                      borderWidth: 1,
                      borderColor: colors.border,
                    }}
                  >
                    <Text
                      style={{
                        color: colors.textPrimary,
                        fontSize: 24,
                        fontWeight: 'bold',
                      }}
                    >
                      {pricePerToken || '0.00'}
                    </Text>
                  </View>
                  {selectedProperty.property?.tokenPrice && (
                    <Text style={{ color: colors.textMuted }} className="text-xs mt-2">
                      Market Price: ${selectedProperty.property.tokenPrice.toFixed(2)}
                    </Text>
                  )}
                </View>

                {/* Tokens to Sell */}
                <View className="mb-4">
                  <View className="flex-row items-center justify-between mb-2">
                    <Text style={{ color: colors.textMuted }} className="text-sm">
                      Amount to Sell
                    </Text>
                    <TouchableOpacity
                      onPress={() => handleQuickSelect(100)}
                      style={{
                        backgroundColor: colors.primary,
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: 8,
                      }}
                    >
                      <Text style={{ color: '#ffffff' }} className="text-xs font-semibold">
                        Sell All
                      </Text>
                    </TouchableOpacity>
                  </View>
                  <View
                    style={{
                      backgroundColor: colors.card,
                      borderRadius: 16,
                      padding: 20,
                      borderWidth: 1,
                      borderColor: colors.border,
                    }}
                  >
                    <View className="flex-row items-center">
                      <MaterialIcons name="account-balance-wallet" size={24} color={colors.primary} />
                      <TextInput
                        style={{
                          color: colors.textPrimary,
                          fontSize: 32,
                          fontWeight: 'bold',
                          flex: 1,
                          marginLeft: 12,
                        }}
                        value={tokensToSell}
                        onChangeText={handleTokensChange}
                        placeholder="0"
                        placeholderTextColor={colors.textMuted}
                        keyboardType="decimal-pad"
                      />
                      <Text style={{ color: colors.textMuted }} className="text-sm ml-2">
                        Tokens
                      </Text>
                    </View>
                    <Text style={{ color: colors.textMuted }} className="text-xs mt-2">
                      Min: 0.1 tokens • Max: {parseFloat(availableTokens).toFixed(2)} tokens
                    </Text>
                  </View>
                </View>

                {/* Selling Price (Editable) */}
                {tokensToSell && parseFloat(tokensToSell) > 0 && pricePerToken && (
                  <View className="mb-4">
                    <Text style={{ color: colors.textMuted }} className="text-sm mb-2">
                      Selling Price (USDT)
                    </Text>
                    <View
                      style={{
                        backgroundColor: colors.card,
                        borderRadius: 16,
                        padding: 20,
                        borderWidth: 1,
                        borderColor: colors.border,
                      }}
                    >
                      <View className="flex-row items-center">
                        <MaterialIcons name="attach-money" size={24} color={colors.primary} />
                        <TextInput
                          style={{
                            color: colors.textPrimary,
                            fontSize: 32,
                            fontWeight: 'bold',
                            flex: 1,
                            marginLeft: 12,
                          }}
                          value={totalValueUSDT}
                          onChangeText={handleSellingPriceChange}
                          placeholder="0.00"
                          placeholderTextColor={colors.textMuted}
                          keyboardType="decimal-pad"
                        />
                        <Text style={{ color: colors.textMuted }} className="text-sm ml-2">
                          USDT
                        </Text>
                      </View>
                      <Text style={{ color: colors.textMuted }} className="text-xs mt-2">
                        Suggested: {tokensToSell} tokens × ${pricePerToken} = ${(parseFloat(tokensToSell) * parseFloat(pricePerToken)).toFixed(2)} (you can edit)
                      </Text>
                    </View>
                  </View>
                )}

                {/* Order Limits (Display only - no input boxes) */}
                {totalValueUSDT && parseFloat(totalValueUSDT) > 0 && (
                  <View className="mb-6">
                    <Text style={{ color: colors.textMuted }} className="text-sm mb-3">
                      Order Limits (USDT)
                    </Text>
                    <View
                      style={{
                        backgroundColor: colors.card,
                        borderRadius: 16,
                        padding: 20,
                        borderWidth: 1,
                        borderColor: colors.border,
                      }}
                    >
                      <View className="flex-row justify-between items-center mb-3">
                        <Text style={{ color: colors.textMuted }} className="text-sm">
                          Minimum (10% decrease)
                        </Text>
                        <Text style={{ color: colors.textPrimary }} className="text-lg font-bold">
                          ${getMinLimit().toFixed(2)}
                        </Text>
                      </View>
                      <View
                        style={{
                          height: 1,
                          backgroundColor: colors.border,
                          marginVertical: 8,
                        }}
                      />
                      <View className="flex-row justify-between items-center">
                        <Text style={{ color: colors.textMuted }} className="text-sm">
                          Maximum (10% increase)
                        </Text>
                        <Text style={{ color: colors.textPrimary }} className="text-lg font-bold">
                          ${getMaxLimit().toFixed(2)}
                        </Text>
                      </View>
                      <Text style={{ color: colors.textMuted }} className="text-xs mt-3 text-center">
                        Buyers can purchase between ${getMinLimit().toFixed(2)} - ${getMaxLimit().toFixed(2)}
                      </Text>
                    </View>
                  </View>
                )}

                {/* Summary */}
                <View
                  style={{
                    // backgroundColor: colors.primary + '20',
                    borderRadius: 16,
                    padding: 20,
                    marginBottom: 24,
                  }}
                >
                  <Text style={{ color: colors.textMuted }} className="text-sm mb-2">
                    Listing Summary
                  </Text>
                  <View className="flex-row justify-between mb-2">
                    <Text style={{ color: colors.textMuted }} className="text-sm">
                      Subtotal ({tokensToSell || '0'} Tokens)
                    </Text>
                    <Text style={{ color: colors.textPrimary }} className="text-sm font-semibold">
                      ${totalValue.toFixed(2)}
                    </Text>
                  </View>
                  <View
                    style={{
                      height: 1,
                      backgroundColor: colors.border,
                      marginVertical: 12,
                    }}
                  />
                  <View className="flex-row justify-between">
                    <Text style={{ color: colors.textPrimary }} className="text-base font-bold">
                      Total Listing Value
                    </Text>
                    <Text style={{ color: colors.primary }} className="text-xl font-bold">
                      ${totalValue.toFixed(2)}
                    </Text>
                  </View>
                </View>

                {/* Publish Button */}
                <TouchableOpacity
                  onPress={handlePublish}
                  disabled={!validation.valid || isProcessing}
                  style={{
                    backgroundColor: validation.valid ? colors.primary : colors.border,
                    borderRadius: 16,
                    paddingVertical: 18,
                    alignItems: 'center',
                    opacity: validation.valid ? 1 : 0.6,
                  }}
                >
                  {isProcessing ? (
                    <ActivityIndicator color="#ffffff" />
                  ) : (
                    <Text style={{ color: '#ffffff' }} className="text-lg font-bold">
                      Publish on Marketplace
                    </Text>
                  )}
                </TouchableOpacity>

                {!validation.valid && tokensToSell && (
                  <Text style={{ color: colors.destructive }} className="text-xs text-center mt-3">
                    {validation.error}
                  </Text>
                )}
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Property Selector Modal */}
      <Modal
        visible={showPropertySelector}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowPropertySelector(false)}
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
              maxHeight: '80%',
              padding: 24,
            }}
          >
            <View className="flex-row items-center justify-between mb-4">
              <Text style={{ color: colors.textPrimary }} className="text-xl font-bold">
                Select Property
              </Text>
              <TouchableOpacity onPress={() => setShowPropertySelector(false)}>
                <Ionicons name="close" size={28} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {investments && investments.length > 0 ? (
                investments.map((investment: any) => (
                  <TouchableOpacity
                    key={investment.id}
                    onPress={() => handlePropertySelect(investment)}
                    style={{
                      backgroundColor: colors.background,
                      borderRadius: 16,
                      padding: 16,
                      marginBottom: 12,
                      borderWidth: 1,
                      borderColor:
                        selectedProperty?.id === investment.id
                          ? colors.primary
                          : colors.border,
                    }}
                  >
                    <View className="flex-row items-center">
                      {investment.property?.images?.[0] && (
                        <Image
                          source={{ uri: investment.property.images[0] }}
                          style={{ width: 60, height: 60, borderRadius: 12, marginRight: 12 }}
                        />
                      )}
                      <View className="flex-1">
                        <Text
                          style={{ color: colors.textPrimary }}
                          className="font-semibold mb-1"
                        >
                          {investment.property?.title || 'Property'}
                        </Text>
                        <Text style={{ color: colors.textMuted }} className="text-xs mb-2">
                          {investment.property?.city || 'Location'}
                        </Text>
                        <View className="flex-row justify-between">
                          <Text style={{ color: colors.textMuted }} className="text-xs">
                            Owned: {investment.tokens?.toFixed(2) || '0'} tokens
                          </Text>
                          <Text style={{ color: colors.primary }} className="text-xs font-semibold">
                            ${(investment.currentValue || 0).toFixed(2)}
                          </Text>
                        </View>
                      </View>
                      {selectedProperty?.id === investment.id && (
                        <MaterialIcons name="check-circle" size={24} color={colors.primary} />
                      )}
                    </View>
                  </TouchableOpacity>
                ))
              ) : (
                <View className="items-center py-8">
                  <MaterialIcons name="inventory" size={48} color={colors.textMuted} />
                  <Text style={{ color: colors.textMuted }} className="text-base mt-4">
                    No properties available
                  </Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <AppAlert
        visible={alertState.visible}
        title={alertState.title}
        message={alertState.message}
        type={alertState.type}
        onConfirm={alertState.onConfirm || (() => {})}
      />
    </View>
  );
}

