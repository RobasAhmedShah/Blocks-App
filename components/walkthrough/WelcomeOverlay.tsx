import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/lib/useColorScheme';
import type { IOverlayComponentProps } from '@/react-native-interactive-walkthrough/src/index';

export const WelcomeOverlay: React.FC<IOverlayComponentProps> = ({ next, stop }) => {
  const { colors, isDarkColorScheme } = useColorScheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <View style={[styles.iconContainer]}>
          <Ionicons name="rocket" size={64} color={colors.primary} />
        </View>
        
        <Text style={[styles.title, { color: colors.textPrimary }]}>
          Welcome to Blocks!
        </Text>
        
        <Text style={[styles.description, { color: colors.textSecondary }]}>
          Let's take a quick tour to help you get started with investing in tokenized real estate.
        </Text>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            onPress={stop}
            style={[styles.skipButton, { borderColor: colors.border }]}
          >
            <Text style={[styles.skipButtonText, { color: colors.textSecondary }]}>
              Skip Tour
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={next}
            style={[styles.nextButton, { backgroundColor: colors.primary }]}
          >
            <Text style={[styles.nextButtonText, { color: colors.primaryForeground }]}>
              Get Started
            </Text>
            <Ionicons name="arrow-forward" size={20} color={colors.primaryForeground} />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  content: {
    alignItems: 'center',
    maxWidth: 400,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  skipButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  nextButton: {
    flex: 1.5,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
});

