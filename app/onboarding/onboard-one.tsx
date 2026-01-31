import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  StyleSheet,
  Pressable,
  ColorValue,
  Image,
  Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useColorScheme } from "@/lib/useColorScheme";
import { MotiView, AnimatePresence } from "moti";
import { LinearGradient } from "expo-linear-gradient";
import { useEventListener } from "expo";
import { VideoView, useVideoPlayer } from "expo-video";
import SamsungMockup from "@/components/SamsungMock";

/* =========================
   ONBOARDING DATA MODEL
========================= */

const VIDEO_FALLBACK = require("@/assets/Deposit_2.mp4");

const slides = [
  {
    key: "home",
    gradient: ["#000000", "#0E1A00", "#305701"],
    sentences: [
      { text: "Welcome to Blocks", media: { type: "image" as const, source: require("@/assets/Welcome_Blocks.png") } },
      { text: "Your gateway to real estate investing", media: { type: "video" as const, source: require("@/assets/Guidance_2.mp4") } },
      { text: "Build wealth through fractional ownership", media: { type: "video" as const, source: require("@/assets/Guidance_3.mp4") } },
    ],
  },
  {
    key: "portfolio",
    gradient: ["#020617", "#020617", "#1E293B"],
    sentences: [
      { text: "Your portfolio lives here", media: { type: "image" as const, source: require("@/assets/Portfolio_1.png") } },
      { text: "Track growth, returns, and performance", media: { type: "video" as const, source: require("@/assets/Portfolio_2.mp4") } },
      { text: "All updated in real time", media: { type: "video" as const, source: require("@/assets/Portfolio_3.mp4") } },
    ],
  },
  {
    key: "properties",
    gradient: ["#020617", "#022C22", "#064E3B"],
    sentences: [
      { text: "Explore premium properties", media: { type: "image" as const, source: require("@/assets/Properties_1.png") } },
      { text: "Invest fractionally with confidence", media: { type: "video" as const, source: require("@/assets/Properties_2.mp4") } },
      { text: "Starting from as low as $100", media: { type: "video" as const, source: require("@/assets/Properties_3.mp4") } },
    ],
  },
  {
    key: "marketplace",
    gradient: ["#020617", "#1E1B4B", "#312E81"],
    sentences: [
      { text: "The marketplace gives you flexibility", media: { type: "image" as const, source: require("@/assets/Marketplace.png") } },
      { text: "Buy and sell property tokens", media: { type: "video" as const, source: require("@/assets/Marketplace_Buy.mp4") } },
      { text: "Anytime, at transparent prices", media: { type: "video" as const, source: require("@/assets/Marketplace_Sell.mp4") } },
    ],
  },
  {
    key: "wallet",
    gradient: ["#020617", "#052E16", "#14532D"],
    sentences: [
      { text: "Your wallet connects everything", media: { type: "image" as const, source: require("@/assets/Deposit_1.png") } },
      { text: "Manage funds, earnings, and withdrawals", media: { type: "video" as const, source: require("@/assets/Deposit_2.mp4") } },
      { text: "Secure, simple, and always in control", media: { type: "video" as const, source: require("@/assets/Deposit_3.mp4") } },
    ],
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const { colors } = useColorScheme();
  const { width, height } = Dimensions.get("window");

  const [sectionIndex, setSectionIndex] = useState(0);
  const [sentenceIndex, setSentenceIndex] = useState(0);
  const BASE_HEIGHT = 120;
  const LINE_HEIGHT = 44;

  const dynamicHeight =
    BASE_HEIGHT + (sentenceIndex + 1) * LINE_HEIGHT;

  const currentSlide = slides[sectionIndex];
  const currentStep = currentSlide.sentences[sentenceIndex];
  const isVideoStep = currentStep.media.type === "video";
  const videoSource = isVideoStep ? currentStep.media.source : VIDEO_FALLBACK;

  const videoPlayer = useVideoPlayer(VIDEO_FALLBACK, (player) => {
    player.loop = false;
    player.muted = true;
    player.playbackRate = 1.5;
  });

  // When slide or sentence changes, load and play the correct video for this step
  useEffect(() => {
    if (isVideoStep) {
      videoPlayer.replaceAsync(videoSource).then(() => {
        videoPlayer.play();
      });
    } else {
      videoPlayer.pause();
    }
  }, [sectionIndex, sentenceIndex]);

  useEventListener(videoPlayer, "playingChange", ({ isPlaying }) => {
    if (!isPlaying && videoPlayer.duration > 0 && videoPlayer.currentTime >= videoPlayer.duration - 0.5) {
      videoPlayer.currentTime = videoPlayer.duration;
      videoPlayer.pause();
    }
  });

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

  const handleBack = () => {
    if (sentenceIndex > 0) {
      setSentenceIndex((s) => s - 1);
    } else if (sectionIndex > 0) {
      setSectionIndex((s) => s - 1);
      setSentenceIndex(slides[sectionIndex - 1].sentences.length - 1);
    }
  };

  const canGoBack = sectionIndex > 0 || sentenceIndex > 0;

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

      {/* MEDIA: image or video per sentence step */}
      <View style={styles.animationContainer}>
        <SamsungMockup>
        {currentStep.media.type === "image" ? (
          <Image
            source={currentStep.media.source}
            style={[
              styles.animation,
              {
                width: width *0.515,
                height: height * 0.505,
              },
            ]}
            resizeMode="stretch"
          />
        ) : (
          <VideoView
            key={`video-${sectionIndex}-${sentenceIndex}`}
            player={videoPlayer}
            style={[
              styles.animation,
              {
                width: width *0.515,
                height: height * 0.505,
              },
            ]}
            contentFit="fill"
            nativeControls={false}
          />
        )}
        </SamsungMockup>
      </View>
      {/* </IphoneMockup> */}

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
          transition={{ type: "timing", duration: 300, delay: sentenceIndex === 0 ? 1000 : 0}}
          style={styles.textContainer}
        >
          <AnimatePresence>
            {currentSlide.sentences
              .slice(0, sentenceIndex + 1)
              .map((item, i) => {
                const isActive = i === sentenceIndex;

                return (
                  <View key={`${sectionIndex}-${i}`} style={{ flexDirection: "row", flexWrap: "wrap", }}>
                  {item.text.split(" ").map((word, wordIndex) => (
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
                        delay: (i===0 && isActive && sectionIndex!==0) ? wordIndex * 100 + i * 500 + 1000 : wordIndex * 100 
                        // delay: (i===0 && isActive && sectionIndex!==0) ? wordIndex * 100 + i * 500 + 2000 : wordIndex * 100 + i * 500
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

        {/* BUTTONS */}
        <View style={styles.buttonRow}>
          {canGoBack && (
            <Pressable
              style={[styles.button, styles.backButton]}
              onPress={handleBack}
            >
              <Ionicons
                name="arrow-back"
                size={18}
                color="#d0e8d0"
                style={{ marginRight: 6 }}
              />
              <Text style={styles.buttonText}>Back</Text>
            </Pressable>
          )}
          <Pressable
            style={[
              styles.button,
              { backgroundColor: "rgba(0,0,0,0.8)" },
              canGoBack && styles.nextButton,
            ]}
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
  animationContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    alignItems: "center",
    justifyContent: "flex-start",
    paddingTop: 80, // Space for status bar and skip button
    zIndex: 1,
  },
  animation: {
    opacity: 0.9,
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
  buttonRow: {
    marginTop: -50,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  button: {
    paddingVertical: 18,
    borderRadius: 30,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    flex: 1,
  },
  backButton: {
    backgroundColor: "rgba(255,255,255,0.12)",
    flex: 0.6,
  },
  nextButton: {
    flex: 1,
  },
  buttonText: {
    color: "#d0e8d0",
    fontSize: 18,
    fontWeight: "600",
  },
});
