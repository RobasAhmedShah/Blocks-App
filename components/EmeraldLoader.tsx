import LottieView from "lottie-react-native";
import React  from "react";
import { View, StyleSheet } from "react-native";

export default function ArcLoader({ size = 48, color = "#22C55E" }) {


  

  return (
    <View style={[styles.container, { width: size, height: size }]}>
       <View style={{ justifyContent: 'center', backgroundColor: 'transparent',
         alignItems: 'center',position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,zIndex: 1000 }}>
            <View style={{ alignItems: 'center'}}>
          {/* <Ionicons name="checkmark" size={32} color={colors.primaryForeground} /> */}
          <LottieView
            source={require("@/assets/Comp1.json")}
            autoPlay 
           
            style={{ width: 220, height: 220,marginBottom: -20 }}
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
