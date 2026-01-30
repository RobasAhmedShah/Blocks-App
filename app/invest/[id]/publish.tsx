import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image, ActivityIndicator, Alert, Animated, PanResponder, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useProperty } from '@/services/useProperty';
import { useColorScheme } from '@/lib/useColorScheme';
import { normalizePropertyImages } from '@/utils/propertyUtils';
import Constants from 'expo-constants';
import { LinearGradient } from 'expo-linear-gradient';
import { marketplaceAPI } from '@/services/api/marketplace.api';
import { useWallet } from '@/services/useWallet';
import { useRestrictionModal } from '@/hooks/useRestrictionModal';
import { RestrictionModal } from '@/components/restrictions/RestrictionModal';
import EmeraldLoader from '@/components/EmeraldLoader';

const API_BASE_URL = Constants.expoConfig?.extra?.apiUrl || 'http://localhost:3001';

export default function PublishScreen() {
    const { id, tokenCount, propertyId, propertyTitle, pricePerToken, totalValue } = useLocalSearchParams<{
        id: string;
        tokenCount: string;
        propertyId: string;
        propertyTitle: string;
        pricePerToken: string;
        totalValue: string;
    }>();
    const router = useRouter();
    const { property } = useProperty(propertyId || id || '');
    const { colors } = useColorScheme();
    const { balance } = useWallet();
    const { checkAndBlock, modalProps } = useRestrictionModal();
    const [isProcessing, setIsProcessing] = useState(false);
    const [isPublished, setIsPublished] = useState(false);

    const screenWidth = Dimensions.get('window').width;
    const swipeThreshold = screenWidth * 0.7;
    const translateX = useRef(new Animated.Value(0)).current;
    const glowOpacity = useRef(new Animated.Value(0)).current;
    const [isSwiping, setIsSwiping] = useState(false);

    const tokens = tokenCount ? parseFloat(tokenCount) : 0;
    const price = pricePerToken ? parseFloat(pricePerToken) : 0;
    const total = totalValue ? parseFloat(totalValue) : tokens * price;
    const title = propertyTitle || property?.title || 'Property';

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
            onStartShouldSetPanResponder: () => !isProcessing && !isPublished,
            onMoveShouldSetPanResponder: (_, gestureState) => {
                return Math.abs(gestureState.dx) > 10 && !isProcessing && !isPublished;
            },
            onPanResponderGrant: () => {
                setIsSwiping(true);
                translateX.setOffset((translateX as any)._value || 0);
                translateX.setValue(0);
            },
            onPanResponderMove: (_, gestureState) => {
                const dx = Math.max(0, Math.min(gestureState.dx, screenWidth - 60));
                translateX.setValue(dx);
                
                const progress = dx / swipeThreshold;
                glowOpacity.setValue(Math.min(progress, 1));
            },
            onPanResponderRelease: (_, gestureState) => {
                translateX.flattenOffset();
                setIsSwiping(false);
                
                if (gestureState.dx >= swipeThreshold) {
                    handlePublish();
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

    const handlePublish = async () => {
        // Check if trading is blocked (creating listing is marketplace trading)
        if (!checkAndBlock('trading')) {
            return; // Modal will show, don't proceed
        }

        if (!propertyId) {
            Alert.alert('Error', 'Property ID not found');
            return;
        }

        setIsProcessing(true);
        try {
            const actualPricePerToken = tokens > 0 ? total / tokens : price;
            const minOrder = total * 0.9;
            const maxOrder = total * 1.1;

            await marketplaceAPI.createListing({
                propertyId: propertyId,
                pricePerToken: actualPricePerToken,
                totalTokens: tokens,
                minOrderUSDT: minOrder,
                maxOrderUSDT: maxOrder,
            });

            setIsPublished(true);
            setIsProcessing(false);
        } catch (error: any) {
            setIsProcessing(false);
            Alert.alert('Publish Failed', error.message || 'Failed to publish listing');
        }
    };

    if (isPublished) {
        return (
            <LinearGradient
                colors={['#064E3B', '#022C22', '#064E3B']}
                style={{ flex: 1 }}
            >
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
                    <View style={{ backgroundColor: 'rgba(16, 185, 129, 0.2)', borderRadius: 60, width: 120, height: 120, alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
                        <Ionicons name="checkmark-circle" size={80} color="#10B981" />
                    </View>
                    
                    <Text style={{ color: '#fff', fontSize: 28, fontWeight: 'bold', marginBottom: 12, textAlign: 'center' }}>
                        Listing Published!
                    </Text>
                    
                    <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 16, textAlign: 'center', marginBottom: 40 }}>
                        Your tokens are now available for purchase on the marketplace
                    </Text>

                    <TouchableOpacity
                        onPress={() => router.push('/marketplace')}
                        style={{ backgroundColor: '#10B981', paddingVertical: 16, paddingHorizontal: 32, borderRadius: 16, marginBottom: 16, width: '100%' }}
                    >
                        <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600', textAlign: 'center' }}>
                            Go to Marketplace
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => router.push('/(tabs)/home')}
                        style={{ backgroundColor: 'rgba(255,255,255,0.1)', paddingVertical: 16, paddingHorizontal: 32, borderRadius: 16, width: '100%' }}
                    >
                        <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600', textAlign: 'center' }}>
                            Go to Home
                        </Text>
                    </TouchableOpacity>
                </View>
            </LinearGradient>
        );
    }

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
                        Publish Listing
                    </Text>

                    <View className="w-10" />
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
                        </View>
                    </View>

                    {/* Listing Details */}
                    <View className="mx-4 mb-5 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 p-4">
                        <Text className="text-white font-semibold text-base mb-4">
                            Listing Details
                        </Text>

                        {[
                            ['Tokens', `${tokens.toFixed(2)}`],
                            ['Price per Token', `$${price.toFixed(2)}`],
                            ['Total Value', `$${total.toFixed(2)}`],
                        ].map(([label, value]) => (
                            <View key={label} className="flex-row justify-between py-2">
                                <Text className="text-gray-400 text-sm">{label}</Text>
                                <Text className="text-white text-sm font-medium">{value}</Text>
                            </View>
                        ))}
                    </View>
                </ScrollView>

                {/* Swipe to Publish Button */}
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
                                backgroundColor: '#10B981',
                                borderRadius: 16,
                                paddingVertical: 16,
                                paddingHorizontal: 20,
                                minHeight: 56,
                            }}
                        >
                            <View style={{ flex: 1, alignItems: 'center' }}>
                                {isProcessing ? (
                                    <ActivityIndicator size="small" color="#ffffff" />
                                ) : (
                                    <Text className="text-white text-lg font-bold">
                                        Swipe to Publish →
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
                </View>
            </View>
            <RestrictionModal {...modalProps} />
        </LinearGradient>
    );
}

