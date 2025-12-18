import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Platform } from "react-native";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: "#FFD700",
        tabBarInactiveTintColor: "rgba(255,255,255,0.6)",
        tabBarLabelStyle: {
          fontSize: 9,
          fontWeight: "600",
          marginTop: 2,
          marginBottom: 2,
          textTransform: "uppercase",
        },
        tabBarItemStyle: {
          justifyContent: "space-between",
          alignItems: "center",
          paddingVertical: 0,
          height: "80%",
        },
        tabBarIconStyle: {
          marginTop: 0,
          marginBottom: 0,
        },
        tabBarStyle: {
          position: "absolute",
          left: 20,
          right: 20,
          bottom: 0,
          height: 80,
          borderRadius: 10,
          paddingBottom: 8,
          paddingTop: 5,
          backgroundColor: "rgba(0, 0, 0, 0.9)",
          borderTopWidth: 0,
          borderWidth: 1,
          borderColor: "rgba(255,255,255,0.15)",
          
          // Center the entire tab bar content
          display: "flex",
          flexDirection: "row",
          justifyContent: "center",
          alignItems: "center",
          paddingHorizontal: 10,
          
          // Shadow
          shadowColor: "#000",
          shadowOpacity: 0.08,
          shadowOffset: { width: 0, height: 6 },
          shadowRadius: 12,
          elevation: 6,
        },
      }}
    >
      {[
        { name: "home", icon: "home-outline", title: "Home" },
        { name: "portfolio", icon: "diamond-outline", title: "Portfolio" },
        { name: "property", icon: "business-outline", title: "Property" },
        { name: "wallet", icon: "wallet-outline", title: "Wallet" },
        { name: "profile", icon: "person-outline", title: "Profile" },
      ].map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name={
                  focused
                    ? (tab.icon.replace("-outline", "") as any)
                    : (tab.icon as any)
                }
                size={24}
                color={color}
              />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}