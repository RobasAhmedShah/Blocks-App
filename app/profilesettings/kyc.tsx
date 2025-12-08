import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useColorScheme } from '@/lib/useColorScheme';
import { kycApi, KycStatus } from '@/services/api/kyc.api';

export default function KycScreen() {
  const router = useRouter();
  const { colors, isDarkColorScheme } = useColorScheme();
  const [kycStatus, setKycStatus] = useState<KycStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadKycStatus();
  }, []);

  const loadKycStatus = async () => {
    try {
      setLoading(true);
      const status = await kycApi.getStatus();
      setKycStatus(status);
    } catch (error) {
      console.error('Error loading KYC status:', error);
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to load KYC status');
    } finally {
      setLoading(false);
    }
  };

  const handleStartVerification = () => {
    router.push('../profilesettings/kyc-upload');
  };

  const handleViewDetails = async () => {
    try {
      const details = await kycApi.getKyc();
      if (details) {
        router.push({
          pathname: '../profilesettings/kyc-details',
          params: { kycId: details.id },
        });
      } else {
        Alert.alert('No Details', 'KYC details not available');
      }
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to load details');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified':
        return colors.primary; // Use theme primary (emerald green)
      case 'pending':
        return colors.warning; // Use theme warning (yellow)
      case 'rejected':
        return colors.destructive; // Use theme destructive (red)
      default:
        return colors.textMuted; // Use theme muted
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
        return 'Not Submitted';
    }
  };

  const status = kycStatus?.status || 'not_submitted';

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
          KYC Verification
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
                  backgroundColor: getStatusColor(status),
                  marginRight: 10,
                }}
              />
              <Text style={{ fontSize: 18, fontWeight: '700', color: getStatusColor(status) }}>
                {getStatusLabel(status)}
              </Text>
            </View>
            {kycStatus?.rejectionReason && (
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
                  {kycStatus.rejectionReason}
                </Text>
              </View>
            )}
          </View>

          {/* Document Status */}
          {kycStatus?.hasDocuments && (
            <View className="flex flex-col gap-2">
              <Text style={{ color: colors.textPrimary }} className="px-2 text-sm font-bold uppercase tracking-wider">
                Documents
              </Text>
              <View
                style={{ 
                  backgroundColor: colors.card, 
                  borderWidth: isDarkColorScheme ? 0 : 1, 
                  borderColor: colors.border 
                }}
                className="overflow-hidden rounded-xl"
              >
                {['front', 'back', 'selfie'].map((docType, index) => {
                  const hasDoc = kycStatus.hasDocuments?.[docType as 'front' | 'back' | 'selfie'];
                  const isLast = index === ['front', 'back', 'selfie'].length - 1;
                  return (
                    <View key={docType}>
                      <View
                        className="flex-row items-center justify-between px-4 py-4 min-h-[56px]"
                      >
                        <View className="flex-row items-center gap-4 flex-1">
                          <View 
                            style={{ 
                              backgroundColor: isDarkColorScheme 
                                ? 'rgba(13, 165, 165, 0.15)' 
                                : 'rgba(13, 165, 165, 0.1)' 
                            }}
                            className="w-10 h-10 items-center justify-center rounded-lg"
                          >
                            <Ionicons 
                              name={docType === 'selfie' ? 'person' : 'document-text'} 
                              size={22} 
                              color={colors.primary} 
                            />
                          </View>
                          <Text style={{ color: colors.textPrimary }} className="flex-1 text-base font-medium">
                            {docType === 'front' ? 'Front of ID' : docType === 'back' ? 'Back of ID' : 'Selfie Photo'}
                          </Text>
                        </View>
                        {hasDoc ? (
                          <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                        ) : (
                          <Ionicons name="close-circle" size={24} color={colors.destructive} />
                        )}
                      </View>
                      {!isLast && (
                        <View style={{ height: 1, backgroundColor: colors.border }} className="mx-4" />
                      )}
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          {/* Action Buttons */}
          {status === 'verified' ? (
            <TouchableOpacity
              onPress={handleViewDetails}
              style={{
                backgroundColor: colors.card,
                borderWidth: isDarkColorScheme ? 0 : 1,
                borderColor: colors.border,
              }}
              className="rounded-xl p-4 items-center"
            >
              <Text style={{ fontSize: 16, fontWeight: '600', color: colors.primary }}>View Details</Text>
            </TouchableOpacity>
          ) : (
            <View className="gap-3">
              <TouchableOpacity onPress={handleStartVerification} activeOpacity={0.8}>
                <LinearGradient
                  colors={['#0da5a5', '#0a8a8a']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  className="rounded-xl p-4 items-center"
                >
                  <Text style={{ fontSize: 16, fontWeight: '600', color: '#FFFFFF' }}>
                    {status === 'rejected'
                      ? 'Resubmit Documents'
                      : status === 'pending'
                      ? 'Upload/Update Documents'
                      : 'Start Verification'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>

              {status === 'pending' && (
                <TouchableOpacity
                  onPress={handleViewDetails}
                  style={{
                    backgroundColor: colors.card,
                    borderWidth: isDarkColorScheme ? 0 : 1,
                    borderColor: colors.border,
                  }}
                  className="rounded-xl p-4 items-center"
                >
                  <Text style={{ fontSize: 16, fontWeight: '600', color: colors.textPrimary }}>View Details</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Info Section */}
          <View
            style={{
              padding: 16,
              backgroundColor: isDarkColorScheme 
                ? 'rgba(13, 165, 165, 0.1)' 
                : 'rgba(13, 165, 165, 0.05)',
              borderRadius: 12,
            }}
          >
            <View className="flex-row items-center gap-2 mb-2">
              <Ionicons name="information-circle" size={20} color={colors.primary} />
              <Text style={{ fontSize: 14, fontWeight: '600', color: colors.textPrimary }}>
                About KYC Verification
              </Text>
            </View>
            <Text style={{ fontSize: 13, color: colors.textSecondary, lineHeight: 20 }}>
              KYC (Know Your Customer) verification is required to comply with financial regulations. Please upload
              clear photos of your identification documents. The verification process typically takes 1-3 business
              days.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

