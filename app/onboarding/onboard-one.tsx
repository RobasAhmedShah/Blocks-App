import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  StyleSheet,
  Pressable,
  ColorValue,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useColorScheme } from "@/lib/useColorScheme";
import { MotiView, AnimatePresence } from "moti";
import { LinearGradient } from "expo-linear-gradient";

/* =========================
   ONBOARDING DATA MODEL
========================= */

const slides = [
  {
    key: "home",
    gradient: ["#000000", "#0E1A00", "#305701"],
    sentences: [
      "Welcome to Blocks",
      "Your gateway to real estate investing",
      "Build wealth through fractional ownership",
    ],
  },
  {
    key: "portfolio",
    gradient: ["#020617", "#020617", "#1E293B"],
    sentences: [
      "Your portfolio lives here",
      "Track growth, returns, and performance",
      "All updated in real time",
    ],
  },
  {
    key: "properties",
    gradient: ["#020617", "#022C22", "#064E3B"],
    sentences: [
      "Explore premium properties",
      "Invest fractionally with confidence",
      "Starting from as low as $100",
    ],
  },
  {
    key: "marketplace",
    gradient: ["#020617", "#1E1B4B", "#312E81"],
    sentences: [
      "The marketplace gives you flexibility",
      "Buy and sell property tokens",
      "Anytime, at transparent prices",
    ],
  },
  {
    key: "wallet",
    gradient: ["#020617", "#052E16", "#14532D"],
    sentences: [
      "Your wallet connects everything",
      "Manage funds, earnings, and withdrawals",
      "Secure, simple, and always in control",
    ],
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const { colors } = useColorScheme();

  const [sectionIndex, setSectionIndex] = useState(0);
  const [sentenceIndex, setSentenceIndex] = useState(0);
  const BASE_HEIGHT = 120;
const LINE_HEIGHT = 44;

const dynamicHeight =
  BASE_HEIGHT + (sentenceIndex + 1) * LINE_HEIGHT;

  const currentSlide = slides[sectionIndex];

  const handleNext = () => {
    if (sentenceIndex < currentSlide.sentences.length - 1) {
      setSentenceIndex((s) => s + 1);
    } else if (sectionIndex < slides.length - 1) {
      setSectionIndex((s) => s + 1);
      setSentenceIndex(0);
    } else {
      router.replace("/onboarding/auth" as any);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* BACKGROUND GRADIENT PER SECTION */}
      <LinearGradient
        colors={currentSlide.gradient as [ColorValue, ColorValue, ...ColorValue[] ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* SKIP */}
      {sectionIndex < slides.length - 1 && (
        <TouchableOpacity
          style={styles.skip}
          onPress={() => router.replace("/onboarding/auth" as any)}
        >
          <Text style={{ color: "#d0e8d0", fontWeight: "600" }}>Skip</Text>
        </TouchableOpacity>
      )}

      {/* CONTENT */}
      <View style={styles.content}>
        {/* <View style={styles.textContainer}> */}
        <MotiView
          animate={{ height: dynamicHeight }}
          transition={{ type: "timing", duration: 300, delay: sentenceIndex === 0 ? 2000 : 0}}
          style={styles.textContainer}
        >
          <AnimatePresence>
            {currentSlide.sentences
              .slice(0, sentenceIndex + 1)
              .map((sentence, i) => {
                const isActive = i === sentenceIndex;

                return (
                  <View key={`${sectionIndex}-${i}`} style={{ flexDirection: "row", flexWrap: "wrap", }}>
                  {sentence.split(" ").map((word, wordIndex) => (
                    <MotiView
                      key={`${wordIndex}-${i}`}
                      from={{ opacity: 0, translateY: 20 }}
                      animate={{
                        opacity: isActive ? 1 : 0.5,
                        translateY: 0,
                      }}
                      exit={{ opacity: 0, translateY: -20 }}
                      transition={{ 
                        type: "timing",
                        duration: 300,
                        delay: (i===0 && isActive && sectionIndex!==0) ? wordIndex * 100 + i * 500 + 2000 : wordIndex * 100 + i * 500
                      }}
                      style={{ marginBottom: 6 }}
                    >
                      
                      <Text
                        style={[
                          styles.text,
                          isActive && styles.activeText,
                        ]}
                      >
                        {' ' + word}
                      </Text>
                    </MotiView>
                  ))}
                  </View>
                );
              })}
          </AnimatePresence>
          </MotiView>

        {/* BUTTON */}
        <Pressable
          style={[styles.button, { backgroundColor: "rgba(0,0,0,0.8)" }]}
          onPress={handleNext}
        >
          <Text style={styles.buttonText}>
            {sectionIndex === slides.length - 1 &&
            sentenceIndex === currentSlide.sentences.length - 1
              ? "Get Started"
              : "Next"}
          </Text>
          <Ionicons
            name="arrow-forward"
            size={18}
            color="#d0e8d0"
            style={{ marginLeft: 6 }}
          />
        </Pressable>
      </View>
    </View>
  );
}

/* =========================
   STYLES
========================= */

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
    paddingBottom: 60,
  },
  textContainer: {
    // minHeight: 150,
    // marginBottom: 40,
  },
  text: {
    color: "#94a3b8",
    fontSize: 22,
    fontWeight: "600",
  },
  activeText: {
    color: "#d0e8d0",
    
  },
  button: {
    marginTop:-50,
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
});
