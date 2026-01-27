import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useProperty } from '@/services/useProperty';
import { useColorScheme } from '@/lib/useColorScheme';
import { normalizePropertyImages } from '@/utils/propertyUtils';
import Constants from 'expo-constants';
import { LinearGradient } from 'expo-linear-gradient';
import EmeraldLoader from '@/components/EmeraldLoader';

const API_BASE_URL = Constants.expoConfig?.extra?.apiUrl || 'http://localhost:3000';

export default function SellReviewScreen() {
    const { id, tokenCount, propertyId, propertyTitle, pricePerToken } = useLocalSearchParams<{
        id: string;
        tokenCount: string;
        propertyId: string;
        propertyTitle: string;
        pricePerToken: string;
    }>();
    const router = useRouter();
    const { property } = useProperty(propertyId || id || '');
    const { colors } = useColorScheme();
    const [isProcessing, setIsProcessing] = useState(false);

    const tokens = tokenCount ? parseFloat(tokenCount) : 0;
    const price = pricePerToken ? parseFloat(pricePerToken) : 0;
    const totalValue = tokens * price;
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

    const handleContinue = () => {
        router.push({
            pathname: `/invest/${propertyId}/publish` as any,
            params: {
                tokenCount: tokens.toString(),
                propertyId: propertyId,
                propertyTitle: title,
                pricePerToken: price.toString(),
                totalValue: totalValue.toFixed(2),
            },
        } as any);
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
                        Review Sale
                    </Text>

                    <View className="w-10" />
                </View>

                <View className="px-6 mb-6">
                    <LinearGradient
                        colors={['rgba(16,185,129,0.25)', 'transparent']}
                        className="rounded-3xl p-6"
                    >
                        <Text className="text-gray-300 text-sm mb-1">
                            Total Sale Value
                        </Text>

                        <Text className="text-white text-4xl font-extrabold">
                            ${totalValue.toLocaleString()}
                        </Text>

                        <Text className="text-emerald-400 mt-2 text-sm font-medium">
                            Selling {tokens.toFixed(2)} tokens
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

                    {/* Sale Details Card */}
                    <View className="mx-4 mb-5 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 p-4">
                        <Text className="text-white font-semibold text-base mb-4">
                            Sale Breakdown
                        </Text>

                        {[
                            ['Tokens to Sell', `${tokens.toFixed(2)}`],
                            ['Price per Token', `$${price.toFixed(2)}`],
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
                                ${totalValue.toFixed(2)}
                            </Text>
                        </View>
                    </View>
                </ScrollView>

                {/* CTA Button */}
                <View className="px-4 pb-8">
                    <TouchableOpacity
                        onPress={handleContinue}
                        disabled={isProcessing}
                        className="rounded-2xl py-4 items-center bg-emerald-500"
                    >
                        {isProcessing ? (
                            <ActivityIndicator size="small" color="#ffffff" />
                        ) : (
                            <Text className="text-white text-lg font-bold">
                                Continue to Publish
                            </Text>
                        )}
                    </TouchableOpacity>
                </View>
            </View>
        </LinearGradient>
    );
}

