import LottieView from "lottie-react-native";
import React  from "react";
import { View, StyleSheet, Dimensions } from "react-native";

export default function ArcLoader({ size = 48, color = "#22C55E" }) {

const demensions = Dimensions.get("window");
const width = demensions.width;
const height = demensions.height;
  

  return (
    <View
    className="flex-1"
     style={[styles.container, { width: width, height: height }]}>
       <View style={{ justifyContent: 'center', backgroundColor: 'transparent',
         alignItems: 'center',position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,zIndex: 1000 }}>
            <View style={{ alignItems: 'center'}}>
          {/* <Ionicons name="checkmark" size={32} color={colors.primaryForeground} /> */}
          <LottieView
            source={require("@/assets/Comp2.json")}
            autoPlay 
            loop={true}
            style={{ width: 420, height: 420 }}
          />
        </View>
        </View>

      {/* <Animated.View
        style={[
          styles.arc,
          {
            width: size,
            height: size,
            borderColor: color,
            transform: [{ rotate: rotation }],
          },
        ]}
      /> */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    alignItems: "center",
  },
 
});
