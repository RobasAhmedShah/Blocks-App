import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
  Image,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useColorScheme } from '@/lib/useColorScheme';
import { kycApi, KycDetails } from '@/services/api/kyc.api';

export default function KycDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { colors, isDarkColorScheme } = useColorScheme();
  const [kycDetails, setKycDetails] = useState<KycDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadKycDetails();
  }, []);

  const loadKycDetails = async () => {
    try {
      setLoading(true);
      const details = await kycApi.getKyc();
      setKycDetails(details);
    } catch (error) {
      console.error('Error loading KYC details:', error);
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to load KYC details');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified':
        return colors.primary;
      case 'pending':
        return colors.warning;
      case 'rejected':
        return colors.destructive;
      default:
        return colors.textMuted;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'verified':
        return 'Verified';
      case 'pending':
        return 'Pending Review';
      case 'rejected':
        return 'Rejected';
      default:
        return 'Unknown';
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <StatusBar barStyle={isDarkColorScheme ? 'light-content' : 'dark-content'} />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!kycDetails) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <StatusBar barStyle={isDarkColorScheme ? 'light-content' : 'dark-content'} />
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
            KYC Details
          </Text>
          <View className="w-12" />
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <Ionicons name="document-text-outline" size={64} color={colors.textMuted} style={{ opacity: 0.3 }} />
          <Text style={{ fontSize: 16, color: colors.textSecondary, marginTop: 16, textAlign: 'center' }}>
            No KYC details available
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle={isDarkColorScheme ? 'light-content' : 'dark-content'} />
      
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
          KYC Details
        </Text>
        <View className="w-12" />
      </View>

      <ScrollView 
        className="flex-1 px-4"
        showsVerticalScrollIndicator={false}
      >
        <View className="flex flex-col gap-6 py-6">
          {/* Status Card */}
          <View
            style={{ 
              backgroundColor: colors.card, 
              borderWidth: isDarkColorScheme ? 0 : 1, 
              borderColor: colors.border 
            }}
            className="overflow-hidden rounded-xl p-5"
          >
            <Text style={{ color: colors.textPrimary }} className="text-sm font-bold uppercase tracking-wider mb-4">
              Verification Status
            </Text>
            <View className="flex-row items-center mb-3">
              <View
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: 6,
                  backgroundColor: getStatusColor(kycDetails.status),
                  marginRight: 10,
                }}
              />
              <Text style={{ fontSize: 18, fontWeight: '700', color: getStatusColor(kycDetails.status) }}>
                {getStatusLabel(kycDetails.status)}
              </Text>
            </View>
            {kycDetails.rejectionReason && (
              <View
                style={{
                  marginTop: 12,
                  padding: 12,
                  backgroundColor: isDarkColorScheme 
                    ? 'rgba(239, 68, 68, 0.15)' 
                    : 'rgba(239, 68, 68, 0.1)',
                  borderRadius: 8,
                }}
              >
                <Text style={{ fontSize: 14, fontWeight: '600', color: colors.destructive, marginBottom: 4 }}>
                  Rejection Reason:
                </Text>
                <Text style={{ fontSize: 14, color: colors.textSecondary }}>
                  {kycDetails.rejectionReason}
                </Text>
              </View>
            )}
          </View>

          {/* Document Type */}
          <View className="flex flex-col gap-2">
            <Text style={{ color: colors.textPrimary }} className="px-2 text-sm font-bold uppercase tracking-wider">
              Document Information
            </Text>
            <View
              style={{ 
                backgroundColor: colors.card, 
                borderWidth: isDarkColorScheme ? 0 : 1, 
                borderColor: colors.border 
              }}
              className="overflow-hidden rounded-xl p-5"
            >
              <Text style={{ fontSize: 14, fontWeight: '600', color: colors.textSecondary, marginBottom: 4 }}>
                Document Type
              </Text>
              <Text style={{ fontSize: 16, color: colors.textPrimary, textTransform: 'uppercase' }}>
                {kycDetails.type}
              </Text>
            </View>
          </View>

          {/* Uploaded Documents */}
          <View className="flex flex-col gap-2">
            <Text style={{ color: colors.textPrimary }} className="px-2 text-sm font-bold uppercase tracking-wider">
              Uploaded Documents
            </Text>
            <View
              style={{ 
                backgroundColor: colors.card, 
                borderWidth: isDarkColorScheme ? 0 : 1, 
                borderColor: colors.border 
              }}
              className="overflow-hidden rounded-xl p-5"
            >
              {kycDetails.documents.front && (
                <View style={{ marginBottom: 16 }}>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: colors.textPrimary, marginBottom: 8 }}>
                    Front of ID
                  </Text>
                  <Image
                    source={{ uri: kycDetails.documents.front }}
                    style={{
                      width: '100%',
                      height: 200,
                      borderRadius: 8,
                      backgroundColor: colors.background,
                    }}
                    resizeMode="contain"
                  />
                </View>
              )}
              {kycDetails.documents.back && (
                <View style={{ marginBottom: 16 }}>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: colors.textPrimary, marginBottom: 8 }}>
                    Back of ID
                  </Text>
                  <Image
                    source={{ uri: kycDetails.documents.back }}
                    style={{
                      width: '100%',
                      height: 200,
                      borderRadius: 8,
                      backgroundColor: colors.background,
                    }}
                    resizeMode="contain"
                  />
                </View>
              )}
              {kycDetails.documents.selfie && (
                <View>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: colors.textPrimary, marginBottom: 8 }}>
                    Selfie Photo
                  </Text>
                  <Image
                    source={{ uri: kycDetails.documents.selfie }}
                    style={{
                      width: '100%',
                      height: 200,
                      borderRadius: 8,
                      backgroundColor: colors.background,
                    }}
                    resizeMode="contain"
                  />
                </View>
              )}
            </View>
          </View>

          {/* Dates */}
          <View className="flex flex-col gap-2">
            <Text style={{ color: colors.textPrimary }} className="px-2 text-sm font-bold uppercase tracking-wider">
              Timeline
            </Text>
            <View
              style={{ 
                backgroundColor: colors.card, 
                borderWidth: isDarkColorScheme ? 0 : 1, 
                borderColor: colors.border 
              }}
              className="overflow-hidden rounded-xl p-5"
            >
              {kycDetails.submittedAt && (
                <View style={{ marginBottom: 12 }}>
                  <Text style={{ fontSize: 12, color: colors.textMuted, marginBottom: 4 }}>Submitted</Text>
                  <Text style={{ fontSize: 14, color: colors.textPrimary }}>
                    {new Date(kycDetails.submittedAt).toLocaleString()}
                  </Text>
                </View>
              )}
              {kycDetails.reviewedAt && (
                <View>
                  <Text style={{ fontSize: 12, color: colors.textMuted, marginBottom: 4 }}>Reviewed</Text>
                  <Text style={{ fontSize: 14, color: colors.textPrimary }}>
                    {new Date(kycDetails.reviewedAt).toLocaleString()}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

