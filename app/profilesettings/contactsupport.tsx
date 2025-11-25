import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  TextInput,
  Linking,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useColorScheme } from "@/lib/useColorScheme";
import { contactInfo, contactMethodsData } from "@/data/mockProfile";
import { ContactMethod, ContactMethodData } from "@/types/profilesettings";

export default function ContactSupportScreen() {
  const router = useRouter();
  const { colors, isDarkColorScheme } = useColorScheme();
  
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLiveChat = () => {
    console.log("Open live chat");
    Alert.alert("Live Chat", "Live chat feature will be available soon!");
  };

  const handleEmail = () => {
    Linking.openURL(`mailto:${contactInfo.email}`);
  };

  const handlePhone = () => {
    Linking.openURL(`tel:${contactInfo.phone.replace(/\s/g, "")}`);
  };

  const handleWhatsApp = () => {
    const phoneNumber = contactInfo.phone.replace(/[^\d]/g, "");
    Linking.openURL(`https://wa.me/${phoneNumber}`);
  };

  // Map contact methods data with action handlers
  const contactMethods: ContactMethod[] = contactMethodsData.map((method: ContactMethodData) => {
    let action: () => void;
    
    switch (method.id) {
      case "chat":
        action = handleLiveChat;
        break;
      case "email":
        action = handleEmail;
        break;
      case "phone":
        action = handlePhone;
        break;
      case "whatsapp":
        action = handleWhatsApp;
        break;
      default:
        action = () => {};
    }
    
    return {
      ...method,
      action,
    };
  });

  const handleSubmit = async () => {
    if (!name || !email || !subject || !message) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      Alert.alert(
        "Success",
        "Your message has been sent! We'll get back to you within 24 hours.",
        [
          {
            text: "OK",
            onPress: () => {
              setName("");
              setEmail("");
              setSubject("");
              setMessage("");
            },
          },
        ]
      );
    }, 1500);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle={isDarkColorScheme ? "light-content" : "dark-content"} />

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
             Contact
            </Text>
          </View>

          <View className="w-10" />
        </View>

       
      </View>

      <ScrollView 
        className="flex-1"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="never"
      >
        <View className="px-4 py-6">
          {/* Support Hours Banner */}
          <View 
            style={{ 
              backgroundColor: isDarkColorScheme 
                ? 'rgba(13, 165, 165, 0.1)' 
                : 'rgba(13, 165, 165, 0.05)',
              borderWidth: 1,
              borderColor: isDarkColorScheme 
                ? 'rgba(13, 165, 165, 0.3)' 
                : 'rgba(13, 165, 165, 0.2)'
            }}
            className="rounded-xl p-4 mb-6"
          >
            <View className="flex-row items-center gap-3">
              <View 
                style={{ 
                  backgroundColor: isDarkColorScheme 
                    ? 'rgba(13, 165, 165, 0.2)' 
                    : 'rgba(13, 165, 165, 0.15)' 
                }}
                className="w-12 h-12 items-center justify-center rounded-full"
              >
                <Ionicons name="time" size={24} color={colors.primary} />
              </View>
              <View className="flex-1">
                <Text style={{ color: colors.textPrimary }} className="text-sm font-semibold mb-1">
                  {contactInfo.supportHours}
                </Text>
                <Text style={{ color: colors.textSecondary }} className="text-xs leading-relaxed">
                  Our support team is available around the clock to help you with any questions or issues.
                </Text>
              </View>
            </View>
          </View>

          {/* Contact Methods */}
          <View className="mb-6">
            <Text style={{ color: colors.textPrimary }} className="px-2 text-sm font-bold uppercase tracking-wider mb-3">
              Quick Contact
            </Text>
            
            <View className="flex-row flex-wrap gap-3">
              {contactMethods.map((method) => (
                <TouchableOpacity
                  key={method.id}
                  onPress={method.action}
                  style={{ 
                    backgroundColor: colors.card,
                    borderWidth: isDarkColorScheme ? 0 : 1,
                    borderColor: colors.border,
                    width: '48%',
                  }}
                  className="rounded-xl p-4"
                  activeOpacity={0.7}
                >
                  <View 
                    style={{ backgroundColor: `${method.color}20` }}
                    className="w-12 h-12 items-center justify-center rounded-full mb-3"
                  >
                    <Ionicons name={method.icon as any} size={24} color={method.color} />
                  </View>
                  <Text style={{ color: colors.textPrimary }} className="text-sm font-semibold mb-1">
                    {method.title}
                  </Text>
                  <Text style={{ color: colors.textSecondary }} className="text-xs">
                    {method.subtitle}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Contact Form */}
          <View className="mb-6">
            <Text style={{ color: colors.textPrimary }} className="px-2 text-sm font-bold uppercase tracking-wider mb-3">
              Send Us a Message
            </Text>
            
            <View 
              style={{ 
                backgroundColor: colors.card,
                borderWidth: isDarkColorScheme ? 0 : 1,
                borderColor: colors.border 
              }}
              className="rounded-xl p-4"
            >
              {/* Name Input */}
              <View className="mb-4">
                <Text style={{ color: colors.textPrimary }} className="text-sm font-medium mb-2">
                  Name
                </Text>
                <TextInput
                  style={{ 
                    backgroundColor: isDarkColorScheme ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                    color: colors.textPrimary,
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                  className="px-4 py-3 rounded-lg text-base"
                  placeholder="Your full name"
                  placeholderTextColor={colors.textMuted}
                  value={name}
                  onChangeText={setName}
                />
              </View>

              {/* Email Input */}
              <View className="mb-4">
                <Text style={{ color: colors.textPrimary }} className="text-sm font-medium mb-2">
                  Email
                </Text>
                <TextInput
                  style={{ 
                    backgroundColor: isDarkColorScheme ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                    color: colors.textPrimary,
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                  className="px-4 py-3 rounded-lg text-base"
                  placeholder="your.email@example.com"
                  placeholderTextColor={colors.textMuted}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              {/* Subject Input */}
              <View className="mb-4">
                <Text style={{ color: colors.textPrimary }} className="text-sm font-medium mb-2">
                  Subject
                </Text>
                <TextInput
                  style={{ 
                    backgroundColor: isDarkColorScheme ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                    color: colors.textPrimary,
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                  className="px-4 py-3 rounded-lg text-base"
                  placeholder="Brief description of your issue"
                  placeholderTextColor={colors.textMuted}
                  value={subject}
                  onChangeText={setSubject}
                />
              </View>

              {/* Message Input */}
              <View className="mb-4">
                <Text style={{ color: colors.textPrimary }} className="text-sm font-medium mb-2">
                  Message
                </Text>
                <TextInput
                  style={{ 
                    backgroundColor: isDarkColorScheme ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                    color: colors.textPrimary,
                    borderWidth: 1,
                    borderColor: colors.border,
                    textAlignVertical: 'top',
                  }}
                  className="px-4 py-3 rounded-lg text-base"
                  placeholder="Describe your issue or question in detail..."
                  placeholderTextColor={colors.textMuted}
                  value={message}
                  onChangeText={setMessage}
                  multiline
                  numberOfLines={6}
                />
              </View>

              {/* Submit Button */}
              <TouchableOpacity
                onPress={handleSubmit}
                disabled={isSubmitting}
                style={{ 
                  backgroundColor: isSubmitting ? colors.textMuted : colors.primary,
                  opacity: isSubmitting ? 0.6 : 1,
                }}
                className="h-12 items-center justify-center rounded-lg"
                activeOpacity={0.8}
              >
                <Text className="text-white text-base font-bold">
                  {isSubmitting ? "Sending..." : "Send Message"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Office Information */}
          <View className="mb-6">
            <Text style={{ color: colors.textPrimary }} className="px-2 text-sm font-bold uppercase tracking-wider mb-3">
              Office Information
            </Text>
            
            <View 
              style={{ 
                backgroundColor: colors.card,
                borderWidth: isDarkColorScheme ? 0 : 1,
                borderColor: colors.border 
              }}
              className="rounded-xl overflow-hidden"
            >
              {/* Address */}
              <View className="px-4 py-4 flex-row items-start gap-3">
                <View 
                  style={{ 
                    backgroundColor: isDarkColorScheme 
                      ? 'rgba(13, 165, 165, 0.15)' 
                      : 'rgba(13, 165, 165, 0.1)' 
                  }}
                  className="w-10 h-10 items-center justify-center rounded-lg"
                >
                  <Ionicons name="location" size={22} color={colors.primary} />
                </View>
                <View className="flex-1">
                  <Text style={{ color: colors.textPrimary }} className="text-sm font-semibold mb-1">
                    Headquarters
                  </Text>
                  <Text style={{ color: colors.textSecondary }} className="text-sm leading-relaxed">
                    {contactInfo.address}
                  </Text>
                </View>
              </View>

              <View style={{ height: 1, backgroundColor: colors.border }} className="mx-4" />

              {/* Business Hours */}
              <View className="px-4 py-4 flex-row items-start gap-3">
                <View 
                  style={{ 
                    backgroundColor: isDarkColorScheme 
                      ? 'rgba(13, 165, 165, 0.15)' 
                      : 'rgba(13, 165, 165, 0.1)' 
                  }}
                  className="w-10 h-10 items-center justify-center rounded-lg"
                >
                  <Ionicons name="time" size={22} color={colors.primary} />
                </View>
                <View className="flex-1">
                  <Text style={{ color: colors.textPrimary }} className="text-sm font-semibold mb-1">
                    Business Hours
                  </Text>
                  <Text style={{ color: colors.textSecondary }} className="text-sm leading-relaxed">
                    {contactInfo.businessHours}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Social Media */}
          <View className="mb-4">
            <Text style={{ color: colors.textPrimary }} className="px-2 text-sm font-bold uppercase tracking-wider mb-3">
              Follow Us
            </Text>
            
            <View className="flex-row gap-3">
              {contactInfo.socialMedia.map((social) => (
                <TouchableOpacity
                  key={social.name}
                  onPress={() => {
                    if (social.url) {
                      Linking.openURL(social.url);
                    }
                  }}
                  style={{ 
                    backgroundColor: colors.card,
                    borderWidth: isDarkColorScheme ? 0 : 1,
                    borderColor: colors.border,
                  }}
                  className="w-14 h-14 items-center justify-center rounded-xl"
                  activeOpacity={0.7}
                >
                  <Ionicons name={social.icon as any} size={24} color={colors.primary} />
                </TouchableOpacity>
              ))}
            </View>
          </View>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}