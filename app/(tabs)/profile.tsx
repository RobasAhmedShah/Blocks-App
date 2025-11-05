import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  SafeAreaView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function BlocksProfileScreen() {
  const sections = [
    {
      title: "Account Settings",
      items: [
        { icon: "person-outline", label: "Personal Information" },
        { icon: "shield-outline", label: "Security" },
        { icon: "card-outline", label: "Linked Bank Accounts" },
      ],
    },
    {
      title: "App Preferences",
      items: [
        { icon: "notifications-outline", label: "Notifications" },
        { icon: "contrast-outline", label: "Theme" },
        { icon: "language-outline", label: "Language" },
      ],
    },
    {
      title: "Support & Legal",
      items: [
        { icon: "help-circle-outline", label: "Help & FAQ" },
        { icon: "headset-outline", label: "Contact Support" },
        { icon: "lock-closed-outline", label: "Privacy Policy" },
        { icon: "document-text-outline", label: "Terms of Service" },
      ],
    },
  ];

  return (
    <SafeAreaView className="flex-1 bg-[#f6f8f8]">
      {/* Header */}
      <View className="flex-row items-center p-4 border-b border-gray-200">
        <TouchableOpacity className="w-12 items-start">
          <Ionicons name="arrow-back" size={24} color="#0b3d36" />
        </TouchableOpacity>
        <Text className="flex-1 text-center text-lg font-bold text-[#0b3d36]">
          Profile
        </Text>
        <View className="w-12" />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
        className="px-4"
      >
        {/* Profile Header */}
        <View className="items-center py-6">
          <View className="relative">
            <Image
              source={{
                uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuDUQTVI4GmmZSNqHVKlBtkECE8EXneO5APGyiwiS0A_9vhIejSw4VReGzra1bZlvfYIfD_b8wr7Ci-vAC-Ev-65NOCLRTL7_rVR3TtaZm4Ui6ZzuQpnFA9RKIPi8YnHv_gdqVguPj1KR4V-bFX0mWsXbRSofAgRo-ZLbkZHbsOYzDJt_kEIzgNzZFrXFMNT1eGY0fe674o-rnTYvySJCqchFmZimxGzflbVkuHNrpZvoLhn9klHR6SfVjf_WOm9t1V1ZwimD5GBJLI",
              }}
              className="h-28 w-28 rounded-full"
            />
            <View className="absolute bottom-0 right-0 h-8 w-8 rounded-full border-2 border-white bg-[#0da5a533] items-center justify-center">
              <Ionicons name="create-outline" size={18} color="#0da5a5" />
            </View>
          </View>
          <Text className="text-[22px] font-bold text-[#0b3d36] mt-3">
            Jordan Smith
          </Text>
          <Text className="text-base text-gray-500">
            jordan.smith@email.com
          </Text>
        </View>

        {/* Sections */}
        {sections.map((section, idx) => (
          <View key={idx} className="mb-8">
            <Text className="px-2 text-sm font-bold uppercase tracking-wider text-gray-400 mb-2">
              {section.title}
            </Text>
            <View className="rounded-xl bg-white border border-gray-200 shadow-sm overflow-hidden">
              {section.items.map((item, i) => (
                <View key={i}>
                  <TouchableOpacity className="flex-row items-center justify-between px-4 py-4 active:bg-gray-100">
                    <View className="flex-row items-center gap-4">
                      <View className="w-10 h-10 bg-[#0da5a522] rounded-lg items-center justify-center">
                        <Ionicons name={item.icon as any} size={22} color="#0da5a5" />
                      </View>
                      <Text className="text-base font-medium text-[#0b3d36]">
                        {item.label}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color="#9ca3af" />
                  </TouchableOpacity>
                  {i < section.items.length - 1 && (
                    <View className="h-px bg-gray-100 mx-4" />
                  )}
                </View>
              ))}
            </View>
          </View>
        ))}

        {/* Logout */}
        <TouchableOpacity className="flex-row items-center justify-center gap-2 h-12 bg-red-50 mb-16 border border-red-100 rounded-xl">
          <Ionicons name="log-out-outline" size={20} color="#ef4444" />
          <Text className="text-red-500 font-bold text-base">Log Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
