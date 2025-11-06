import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Image,
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

export default function PersonalInformationScreen() {
  const router = useRouter();
  const shimmerTranslate = useSharedValue(-1);
  const { colors, isDarkColorScheme } = useColorScheme();
  const { state, updateUserInfo } = useApp();
  const [userInfo, setUserInfo] = useState<UserInfo>(state.userInfo);
  const [isSaving, setIsSaving] = useState(false);
  const [editingField, setEditingField] = useState<string | null>(null);

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
      await updateUserInfo(userInfo);
      setEditingField(null);
      router.back();
    } catch (error) {
      console.error('Failed to save changes:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePhoto = () => {
    console.log("Change photo");
    // Handle photo change logic
  };

  const handleEditField = (field: string) => {
    setEditingField(editingField === field ? null : field);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View className="flex-row items-center px-4 py-4">
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-12 h-12 items-center justify-center"
        >
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>

        <Text style={{ color: colors.textPrimary }} className="flex-1 text-center text-lg font-bold">
          Personal Information
        </Text>

        <View className="w-12" />
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
              className="relative"
              activeOpacity={0.8}
            >
              <View className="w-32 h-32 rounded-full border-4 border-[#0da5a5]/50 overflow-hidden">
                <Image
                  source={{ uri: userInfo.profileImage }}
                  className="w-full h-full"
                  resizeMode="cover"
                />
              </View>
              
              {/* Overlay on press */}
              <View className="absolute inset-0 w-32 h-32 rounded-full bg-black/50 items-center justify-center">
                <Ionicons name="camera" size={32} color="white" />
                <Text className="text-white text-xs font-semibold mt-1">
                  CHANGE
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Form Fields */}
          <View className="space-y-4">
            {/* Full Name */}
            <View className="p-4">
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-[#0da5a5]/70 text-xs font-semibold uppercase tracking-wider">
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
                className="w-full border-b border-white/20 py-2 text-base text-white"
                value={userInfo.fullName}
                onChangeText={(text) => setUserInfo({ ...userInfo, fullName: text })}
                placeholder="Enter your full name"
                placeholderTextColor="rgba(255,255,255,0.4)"
                editable={editingField === "fullName"}
              />
            </View>

            {/* Email Address */}
            <View className="p-4">
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-[#0da5a5]/70 text-xs font-semibold uppercase tracking-wider">
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
                className="w-full border-b border-white/20 py-2 text-base text-white"
                value={userInfo.email}
                onChangeText={(text) => setUserInfo({ ...userInfo, email: text })}
                placeholder="Enter your email"
                placeholderTextColor="rgba(255,255,255,0.4)"
                keyboardType="email-address"
                editable={editingField === "email"}
              />
            </View>

            {/* Phone Number */}
            <View className="p-4">
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-[#0da5a5]/70 text-xs font-semibold uppercase tracking-wider">
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
                className="w-full border-b border-white/20 py-2 text-base text-white"
                value={userInfo.phone}
                onChangeText={(text) => setUserInfo({ ...userInfo, phone: text })}
                placeholder="Enter your phone number"
                placeholderTextColor="rgba(255,255,255,0.4)"
                keyboardType="phone-pad"
                editable={editingField === "phone"}
              />
            </View>

            {/* Date of Birth */}
            <View className="p-4">
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-[#0da5a5]/70 text-xs font-semibold uppercase tracking-wider">
                  Date of Birth
                </Text>
                <TouchableOpacity
                  onPress={() => handleEditField("dob")}
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
                className="w-full border-b border-white/20 py-2 text-base text-white"
                value={userInfo.dob}
                onChangeText={(text) => setUserInfo({ ...userInfo, dob: text })}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="rgba(255,255,255,0.4)"
                editable={editingField === "dob"}
              />
            </View>

            {/* Residential Address */}
            <View className="p-4">
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-[#0da5a5]/70 text-xs font-semibold uppercase tracking-wider">
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
                className="w-full border-b border-white/20 py-2 text-base text-white"
                value={userInfo.address}
                onChangeText={(text) => setUserInfo({ ...userInfo, address: text })}
                placeholder="Enter your address"
                placeholderTextColor="rgba(255,255,255,0.4)"
                multiline
                numberOfLines={3}
                editable={editingField === "address"}
                style={{ textAlignVertical: 'top' }}
              />
            </View>
          </View>

          {/* Save Changes Button with Shimmer Effect */}
          <View className="pt-8">
            <TouchableOpacity
              onPress={handleSaveChanges}
              activeOpacity={0.9}
              className="overflow-hidden rounded-xl"
            >
              <LinearGradient
                colors={['#0da5a5', '#087f7f', '#D4AF37', '#087f7f', '#0da5a5']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                className="h-14 items-center justify-center"
              >
                <Animated.View
                  style={[
                    {
                      position: 'absolute',
                      top: 0,
                      left: -400,
                      width: 400,
                      height: '100%',
                      backgroundColor: 'rgba(255,255,255,0.3)',
                    },
                    shimmerStyle,
                  ]}
                />
                <Text className="text-white text-lg font-bold">
                  Save Changes
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}