import React, { useState } from 'react';
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
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useColorScheme } from '@/lib/useColorScheme';
import { kycApi } from '@/services/api/kyc.api';
import { useKycCheck } from '@/hooks/useKycCheck';

type DocumentType = 'front' | 'back' | 'selfie';

interface DocumentState {
  uri: string | null;
  uploading: boolean;
  uploaded: boolean;
  url?: string;
}

export default function KycUploadScreen() {
  const router = useRouter();
  const { colors, isDarkColorScheme } = useColorScheme();
  const { clearCache, loadKycStatus, setKycStatusOptimistic } = useKycCheck();
  const [documents, setDocuments] = useState<Record<DocumentType, DocumentState>>({
    front: { uri: null, uploading: false, uploaded: false },
    back: { uri: null, uploading: false, uploaded: false },
    selfie: { uri: null, uploading: false, uploaded: false },
  });
  const [submitting, setSubmitting] = useState(false);

  const requestPermissions = async () => {
    const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
    const { status: mediaStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (cameraStatus !== 'granted' || mediaStatus !== 'granted') {
      Alert.alert(
        'Permissions Required',
        'Camera and photo library access is required to upload documents.'
      );
      return false;
    }
    return true;
  };

  const pickImage = async (type: DocumentType, source: 'camera' | 'gallery') => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      let result;
      if (source === 'camera') {
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ['images'],
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.8,
        });
      } else {
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.8,
        });
      }

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        
        // Set the URI first (for immediate preview)
        setDocuments(prev => ({
          ...prev,
          [type]: { ...prev[type], uri: imageUri, uploading: true, uploaded: false },
        }));

        // Automatically upload the document
        try {
          console.log('Auto-uploading document for:', type, 'URI:', imageUri.substring(0, 50));
          const response = await kycApi.uploadDocument(imageUri, type);
          console.log('Auto-upload response:', response);
          
          setDocuments(prev => ({
            ...prev,
            [type]: {
              ...prev[type],
              uploading: false,
              uploaded: true,
              url: response.url,
            },
          }));
        } catch (uploadError) {
          console.error('Error auto-uploading document:', uploadError);
          
          let errorMessage = 'Failed to upload document. Please try again.';
          if (uploadError instanceof Error) {
            errorMessage = uploadError.message;
            if (uploadError.message.includes('Network request failed') || uploadError.message.includes('Failed to fetch')) {
              errorMessage = 
                'Cannot connect to server.\n\n' +
                'Please check:\n' +
                '1. Backend is running on port 3000\n' +
                '2. Your device can reach the server\n' +
                '3. Your internet connection is working';
            }
          }
          
          Alert.alert('Upload Failed', errorMessage);
          setDocuments(prev => ({
            ...prev,
            [type]: { ...prev[type], uploading: false, uploaded: false },
          }));
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
      // Reset uploading state if error occurs
      setDocuments(prev => ({
        ...prev,
        [type]: { ...prev[type], uploading: false },
      }));
    }
  };

  const handleSubmit = async () => {
    if (!documents.front.uploaded || !documents.selfie.uploaded) {
      Alert.alert('Required', 'Please upload both the front of your ID document and a selfie photo.');
      return;
    }

    try {
      setSubmitting(true);
      const submitData = {
        type: 'cnic' as const,
        documentFrontUrl: documents.front.url!,
        documentBackUrl: documents.back.uploaded ? documents.back.url : undefined,
        selfieUrl: documents.selfie.uploaded ? documents.selfie.url : undefined,
      };

      await kycApi.submitKyc(submitData);
      
      // CRITICAL: Immediately set status to 'pending' to hide alert instantly on home screen
      // This optimistic update prevents the alert from showing for 1-2 seconds
      setKycStatusOptimistic({
        status: 'pending',
        submittedAt: new Date().toISOString(),
      });
      
      // Clear old cache
      await clearCache();
      
      // Navigate back immediately - status is already updated, alert won't show
      router.back();
      
      // Refresh status in background after navigation to get latest from backend
      setTimeout(() => {
        loadKycStatus(false);
      }, 500);
    } catch (error) {
      console.error('Error submitting KYC:', error);
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to submit KYC verification.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderDocumentSection = (type: DocumentType, label: string, required: boolean) => {
    const doc = documents[type];
    return (
      <View
        style={{
          backgroundColor: colors.card,
          borderWidth: isDarkColorScheme ? 0 : 1,
          borderColor: colors.border,
        }}
        className="rounded-xl p-5 mb-4"
      >
        <View className="flex-row items-center mb-4">
          <Text style={{ fontSize: 16, fontWeight: '600', color: colors.textPrimary, flex: 1 }}>
            {label}
          </Text>
          <View className="flex-row items-center gap-2">
            {required && !doc.uploaded && (
              <Text style={{ fontSize: 12, color: colors.destructive, fontWeight: '600' }}>Required</Text>
            )}
            {doc.uploaded && (
              <View className="flex-row items-center gap-1">
                <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                <Text style={{ fontSize: 12, color: '#10B981', fontWeight: '600' }}>Uploaded</Text>
              </View>
            )}
            {doc.uploading && (
              <View className="flex-row items-center gap-1">
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={{ fontSize: 12, color: colors.primary, fontWeight: '600' }}>Uploading...</Text>
              </View>
            )}
          </View>
        </View>

        {doc.uri ? (
          <View>
            <Image
              source={{ uri: doc.uri }}
              style={{
                width: '100%',
                height: 200,
                borderRadius: 8,
                marginBottom: 12,
                backgroundColor: colors.background,
              }}
              resizeMode="contain"
            />
            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => pickImage(type, 'camera')}
                disabled={doc.uploading}
                style={{
                  flex: 1,
                  padding: 12,
                  backgroundColor: colors.background,
                  borderWidth: 1,
                  borderColor: colors.border,
                  opacity: doc.uploading ? 0.6 : 1,
                }}
                className="rounded-lg items-center"
              >
                <Ionicons name="camera" size={20} color={colors.textPrimary} />
                <Text style={{ fontSize: 12, color: colors.textPrimary, marginTop: 4 }}>Retake</Text>
              </TouchableOpacity>
              {doc.uploading ? (
                <View
                  style={{
                    flex: 1,
                    padding: 12,
                    backgroundColor: isDarkColorScheme 
                      ? 'rgba(13, 165, 165, 0.15)' 
                      : 'rgba(13, 165, 165, 0.1)',
                    borderWidth: 1,
                    borderColor: isDarkColorScheme 
                      ? 'rgba(13, 165, 165, 0.3)' 
                      : 'rgba(13, 165, 165, 0.2)',
                  }}
                  className="rounded-lg items-center"
                >
                  <ActivityIndicator size="small" color={colors.primary} />
                  <Text style={{ fontSize: 12, color: colors.primary, marginTop: 4, fontWeight: '600' }}>Uploading...</Text>
                </View>
              ) : doc.uploaded ? (
                <View
                  style={{
                    flex: 1,
                    padding: 12,
                    backgroundColor: isDarkColorScheme 
                      ? 'rgba(16, 185, 129, 0.15)' 
                      : 'rgba(16, 185, 129, 0.1)',
                    borderWidth: 1,
                    borderColor: isDarkColorScheme 
                      ? 'rgba(16, 185, 129, 0.3)' 
                      : 'rgba(16, 185, 129, 0.2)',
                  }}
                  className="rounded-lg items-center"
                >
                  <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                  <Text style={{ fontSize: 12, color: '#10B981', marginTop: 4, fontWeight: '600' }}>Uploaded</Text>
                </View>
              ) : (
                <View
                  style={{
                    flex: 1,
                    padding: 12,
                    backgroundColor: colors.background,
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                  className="rounded-lg items-center"
                >
                  <Ionicons name="alert-circle" size={20} color={colors.destructive} />
                  <Text style={{ fontSize: 12, color: colors.destructive, marginTop: 4, fontWeight: '600' }}>Upload Failed</Text>
                </View>
              )}
            </View>
          </View>
        ) : (
          <View className="flex-row gap-3">
            <TouchableOpacity
              onPress={() => pickImage(type, 'camera')}
              style={{
                flex: 1,
                padding: 16,
                backgroundColor: colors.background,
                borderWidth: 1,
                borderColor: colors.border,
              }}
              className="rounded-lg items-center"
            >
              <Ionicons name="camera" size={24} color={colors.textPrimary} />
              <Text style={{ fontSize: 14, color: colors.textPrimary, marginTop: 8 }}>Camera</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => pickImage(type, 'gallery')}
              style={{
                flex: 1,
                padding: 16,
                backgroundColor: colors.background,
                borderWidth: 1,
                borderColor: colors.border,
              }}
              className="rounded-lg items-center"
            >
              <Ionicons name="images" size={24} color={colors.textPrimary} />
              <Text style={{ fontSize: 14, color: colors.textPrimary, marginTop: 8 }}>Gallery</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

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
          Upload Documents
        </Text>
        <View className="w-12" />
      </View>

      <ScrollView 
        className="flex-1 px-4"
        showsVerticalScrollIndicator={false}
      >
        <View className="flex flex-col gap-4 py-6">
          <Text
            style={{
              fontSize: 14,
              color: colors.textSecondary,
              lineHeight: 20,
            }}
            className="px-2"
          >
            Please upload clear photos of your identification documents. Make sure all text is readable and the
            image is well-lit.
          </Text>

        {renderDocumentSection('front', 'Front of ID Document', true)}
        {renderDocumentSection('back', 'Back of ID Document (Optional)', false)}
        {renderDocumentSection('selfie', 'Selfie Photo', true)}

          <TouchableOpacity
            onPress={handleSubmit}
            disabled={submitting || !documents.front.uploaded || !documents.selfie.uploaded}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#0da5a5', '#0a8a8a']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
                borderRadius: 12,
                padding: 16,
                alignItems: 'center',
                opacity: submitting || !documents.front.uploaded ? 0.5 : 1,
              }}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={{ fontSize: 16, fontWeight: '600', color: '#FFFFFF' }}>
                  Submit for Verification
                </Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

