import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  StyleSheet,
  Pressable,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useColorScheme } from "@/lib/useColorScheme";
import { MotiView } from "moti";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Defs, RadialGradient, Rect, Stop } from "react-native-svg";


const slides = [
  {
    lines: [
      { text: "But every person has their own", opacity: 1 },
      { text: "unique ⚡ energy rhythm", opacity: 1 }
    ],
  },
  {
    lines: [
      { text: "But every person has their own", opacity: 0.8 },
      { text: "unique ⚡ energy rhythm", opacity: 0.8 },
      { text: "and it's not random it's a", opacity: 1, italic: true },
      { text: "predictable biology", opacity: 1 }
    ],
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const { colors, isDarkColorScheme } = useColorScheme();
  const [step, setStep] = useState(0);

  const handleNext = () => {
    if (step < slides.length - 1) {
      setStep((s) => s + 1);
    } else {
      router.replace("/(tabs)" as any);
    }
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: isDarkColorScheme ? "rgb(0, 0, 0)" : colors.background },
      ]}
    >

      {/* Dark Olive/Green Gradient Background */}
      <LinearGradient
        colors={['rgba(0, 0, 0, 0.7)','rgba(14, 26, 0, 0.7)','rgba(48, 87, 1, 0.7)', 'rgba(78, 126, 2, 0.7)', 'rgba(108, 167, 1, 0.7)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={{
          position: 'absolute',
          top: 400,
          left: 0,
          right: 0,
          bottom: 0,
        }}
      />

        {/* Radial Gradient Overlay */}
      {/* <View style={{ position: 'absolute', top: 500, left: 0, right: 0,
         bottom: 0, zIndex: 10}}>
        <Svg width="100%" height="50%" >
          <Defs>
            <RadialGradient id="backgroundRadial" cx="50%" cy="50%" r="90%">
              <Stop offset="50%" stopColor="rgb(226, 34, 34)" stopOpacity="1" />
              <Stop offset="100%" stopColor="rgb(226, 34, 34)" stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Rect width="100%" height="100%" fill="url(#backgroundRadial)" />
        </Svg>
      </View> */}

      <StatusBar
        barStyle={isDarkColorScheme ? "light-content" : "dark-content"}
      />

      {/* Skip */}
      {step < slides.length - 1 && (
        <TouchableOpacity
          style={styles.skip}
          onPress={() => router.replace("/(tabs)" as any)}
        >
          <Text style={{ color: colors.textPrimary, fontWeight: "600" }}>
            Skip
          </Text>
        </TouchableOpacity>
      )}

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.textContainer}>
          {slides[step].lines.map((line, index) => (
            <View style={{ display: "flex",flexDirection:"row" }}>
            {line.text.split(" ").map((word, wordIndex) => (
            <MotiView
              key={`${step}-${index}`}
              from={{ opacity: 0, translateY: 12 }}
              animate={{ opacity: line.opacity, translateY: 0 }}
              transition={{
                type: "timing",
                duration: 200,
                delay: (wordIndex * 120)+ index * 500,
              }}
            >
              <Text
                style={[
                  styles.text,
                  line.italic && styles.italic,
                  { opacity: line.opacity },
                ]}
              >
                {`${ word} `}
              </Text>
            </MotiView>))}
            </View>
          ))}
        </View>

        <MotiView
          from={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 500 }}
        >
          <Pressable style={[styles.button,{backgroundColor:"rgba(0,0,0,0.8)"}]} onPress={handleNext}>
            <Text style={styles.buttonText}>
              {step === slides.length - 1 ? "Get Started" : "Next"}
            </Text>
            <Ionicons
              name="arrow-forward"
              size={18}
              color="#d0e8d0"
              style={{ marginLeft: 6 }}
            />
          </Pressable>
        </MotiView>
      </View>

      {/* Pagination Dots */}
      {/* <View style={styles.dots}>
        {slides.map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              {
                width: i === step ? 24 : 8,
                opacity: i === step ? 1 : 0.3,
                backgroundColor: colors.primary,
              },
            ]}
          />
        ))}
      </View> */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  skip: {
    position: "absolute",
    top: 60,
    right: 20,
    zIndex: 10,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  content: {
    flex: 1,
    justifyContent: "flex-end",
    paddingHorizontal: 24,
    paddingBottom: 30,
  },
  textContainer: {
    marginBottom: 40,
  },
  text: {
    color: "#a8b5a8",
    fontSize: 24,
    fontWeight: "600",
    marginBottom: 6,
  },
  italic: {
    fontStyle: "italic",
  },
  button: {
    paddingVertical: 18,
    borderRadius: 30,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
  },
  buttonText: {
    color: "#d0e8d0",
    fontSize: 18,
    fontWeight: "600",
  },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 32,
    gap: 8,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
});
