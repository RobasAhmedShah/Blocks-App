import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Image, Animated, PanResponder, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useProperty } from '@/services/useProperty';
import { useColorScheme } from '@/lib/useColorScheme';
import { useApp } from '@/contexts/AppContext';
import { useWallet } from '@/services/useWallet';
import { normalizePropertyImages } from '@/utils/propertyUtils';
import Constants from 'expo-constants';
import { LinearGradient } from 'expo-linear-gradient';

const BALANCE_EPSILON = 0.01;

export default function InvestmentReviewScreen() {
    const { id, tokenCount, totalAmount, transactionFee, totalInvestment, propertyTitle, propertyId } = useLocalSearchParams<{
        id: string;
        tokenCount: string;
        totalAmount: string;
        transactionFee: string;
        totalInvestment: string;
        propertyTitle: string;
        propertyId: string;
    }>();
    const router = useRouter();
    const { property } = useProperty(id || propertyId || '');
    const { colors } = useColorScheme();
    const { invest } = useApp();
    const { balance } = useWallet();
    const [isProcessing, setIsProcessing] = useState(false);
    
    const screenWidth = Dimensions.get('window').width;
    const swipeThreshold = screenWidth * 0.7; // 70% of screen width
    const translateX = useRef(new Animated.Value(0)).current;
    const glowOpacity = useRef(new Animated.Value(0)).current;
    const [isSwiping, setIsSwiping] = useState(false);

    const API_BASE_URL = Constants.expoConfig?.extra?.apiUrl || 'http://localhost:3000';

    const tokens = tokenCount ? parseFloat(tokenCount) : 0;
    const amount = totalAmount ? parseFloat(totalAmount) : 0;
    const fee = transactionFee ? parseFloat(transactionFee) : 0;
    const investment = totalInvestment ? parseFloat(totalInvestment) : 0;
    const title = propertyTitle || property?.title || 'Property';

    // Helper to get property image URL
    const getPropertyImageUrl = (images: any): string | null => {
        if (!images) return null;
        const imageArray = normalizePropertyImages(images);
        if (imageArray.length === 0) return null;
        const firstImage = imageArray[0];
        if (!firstImage) return null;
        if (firstImage.startsWith('http://') || firstImage.startsWith('https://')) {
            return firstImage;
        }
        if (firstImage.startsWith('/')) {
            return `${API_BASE_URL}${firstImage}`;
        }
        return `${API_BASE_URL}/${firstImage}`;
    };

    const propertyImage = property ? getPropertyImageUrl(property.images) : null;

    const panResponder = useRef(
      PanResponder.create({
        onStartShouldSetPanResponder: () => !isProcessing && investment <= balance.usdc,
        onMoveShouldSetPanResponder: (_, gestureState) => {
          return Math.abs(gestureState.dx) > 10 && !isProcessing && investment <= balance.usdc;
        },
        onPanResponderGrant: () => {
          setIsSwiping(true);
          translateX.setOffset((translateX as any)._value || 0);
          translateX.setValue(0);
        },
        onPanResponderMove: (_, gestureState) => {
          const dx = Math.max(0, Math.min(gestureState.dx, screenWidth - 60));
          translateX.setValue(dx);
          
          // Update glow opacity based on swipe progress
          const progress = dx / swipeThreshold;
          glowOpacity.setValue(Math.min(progress, 1));
        },
        onPanResponderRelease: (_, gestureState) => {
          translateX.flattenOffset();
          setIsSwiping(false);
          
          if (gestureState.dx >= swipeThreshold) {
            // Swipe completed - trigger investment
            handleConfirmInvestment();
            // Reset animation
            Animated.parallel([
              Animated.timing(translateX, {
                toValue: screenWidth,
                duration: 300,
                useNativeDriver: true,
              }),
              Animated.timing(glowOpacity, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
              }),
            ]).start(() => {
              translateX.setValue(0);
            });
          } else {
            // Reset to start
            Animated.parallel([
              Animated.spring(translateX, {
                toValue: 0,
                useNativeDriver: true,
                tension: 50,
                friction: 7,
              }),
              Animated.timing(glowOpacity, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
              }),
            ]).start();
          }
        },
      })
    ).current;

    const handleConfirmInvestment = async () => {
        // Final validation
        if (investment > balance.usdc + BALANCE_EPSILON) {
            const shortfall = investment - balance.usdc;
            Alert.alert(
                'Insufficient Balance',
                `You need $${shortfall.toFixed(2)} more. Would you like to add funds?`,
                [
                    { text: 'Cancel', style: 'cancel' },
                    {
                        text: 'Add Funds',
                        onPress: () => {
                            router.push({
                                pathname: '/wallet/deposit/card',
                                params: { amount: shortfall.toFixed(2) },
                            } as any);
                        },
                    },
                ]
            );
            return;
        }

        setIsProcessing(true);
        try {
            await invest(investment, propertyId || id, tokens);

            // Navigate to confirmation screen
            router.replace({
                pathname: `/invest/${id}/confirm` as any,
                params: {
                    tokenCount: tokens.toString(),
                    totalAmount: amount.toFixed(2),
                    totalInvestment: investment.toFixed(2),
                    propertyTitle: title,
                },
            } as any);
        } catch (error) {
            console.error('Investment failed:', error);
            setIsProcessing(false);
            Alert.alert('Investment Failed', 'Please try again.');
        }
    };

    return (
        <LinearGradient
            colors={['#064E3B', '#022C22', '#064E3B']}
            style={{ flex: 1 }}
        >
            <View style={{ flex: 1, backgroundColor: 'transparent' }}>

       

                {/* Header */}
                <View className="flex-row items-center px-4 pt-10 pb-4">
                    <TouchableOpacity
                        onPress={() => router.back()}
                        className="w-10 h-10 items-center justify-center rounded-full bg-white/5"
                    >
                        <Ionicons name="arrow-back" size={20} color="#fff" />
                    </TouchableOpacity>

                    <Text className="flex-1 text-center text-lg font-semibold text-white">
                        Review Investment
                    </Text>

                    <View className="w-10" />
                </View>


                <View className="px-6 mb-6">
                    <LinearGradient
                        colors={['rgba(16,185,129,0.25)', 'transparent']}
                        className="rounded-3xl p-6"
                    >
                        <Text className="text-gray-300 text-sm mb-1">
                            Total Investment
                        </Text>

                        <Text className="text-white text-4xl font-extrabold">
                            ${investment.toLocaleString()}
                        </Text>

                        <Text className="text-emerald-400 mt-2 text-sm font-medium">
                            You will receive {tokens.toFixed(2)} tokens
                        </Text>
                    </LinearGradient>
                </View>



                <ScrollView
                    style={{ flex: 1 }}
                    contentContainerStyle={{
                        paddingHorizontal: 16,
                        paddingTop: 24,
                        paddingBottom: 32
                    }}
                >
                    {/* Property Card */}
                    <View className="mx-4 mb-5 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 overflow-hidden">
                        {propertyImage && (
                            <Image
                                source={{ uri: propertyImage }}
                                className="w-full h-36"
                                resizeMode="cover"
                            />
                        )}

                        <View className="p-4">
                            <Text className="text-xs text-gray-400 mb-1">Property</Text>
                            <Text className="text-white text-lg font-semibold">
                                {title}
                            </Text>

                            {property?.displayCode && (
                                <Text className="text-gray-400 text-xs mt-1">
                                    {property.displayCode}
                                </Text>
                            )}
                        </View>
                    </View>


                    {/* Investment Details Card */}
                    <View className="mx-4 mb-5 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 p-4">
                        <Text className="text-white font-semibold text-base mb-4">
                            Investment Breakdown
                        </Text>

                        {[
                            ['Tokens', `${tokens.toFixed(2)}`],
                            ['Token Price', `$${property?.tokenPrice?.toFixed(2)}`],
                            ['Subtotal', `$${amount.toFixed(2)}`],
                            ['Transaction Fee', `$${fee.toFixed(2)}`],
                        ].map(([label, value]) => (
                            <View key={label} className="flex-row justify-between py-2">
                                <Text className="text-gray-400 text-sm">{label}</Text>
                                <Text className="text-white text-sm font-medium">{value}</Text>
                            </View>
                        ))}

                        <View className="h-px bg-white/10 my-3" />

                        <View className="flex-row justify-between">
                            <Text className="text-white text-base font-semibold">
                                Total
                            </Text>
                            <Text className="text-emerald-400 text-xl font-bold">
                                ${investment.toFixed(2)}
                            </Text>
                        </View>
                    </View>


                    {/* Payment Method Card */}
                    <View className="mx-4 mb-4 rounded-2xl shadow-lg shadow-emerald-500/20  bg-white/5 backdrop-blur-xl border border-white/10 p-4">
                        <Text className="text-white font-semibold mb-3 ">
                            Payment Method
                        </Text>

                        <View className="flex-row items-center">
                            <View className="w-12 h-12 rounded-full bg-indigo-600 items-center justify-center mr-4">
                                <Text className="text-white font-bold text-xs">USDC</Text>
                            </View>

                            <View className="flex-1">
                                <Text className="text-white font-medium">
                                    USDC Wallet
                                </Text>
                                <Text className="text-gray-400 text-xs mt-1">
                                    ${balance.usdc.toFixed(2)} available
                                </Text>
                            </View>
                        </View>
                    </View>


                    {/* Balance Warning */}
                    {investment > balance.usdc && (
                        <View style={{
                            backgroundColor: 'rgba(239, 68, 68, 0.2)',
                            borderRadius: 12,
                            padding: 12,
                            marginBottom: 16,
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 8,
                        }}>
                            <Ionicons name="warning" size={20} color="#ef4444" />
                            <Text style={{ color: '#ef4444', fontSize: 12, flex: 1 }}>
                                Insufficient balance. You need ${(investment - balance.usdc).toFixed(2)} more.
                            </Text>
                        </View>
                    )}
                </ScrollView>

                {/* Swipe to Invest Button */}
                <View className="px-4 pb-8">
                    <View style={{ position: 'relative', overflow: 'hidden', borderRadius: 16 }}>
                        {/* Glow effect */}
                        <Animated.View
                            style={{
                                position: 'absolute',
                                left: 0,
                                right: 0,
                                top: 0,
                                bottom: 0,
                                backgroundColor: '#10B981',
                                opacity: glowOpacity.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [0, 0.6],
                                }),
                                borderRadius: 16,
                            }}
                        />
                        
                        {/* Swipeable button */}
                        <Animated.View
                            {...panResponder.panHandlers}
                            style={{
                                transform: [{ translateX }],
                                flexDirection: 'row',
                                alignItems: 'center',
                                backgroundColor: investment > balance.usdc ? 'rgba(16, 185, 129, 0.4)' : '#10B981',
                                borderRadius: 16,
                                paddingVertical: 16,
                                paddingHorizontal: 20,
                                minHeight: 56,
                            }}
                        >
                            <View style={{ flex: 1, alignItems: 'center' }}>
                                {isProcessing ? (
                                    <ActivityIndicator color="#fff" />
                                ) : investment > balance.usdc ? (
                                    <Text className="text-white text-lg font-bold">
                                        Insufficient Balance
                                    </Text>
                                ) : (
                                    <Text className="text-white text-lg font-bold">
                                        Swipe to Invest →
                                    </Text>
                                )}
                            </View>
                            
                            {/* Thumb indicator */}
                            <Animated.View
                                style={{
                                    width: 40,
                                    height: 40,
                                    borderRadius: 20,
                                    backgroundColor: 'rgba(255, 255, 255, 0.3)',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    position: 'absolute',
                                    left: 10,
                                }}
                            >
                                <Ionicons name="arrow-forward" size={20} color="#fff" />
                            </Animated.View>
                        </Animated.View>
                    </View>

                    {investment > balance.usdc && (
                        <TouchableOpacity
                            onPress={() => {
                                const shortfall = investment - balance.usdc;
                                router.push({
                                    pathname: '/wallet/deposit/card',
                                    params: { amount: shortfall.toFixed(2) },
                                } as any);
                            }}
                            className="mt-4 items-center"
                        >
                            <Text className="text-emerald-400 font-semibold">
                                Add ${(investment - balance.usdc).toFixed(2)} to wallet
                            </Text>
                        </TouchableOpacity>
                    )}
                </View>


            </View>
        </LinearGradient>
    );
}

