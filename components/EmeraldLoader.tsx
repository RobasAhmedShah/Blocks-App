import React, { useEffect, useRef } from "react";
import { Animated, View, StyleSheet, Easing } from "react-native";

export default function ArcLoader({ size = 48, color = "#22C55E" }) {
  const rotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(rotate, {
        toValue: 1,
        duration: 1100,            // slower + smoother
        easing: Easing.inOut(Easing.linear),
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const rotation = rotate.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Animated.View
        style={[
          styles.arc,
          {
            width: size,
            height: size,
            borderColor: color,
            transform: [{ rotate: rotation }],
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    alignItems: "center",
  },
  arc: {
    borderWidth: 4,
    borderRadius: 999,
    borderTopColor: "transparent",
    borderLeftColor: "transparent",

    // Rounder, smoother ends
    borderRightColor: "transparent",
    borderBottomColor: "rgba(34,197,94,0.9)",

    // Gives that super-soft premium look
    shadowColor: "rgba(34,197,94,0.5)",
    shadowRadius: 8,
    shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: 0 },
  },
});
