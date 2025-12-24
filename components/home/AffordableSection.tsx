import React from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useColorScheme } from '@/lib/useColorScheme';

const CARD_WIDTH = 220;
const CARD_HEIGHT = 220;

export default function AffordableSection({ affordable }: { affordable: any[] }) {
  const router = useRouter();
  const { colors, isDarkColorScheme } = useColorScheme();

  return (
    <View style={{ paddingTop: 40, backgroundColor: 'transparent' }}>
      <Text
        style={{
          color: colors.textPrimary,
          fontSize: 20,
          fontWeight: 'bold',
          paddingHorizontal: 16,
          paddingBottom: 16,
        }}>
        Affordable Investments
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ paddingLeft: 16 }}>
        {affordable.map((item, idx) => (
          <TouchableOpacity
            key={item.id || idx}
            onPress={() => item.id && router.push(`/property/${item.id}`)}
            activeOpacity={0.9}
            style={[
              styles.card,
              {
                width: CARD_WIDTH,
                height: CARD_HEIGHT,
                backgroundColor: isDarkColorScheme ? colors.card : '#FFFFFF',
              },
            ]}>
            {/* Image Background */}
            <View style={styles.imageContainer}>
              {item.image ? (
                <Image
                  source={{ uri: item.image }}
                  style={styles.image}
                  resizeMode="cover"
                />
              ) : (
                <View
                  style={[
                    styles.image,
                    {
                      backgroundColor: isDarkColorScheme
                        ? 'rgba(34, 197, 94, 0.15)'
                        : 'rgba(34, 197, 94, 0.1)',
                      justifyContent: 'center',
                      alignItems: 'center',
                    },
                  ]}>
                  <Ionicons name="home" size={48} color={colors.primary} />
                </View>
              )}

              {/* Top-Right Icon Button */}
              <TouchableOpacity
                onPress={() => item.id && router.push(`/property/${item.id}`)}
                activeOpacity={0.8}
                style={styles.iconButton}>
                <Ionicons name="arrow-forward" size={18} color={colors.primary} />
              </TouchableOpacity>

              {/* Gradient Overlay for Text Readability */}
              <LinearGradient
                colors={['transparent', 'rgba(0, 0, 0, 0.7)', 'rgba(0, 0, 0, 0.85)']}
                locations={[0.5, 0.85, 1]}
                style={styles.gradientOverlay}
              />

              {/* Text Overlay - Bottom Left */}
              <View style={styles.textOverlay}>
                <Text
                  style={styles.title}
                  numberOfLines={2}>
                  {item.name}
                </Text>
                <Text style={styles.price}>
                  {item.entry}
                </Text>
                <Text style={styles.subtext} numberOfLines={1}>
                  {item.roi} ROI
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    overflow: 'hidden',
    marginRight: 16,
  },
  imageContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  iconButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  gradientOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '45%',
  },
  textOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingBottom: 20,
    zIndex: 5,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
    lineHeight: 24,
  },
  price: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    opacity: 0.95,
  },
  subtext: {
    color: '#FFFFFF',
    fontSize: 12,
    opacity: 0.8,
    marginTop: 2,
  },
});
