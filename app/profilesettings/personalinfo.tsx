import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
  Platform,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useAnimatedStyle,
  withRepeat,
  withTiming,
  useSharedValue,
  Easing,
} from "react-native-reanimated";
import { useColorScheme } from "@/lib/useColorScheme";
import { UserInfo } from "@/types/profilesettings";
import { useApp } from "@/contexts/AppContext";
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import EmeraldLoader from "@/components/EmeraldLoader";
import { profileApi } from "@/services/api/profile.api";
// DateTimePicker is provided by @react-native-community/datetimepicker (bundled with Expo)
// Use dynamic require to avoid type resolution issues in tooling.
const DateTimePicker: any =
  Platform.OS === 'ios' || Platform.OS === 'android'
    ? // eslint-disable-next-line @typescript-eslint/no-var-requires
      require('@react-native-community/datetimepicker').default
    : null;

export default function PersonalInformationScreen() {
  const router = useRouter();
  const shimmerTranslate = useSharedValue(-1);
  const { colors, isDarkColorScheme } = useColorScheme();
  const { state, updateUserInfo } = useApp();
  const [userInfo, setUserInfo] = useState<UserInfo>(state.userInfo);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [localImageUri, setLocalImageUri] = useState<string | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dobDate, setDobDate] = useState<Date | null>(() => {
    if (state.userInfo?.dob) {
      const d = new Date(state.userInfo.dob as any);
      return isNaN(d.getTime()) ? null : d;
    }
    return null;
  });

  // Refs for input fields to enable auto-focus
  const fullNameInputRef = useRef<TextInput>(null);
  const emailInputRef = useRef<TextInput>(null);
  const phoneInputRef = useRef<TextInput>(null);
  const addressInputRef = useRef<TextInput>(null);

  // Sync with context when it changes
  React.useEffect(() => {
    setUserInfo(state.userInfo);
  }, [state.userInfo]);

  // Shimmer animation
  React.useEffect(() => {
    shimmerTranslate.value = withRepeat(
      withTiming(1, {
        duration: 5000,
        easing: Easing.linear,
      }),
      -1,
      false
    );
  }, []);

  const shimmerStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateX: shimmerTranslate.value * 400,
        },
      ],
    };
  });

  const handleSaveChanges = async () => {
    setIsSaving(true);
    try {
      // Update all fields including dob, address, phone, etc.
      await updateUserInfo({
        fullName: userInfo.fullName,
        email: userInfo.email,
        phone: userInfo.phone || undefined,
        dob: userInfo.dob || undefined,
        address: userInfo.address || undefined,
        profileImage: userInfo.profileImage || undefined,
      });
      setEditingField(null);
      // No success alert - just navigate back
      router.back();
    } catch (error: any) {
      console.error('Failed to save changes:', error);
      Alert.alert('Error', error.message || 'Failed to save changes. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePhoto = async () => {
    try {
      // Request permissions
      const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
      const { status: mediaStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (cameraStatus !== 'granted' || mediaStatus !== 'granted') {
        Alert.alert(
          'Permissions Required',
          'Camera and photo library access is required to upload profile picture.'
        );
        return;
      }

      // Show action sheet
      Alert.alert(
        'Select Photo',
        'Choose an option',
        [
          { text: 'Camera', onPress: () => pickImage('camera') },
          { text: 'Gallery', onPress: () => pickImage('gallery') },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
    } catch (error) {
      console.error('Error requesting permissions:', error);
      Alert.alert('Error', 'Failed to request permissions');
    }
  };

  const pickImage = async (source: 'camera' | 'gallery') => {
    try {
      let result;
      if (source === 'camera') {
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ['images'],
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });
      } else {
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });
      }

      if (!result.canceled && result.assets[0]) {
        const uri = result.assets[0].uri;
        setLocalImageUri(uri);
        // Upload image immediately
        await uploadProfileImage(uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const uploadProfileImage = async (imageUri: string) => {
    try {
      setIsUploadingImage(true);
      
      // Read file as base64
      const base64 = await FileSystem.readAsStringAsync(imageUri, {
        encoding: 'base64',
      });

      const fileName = imageUri.split('/').pop() || 'profile.jpg';
      const fileExtension = fileName.split('.').pop()?.toLowerCase();
      const mimeType = fileExtension === 'png' ? 'image/png' : fileExtension === 'webp' ? 'image/webp' : 'image/jpeg';

      // Upload to backend
      const result = await profileApi.uploadProfileImage(base64, fileName, mimeType);
      
      // Update local state with new image URL
      setUserInfo({ ...userInfo, profileImage: result.url });
      setLocalImageUri(null); // Clear local URI since we have the URL now
      
      // No success alert - visual feedback (image update) is sufficient
    } catch (error: any) {
      console.error('Error uploading profile image:', error);
      Alert.alert('Error', error.message || 'Failed to upload profile picture. Please try again.');
      setLocalImageUri(null);
    } finally {
      setIsUploadingImage(false);
    }
  };

  const onDateChange = (_: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios'); // keep picker open on iOS
    if (selectedDate) {
      const iso = selectedDate.toISOString().split('T')[0];
      setDobDate(selectedDate);
      setUserInfo({ ...userInfo, dob: iso });
    }
  };

  const handleEditField = (field: string) => {
    if (editingField === field) {
      // If already editing, stop editing
      setEditingField(null);
    } else {
      // Start editing and focus the input
      setEditingField(field);
      
      // Auto-focus the corresponding input field
      setTimeout(() => {
        switch (field) {
          case 'fullName':
            fullNameInputRef.current?.focus();
            break;
          case 'email':
            emailInputRef.current?.focus();
            break;
          case 'phone':
            phoneInputRef.current?.focus();
            break;
          case 'address':
            addressInputRef.current?.focus();
            break;
        }
      }, 100); // Small delay to ensure the field is editable
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle={isDarkColorScheme ? "light-content" : "dark-content"} />

      {/* Header */}
        {/* Header */}
        <View
      style={{ borderBottomWidth: 1, borderBottomColor: colors.border }}
      className="flex-row items-center px-4 py-4 mt-8"
      >
        <View className="flex-row items-center justify-between">
          <TouchableOpacity 
            className="w-10 h-10 items-center justify-center"
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>

          <View className="flex-1 items-center">
            <Text style={{ color: colors.textPrimary }} className="text-lg font-bold">
              Personal Information
            </Text>
          </View>

          <View className="w-10" />
        </View>

       
      </View>

      <ScrollView 
        className="flex-1"
        showsVerticalScrollIndicator={false}
      >
        <View className="px-4 pb-8">
          {/* Profile Photo Section */}
          <View style={{ width: '100%', alignItems: 'center', paddingVertical: 24 }}>
            <TouchableOpacity
              onPress={handleChangePhoto}
              disabled={isUploadingImage}
              className="relative"
              activeOpacity={0.8}
            >
              <View 
                style={{ 
                  borderColor: colors.primary + '80',
                  backgroundColor: colors.card,
                }}
                className="w-32 h-32 rounded-full border-4 overflow-hidden items-center justify-center"
              >
                {isUploadingImage ? (
                  <EmeraldLoader />
                ) : (localImageUri || userInfo.profileImage) ? (
                  <Image
                    source={{ uri: localImageUri || userInfo.profileImage || '' }}
                    className="w-full h-full"
                    resizeMode="cover"
                    defaultSource={require('@/assets/blank.png')}
                  />
                ) : (
                  <Ionicons name="person" size={64} color={colors.textMuted} />
                )}
              </View>
              
              {/* Overlay on press */}
              {!isUploadingImage && (
                <View className="absolute inset-0 w-32 h-32 rounded-full bg-black/50 items-center justify-center">
                  <Ionicons name="camera" size={32} color="white" />
                  <Text className="text-white text-xs font-semibold mt-1">
                    CHANGE
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Form Fields */}
          <View className="space-y-4">
            {/* Full Name */}
            <View className="p-4">
              <View className="flex-row items-center justify-between mb-2">
                <Text 
                  style={{ color: colors.primary + 'B3' }}
                  className="text-xs font-semibold uppercase tracking-wider"
                >
                  Full Name
                </Text>
                <TouchableOpacity
                  onPress={() => handleEditField("fullName")}
                  className="p-1"
                >
                  <Ionicons 
                    name="create-outline" 
                    size={20} 
                    color="#D4AF37"
                  />
                </TouchableOpacity>
              </View>
              <TextInput
                ref={fullNameInputRef}
                style={{ 
                  borderBottomColor: editingField === "fullName" ? colors.primary : colors.border,
                  borderBottomWidth: editingField === "fullName" ? 2 : 1,
                  color: colors.textPrimary,
                }}
                className="w-full border-b py-2 text-base"
                value={userInfo.fullName}
                onChangeText={(text) => setUserInfo({ ...userInfo, fullName: text })}
                placeholder="Enter your full name"
                placeholderTextColor={colors.textMuted}
                editable={editingField === "fullName"}
              />
            </View>

            {/* Email Address */}
            <View className="p-4">
              <View className="flex-row items-center justify-between mb-2">
                <Text 
                  style={{ color: colors.primary + 'B3' }}
                  className="text-xs font-semibold uppercase tracking-wider"
                >
                  Email Address
                </Text>
                <TouchableOpacity
                  onPress={() => handleEditField("email")}
                  className="p-1"
                >
                  <Ionicons 
                    name="create-outline" 
                    size={20} 
                    color="#D4AF37"
                  />
                </TouchableOpacity>
              </View>
              <TextInput
                ref={emailInputRef}
                style={{ 
                  borderBottomColor: editingField === "email" ? colors.primary : colors.border,
                  borderBottomWidth: editingField === "email" ? 2 : 1,
                  color: colors.textPrimary,
                }}
                className="w-full border-b py-2 text-base"
                value={userInfo.email}
                onChangeText={(text) => setUserInfo({ ...userInfo, email: text })}
                placeholder="Enter your email"
                placeholderTextColor={colors.textMuted}
                keyboardType="email-address"
                editable={editingField === "email"}
              />
            </View>

            {/* Phone Number */}
            <View className="p-4">
              <View className="flex-row items-center justify-between mb-2">
                <Text 
                  style={{ color: colors.primary + 'B3' }}
                  className="text-xs font-semibold uppercase tracking-wider"
                >
                  Phone Number
                </Text>
                <TouchableOpacity
                  onPress={() => handleEditField("phone")}
                  className="p-1"
                >
                  <Ionicons 
                    name="create-outline" 
                    size={20} 
                    color="#D4AF37"
                  />
                </TouchableOpacity>
              </View>
              <TextInput
                ref={phoneInputRef}
                style={{ 
                  borderBottomColor: editingField === "phone" ? colors.primary : colors.border,
                  borderBottomWidth: editingField === "phone" ? 2 : 1,
                  color: colors.textPrimary,
                }}
                className="w-full border-b py-2 text-base"
                value={userInfo.phone}
                onChangeText={(text) => setUserInfo({ ...userInfo, phone: text })}
                placeholder="Enter your phone number"
                placeholderTextColor={colors.textMuted}
                keyboardType="phone-pad"
                editable={editingField === "phone"}
              />
            </View>

            {/* Date of Birth */}
            <View className="p-4">
              <View className="flex-row items-center justify-between mb-2">
                <Text 
                  style={{ color: colors.primary + 'B3' }}
                  className="text-xs font-semibold uppercase tracking-wider"
                >
                  Date of Birth
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    handleEditField("dob");
                    setShowDatePicker(true);
                  }}
                  className="p-1"
                >
                  <Ionicons 
                    name="create-outline" 
                    size={20} 
                    color="#D4AF37"
                  />
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                onPress={() => setShowDatePicker(true)}
                activeOpacity={0.7}
                style={{
                  borderBottomColor: colors.border,
                  borderBottomWidth: 1,
                  paddingVertical: 10,
                }}
              >
                <Text
                  style={{
                    color: userInfo.dob ? colors.textPrimary : colors.textMuted,
                    fontSize: 16,
                  }}
                >
                  {userInfo.dob || 'YYYY-MM-DD'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Residential Address */}
            <View className="p-4">
              <View className="flex-row items-center justify-between mb-2">
                <Text 
                  style={{ color: colors.primary + 'B3' }}
                  className="text-xs font-semibold uppercase tracking-wider"
                >
                  Residential Address
                </Text>
                <TouchableOpacity
                  onPress={() => handleEditField("address")}
                  className="p-1"
                >
                  <Ionicons 
                    name="create-outline" 
                    size={20} 
                    color="#D4AF37"
                  />
                </TouchableOpacity>
              </View>
              <TextInput
                ref={addressInputRef}
                style={{ 
                  borderBottomColor: editingField === "address" ? colors.primary : colors.border,
                  borderBottomWidth: editingField === "address" ? 2 : 1,
                  color: colors.textPrimary,
                  textAlignVertical: 'top',
                }}
                className="w-full border-b py-2 text-base"
                value={userInfo.address}
                onChangeText={(text) => setUserInfo({ ...userInfo, address: text })}
                placeholder="Enter your address"
                placeholderTextColor={colors.textMuted}
                multiline
                numberOfLines={3}
                editable={editingField === "address"}
              />
            </View>
          </View>

          {/* Save Changes Button with Shimmer Effect */}
          <View className="pt-8">
            <TouchableOpacity
              onPress={handleSaveChanges}
              disabled={isSaving}
              activeOpacity={0.9}
              className="overflow-hidden rounded-xl"
              style={{ opacity: isSaving ? 0.6 : 1 }}
            >
              <LinearGradient
                colors={[colors.primarySoft, colors.primary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                className="h-14 items-center justify-center"
              >
                <Animated.View
                  // style={[
                  //   {
                  //     position: 'absolute',
                  //     top: 0,
                  //     left: -400,
                  //     width: 400,
                  //     height: '100%',
                  //     backgroundColor: 'rgba(255,255,255,0.3)',
                  //   },
                  //   shimmerStyle,
                  // ]}
                />
                <Text className="text-white text-lg font-bold">
                  {isSaving ? "Saving..." : "Save Changes"}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Date Picker Modal */}
      {showDatePicker && (
        <Modal
          transparent
          animationType="slide"
          visible={showDatePicker}
          onRequestClose={() => setShowDatePicker(false)}
        >
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
            <View style={{ backgroundColor: colors.card, padding: 12 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 8 }}>
                <TouchableOpacity onPress={() => setShowDatePicker(false)} style={{ padding: 8 }}>
                  <Text style={{ color: colors.primary, fontWeight: '600' }}>Done</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={dobDate || new Date()}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={onDateChange}
                maximumDate={new Date()}
              />
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}