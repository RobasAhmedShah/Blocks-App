import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/lib/useColorScheme';
import type { IOverlayComponentProps } from '@/react-native-interactive-walkthrough/src/index';

interface TooltipOverlayProps extends IOverlayComponentProps {
  title: string;
  description: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  showPrevious?: boolean;
  isFirstStep?: boolean;
  isLastStep?: boolean;
  onFinish?: () => void | Promise<void>;
}

export const TooltipOverlay: React.FC<TooltipOverlayProps> = ({
  title,
  description,
  next,
  previous,
  stop,
  step,
  position = 'bottom',
  showPrevious = true,
  isFirstStep = false,
  isLastStep = false,
  onFinish,
}) => {
  const { colors, isDarkColorScheme } = useColorScheme();
  const mask = step?.mask || { x: 0, y: 0, width: 0, height: 0 };

  // Calculate position relative to the mask
  const getPositionStyle = () => {
    const padding = 16;
    const tooltipWidth = 300;
    const screenWidth = Dimensions.get('window').width;
    const screenHeight = Dimensions.get('window').height;
    
    // Ensure mask coordinates are valid
    const maskX = mask.x || 0;
    const maskY = mask.y || 0;
    const maskWidth = mask.width || 0;
    const maskHeight = mask.height || 0;
    
    // Calculate center position
    const centerX = maskX + maskWidth / 2;
    const leftPosition = Math.max(16, Math.min(centerX - tooltipWidth / 2, screenWidth - tooltipWidth - 16));
    
    switch (position) {
      case 'top':
        // Position above the mask
        const topY = maskY - padding;
        return {
          position: 'absolute' as const,
          top: Math.max(16, topY - 200), // 200 is approximate tooltip height
          left: leftPosition,
          maxWidth: tooltipWidth,
        };
      case 'bottom':
        // Position below the mask
        const bottomY = maskY + maskHeight + padding;
        return {
          position: 'absolute' as const,
          top: Math.min(bottomY, screenHeight - 250), // Ensure it's visible
          left: leftPosition,
          maxWidth: tooltipWidth,
        };
      case 'left':
        return {
          position: 'absolute' as const,
          top: Math.max(16, Math.min(maskY + maskHeight / 2 - 100, screenHeight - 250)),
          right: Math.max(16, screenWidth - maskX + padding),
          maxWidth: tooltipWidth,
        };
      case 'right':
        return {
          position: 'absolute' as const,
          top: Math.max(16, Math.min(maskY + maskHeight / 2 - 100, screenHeight - 250)),
          left: Math.min(maskX + maskWidth + padding, screenWidth - tooltipWidth - 16),
          maxWidth: tooltipWidth,
        };
      default:
        // Default to bottom
        const defaultY = maskY + maskHeight + padding;
        return {
          position: 'absolute' as const,
          top: Math.min(defaultY, screenHeight - 250),
          left: leftPosition,
          maxWidth: tooltipWidth,
        };
    }
  };

  return (
    <View style={[styles.container, getPositionStyle()]}>
      <View
        style={[
          styles.tooltip,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
            shadowColor: isDarkColorScheme ? '#000' : '#000',
          },
        ]}
      >
        <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>
        <Text style={[styles.description, { color: colors.textSecondary }]}>
          {description}
        </Text>

        <View style={styles.buttonRow}>
          {showPrevious && !isFirstStep && (
            <TouchableOpacity
              onPress={previous}
              style={[styles.backButton, { borderColor: colors.border }]}
            >
              <Ionicons name="chevron-back" size={18} color={colors.textPrimary} />
              <Text style={[styles.buttonText, { color: colors.textPrimary }]}>Back</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            onPress={stop}
            style={[styles.skipButton, { borderColor: colors.border }]}
          >
            <Text style={[styles.buttonText, { color: colors.textSecondary }]}>Skip</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={async () => {
              if (isLastStep && onFinish) {
                await onFinish();
              }
              // Call next to move to the next step
              if (next) {
                next();
              }
            }}
            style={[styles.nextButton, { backgroundColor: colors.primary }]}
            activeOpacity={0.7}
          >
            <Text style={[styles.buttonText, { color: colors.primaryForeground, fontWeight: '700' }]}>
              {isLastStep ? 'Finish' : 'Next'}
            </Text>
            {!isLastStep && (
              <Ionicons name="chevron-forward" size={18} color={colors.primaryForeground} />
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 300,
    zIndex: 9999,
    elevation: 10,
  },
  tooltip: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
    lineHeight: 24,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    gap: 4,
    flex: 1,
  },
  skipButton: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 0.8,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    gap: 6,
    flex: 1.5,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});

