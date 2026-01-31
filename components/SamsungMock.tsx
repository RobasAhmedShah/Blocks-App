import React from 'react';
import { View, StyleSheet, Text, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

// Samsung-style phone mockup dimensions
const PHONE_WIDTH = width * 0.55;
const PHONE_HEIGHT = PHONE_WIDTH * 2.1;

export default function SamsungMockup({ children }) {
  return (
    <View style={styles.container}>

      {/* Outer Shadow */}
      <View style={styles.shadowWrapper}>

        {/* Phone Body */}
        <View style={styles.phoneBody}>

          {/* Screen */}
          <View style={styles.screen}>

            {/* Glass Reflection */}
            <View style={styles.glassOverlay} />

            {children ?? (
              <Text style={styles.placeholderText}>
                Your App UI
              </Text>
            )}

          </View>

        </View>

      </View>

    </View>
  );
}

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: '#0b0d1200',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 25,
  },

  shadowWrapper: {
    shadowColor: '#000',
    shadowOpacity: 0.6,
    shadowRadius: 25,
    shadowOffset: { width: 0, height: 15 },
    elevation: 25,
  },

  phoneBody: {
    width: PHONE_WIDTH,
    height: PHONE_HEIGHT,

    borderRadius: 16, // Samsung has slight rounded corners
    padding: 6,

    backgroundColor: '#141414',
    borderWidth: 2,
    borderColor: '#2b2b2b',
    overflow: 'hidden',
  },

  screen: {
    flex: 1,
    backgroundColor: '#000',
    borderRadius: 12, // Slightly smaller than body
    overflow: 'hidden',
    height: '100%',
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },

  glassOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.035)',
    borderRadius: 12,
    transform: [{ rotate: '-8deg' }],
    left: -30,
    top: -60,
    width: '130%',
    height: '55%',
  },

  placeholderText: {
    color: '#ffffffaa',
    fontSize: 18,
    fontWeight: '600',
  },

});
