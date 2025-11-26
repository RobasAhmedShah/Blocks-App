import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/lib/useColorScheme';
import { useCopilot } from 'react-native-copilot';
import { useTour } from '@/contexts/TourContext';
import { getStepDetails, getTotalSteps } from '@/utils/tourHelpers';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface TooltipProps {
  isFirstStep?: boolean;
  isLastStep?: boolean;
  handleNext?: () => void;
  handlePrev?: () => void;
  handleStop?: () => void;
  currentStep?: {
    order?: number;
    name?: string;
    text?: string;
    title?: string;
    totalSteps?: number;
  };
  step?: any;
  stop?: () => void;
  handleSkip?: () => void;
}

// Step order mapping - maps step name to order number
const STEP_ORDER_MAP: Record<string, number> = {
  'portfolio_balance': 1,
  'stats_section': 2,
  'property_card': 3,
  'guidance_card': 4,
  'wallet_button': 3,
  'notifications': 4,
  'property_images': 1,
  'token_info': 2,
  'calculator': 3,
  'documents': 4,
  'invest_button': 5,
  'drag_handle': 1,
  'token_input': 2,
  'price_input': 3,
  'slider': 4,
  'transaction_fee': 5,
  'confirm_button': 6,
  'balance': 1,
  'deposit': 2,
  'withdraw': 3,
  'transactions': 4,
  'filter_tabs': 5,
  'profile_picture': 1,
  'bookmarks': 2,
  'security': 3,
  'theme': 4,
  'biometric': 5,
};

// Screen-specific total steps mapping
const SCREEN_TOTAL_STEPS: Record<string, number> = {
  'portfolio_balance': 4,
  'stats_section': 4,
  'property_card': 4,
  'guidance_card': 4,
  'wallet_button': 4,
  'notifications': 4,
  'property_images': 5,
  'token_info': 5,
  'calculator': 5,
  'documents': 5,
  'invest_button': 5,
  'drag_handle': 6,
  'token_input': 6,
  'price_input': 6,
  'slider': 6,
  'transaction_fee': 6,
  'confirm_button': 6,
  'balance': 5,
  'deposit': 5,
  'withdraw': 5,
  'transactions': 5,
  'filter_tabs': 5,
  'profile_picture': 5,
  'bookmarks': 5,
  'security': 5,
  'theme': 5,
  'biometric': 5,
};

export const CustomTooltip: React.FC<TooltipProps> = (props) => {
  const {
    isFirstStep,
    isLastStep,
    handleNext,
    handlePrev,
    handleStop,
    currentStep,
    step,
    stop,
    handleSkip,
  } = props || {};
  
  // CRITICAL: Log immediately when component is called
  console.log('[CustomTooltip] 🔵🔵🔵 COMPONENT RENDERED 🔵🔵🔵');
  console.log('[CustomTooltip] All props received:', {
    hasProps: !!props,
    propsKeys: props ? Object.keys(props) : [],
    hasCurrentStep: !!currentStep,
    hasStep: !!step,
    currentStepName: currentStep?.name,
    stepName: step?.name,
    hasHandleNext: !!handleNext,
    hasHandlePrev: !!handlePrev,
    isFirstStep,
    isLastStep,
  });
  
  const { colors, isDarkColorScheme } = useColorScheme();
  const copilot = useCopilot();
  const { goToNext: copilotGoToNext, goToPrev: copilotGoToPrev, stop: copilotStop } = copilot || {};
  const { currentStepName: trackedStepName, currentStepOrder: trackedStepOrder } = useTour();
  
  // Get the navigation handlers - react-native-copilot provides these via hook
  // Priority: props > hook functions
  const nextHandler = handleNext || copilotGoToNext || (() => {
    console.warn('[CustomTooltip] No next handler available', { handleNext, copilotGoToNext });
  });
  
  const prevHandler = handlePrev || copilotGoToPrev || (() => {
    console.warn('[CustomTooltip] No prev handler available', { handlePrev, copilotGoToPrev });
  });
  
  // Get the stop handler - react-native-copilot might pass it with different names
  // Priority: handleStop > stop > handleSkip > copilotStop from hook
  const stopHandler = handleStop || stop || handleSkip || copilotStop || (() => {
    console.warn('[CustomTooltip] No stop handler available');
  });
  
  // Get step data - react-native-copilot passes step in currentStep
  const stepData = currentStep || step;
  
  // CRITICAL FIX: Use tracked step name from context (updated by stepChange event)
  // currentStep.name is often empty, but stepChange event has the correct name
  // Priority: trackedStepName (from context) > stepData.name > fallback
  const stepName = trackedStepName || stepData?.name || '';
  
  // Get step details from helpers
  // IMPORTANT: Use stepData.text FIRST if available (from CopilotStep), then fallback to helpers
  const stepDetails = stepName ? getStepDetails(stepName) : null;
  const stepTitle = stepDetails?.title;
  // Priority: stepData.text (from CopilotStep) > stepDetails.text > currentStep.text
  const stepText = stepData?.text || stepDetails?.text || currentStep?.text || '';
  const stepNumber = trackedStepOrder > 0 ? trackedStepOrder : (stepDetails?.order || stepData?.order || currentStep?.order || 1);
  const totalSteps = getTotalSteps('HOME'); // Always 4 for home screen
  
  console.log('[CustomTooltip] Step data resolved:', {
    stepName: stepName || 'MISSING',
    stepText: stepText ? stepText.substring(0, 30) + '...' : 'MISSING',
    stepNumber,
    totalSteps,
    hasStepDataText: !!stepData?.text,
    hasStepDetails: !!stepDetails,
    hasCurrentStepText: !!currentStep?.text,
  });
  
  // Calculate isFirstStep and isLastStep if not provided
  const calculatedIsFirstStep = isFirstStep !== undefined ? isFirstStep : stepNumber === 1;
  const calculatedIsLastStep = isLastStep !== undefined ? isLastStep : stepNumber === totalSteps;
  
  // Debug: Log step information
  React.useEffect(() => {
    console.log('[CustomTooltip] Step Info:', {
      stepName,
      stepNumber,
      totalSteps,
      calculatedIsFirstStep,
      calculatedIsLastStep,
      stepTitle,
      stepTextLength: stepText.length,
      stepDetails: !!stepDetails,
      trackedStepName,
      trackedStepOrder,
      hasCurrentStep: !!currentStep,
      hasStepData: !!stepData,
      hasText: !!stepText,
    });
    
    // Log if tooltip should be visible
    if (stepName && stepText) {
      console.log('[CustomTooltip] ✅ Tooltip should be visible for step:', stepName);
    } else {
      console.warn('[CustomTooltip] ⚠️ Tooltip missing data:', {
        stepName: stepName || 'MISSING',
        stepText: stepText || 'MISSING',
      });
    }
  }, [stepName, stepNumber, totalSteps, calculatedIsFirstStep, calculatedIsLastStep, stepTitle, stepText, stepDetails, trackedStepName, trackedStepOrder, currentStep, stepData]);

  // CRITICAL: Don't return null - always render something to help debug
  // If no data, render a debug tooltip
  const hasAnyText = stepText || currentStep?.text || stepData?.text || step?.text;
  if (!hasAnyText) {
    console.warn('[CustomTooltip] ⚠️ No step data available - rendering debug tooltip');
    return (
      <View style={[styles.container, { backgroundColor: '#FF0000', zIndex: 99999, elevation: 20, position: 'absolute', top: 100, left: 20 }]}>
        <Text style={{ color: '#FFFFFF', fontWeight: 'bold', fontSize: 16 }}>
          🔴 DEBUG: Tooltip Rendered
        </Text>
        <Text style={{ color: '#FFFFFF', fontSize: 12, marginTop: 8 }}>
          Props: {props ? JSON.stringify(Object.keys(props)) : 'NO PROPS'}
        </Text>
        <Text style={{ color: '#FFFFFF', fontSize: 10, marginTop: 4 }}>
          currentStep: {currentStep ? 'YES' : 'NO'}
        </Text>
        <Text style={{ color: '#FFFFFF', fontSize: 10 }}>
          step: {step ? 'YES' : 'NO'}
        </Text>
      </View>
    );
  }
  
  console.log('[CustomTooltip] ✅ Rendering tooltip for step:', stepName || 'UNNAMED', 'with text:', stepText?.substring(0, 50) || currentStep?.text?.substring(0, 50));
  
  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          shadowColor: isDarkColorScheme ? '#000' : '#000',
          zIndex: 9999, // Ensure tooltip is on top
          elevation: 10, // Android elevation
        },
      ]}
    >
      {/* Step Badge and Progress */}
      <View style={styles.header}>
        <View
          style={[
            styles.badge,
            {
              backgroundColor: colors.primary,
            },
          ]}
        >
          <Text style={styles.badgeText}>{stepNumber}</Text>
        </View>
        <Text style={[styles.progressText, { color: colors.textMuted }]}>
          Step {stepNumber} of {totalSteps}
        </Text>
      </View>

      {/* Title */}
      {stepTitle && stepTitle.trim() && (
        <Text style={[styles.title, { color: colors.textPrimary }]}>
          {stepTitle}
        </Text>
      )}

      {/* Description - Always show */}
      {stepText && stepText.trim() ? (
        <Text 
          style={[
            styles.description, 
            { 
              color: colors.textSecondary,
              minHeight: 40, // Ensure minimum height for visibility
            }
          ]}
        >
          {stepText}
        </Text>
      ) : (
        <Text style={[styles.description, { color: colors.textSecondary, fontStyle: 'italic' }]}>
          Tap to explore this feature
        </Text>
      )}

      {/* Progress Bar */}
      <View style={styles.progressBarContainer}>
        {Array.from({ length: totalSteps }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.progressDot,
              {
                backgroundColor:
                  i < stepNumber ? colors.primary : colors.border,
              },
            ]}
          />
        ))}
      </View>

      {/* Button Row */}
      <View style={styles.buttonRow}>
        {!calculatedIsFirstStep && (
          <TouchableOpacity
            onPress={() => {
              console.log('[CustomTooltip] Back button pressed', { prevHandler: typeof prevHandler });
              if (prevHandler && typeof prevHandler === 'function') {
                try {
                  prevHandler();
                } catch (error) {
                  console.error('[CustomTooltip] Error calling prevHandler:', error);
                }
              } else {
                console.warn('[CustomTooltip] prevHandler is not a function');
              }
            }}
            style={[
              styles.button,
              styles.backButton,
              {
                backgroundColor: colors.muted,
                borderColor: colors.border,
              },
            ]}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={18} color={colors.textPrimary} />
            <Text style={[styles.buttonText, { color: colors.textPrimary }]}>
              Back
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          onPress={() => {
            // Call the stop handler if available
            if (stopHandler) {
              stopHandler();
            }
          }}
          style={[
            styles.button,
            styles.skipButton,
            {
              backgroundColor: 'transparent',
              borderColor: colors.border,
            },
            !calculatedIsFirstStep && { flex: 1 },
          ]}
        >
          <Text style={[styles.buttonText, { color: colors.textSecondary }]}>
            Skip
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            console.log('[CustomTooltip] Next/Finish button pressed', { 
              calculatedIsLastStep,
              stepNumber,
              totalSteps,
              stepName,
              trackedStepName,
              trackedStepOrder,
              nextHandler: typeof nextHandler,
              stopHandler: typeof stopHandler 
            });
            if (calculatedIsLastStep) {
              // On last step, stop the tour
              if (stopHandler && typeof stopHandler === 'function') {
                try {
                  stopHandler();
                } catch (error) {
                  console.error('[CustomTooltip] Error calling stopHandler:', error);
                }
              } else {
                console.warn('[CustomTooltip] stopHandler is not a function');
              }
            } else {
              // Go to next step - call directly, no setTimeout needed
              if (nextHandler && typeof nextHandler === 'function') {
                try {
                  nextHandler();
                } catch (error) {
                  console.error('[CustomTooltip] Error calling nextHandler:', error);
                }
              } else {
                console.warn('[CustomTooltip] nextHandler is not a function');
              }
            }
          }}
          style={[
            styles.button,
            styles.nextButton,
            {
              backgroundColor: colors.primary,
            },
            !calculatedIsFirstStep && { flex: 1.5 },
          ]}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.buttonText,
              { color: colors.primaryForeground, fontWeight: '700' },
            ]}
          >
            {calculatedIsLastStep ? 'Finish' : 'Next'}
          </Text>
          {!calculatedIsLastStep && (
            <Ionicons
              name="chevron-forward"
              size={18}
              color={colors.primaryForeground}
            />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    maxWidth: Math.min(320, SCREEN_WIDTH * 0.85),
    minWidth: Math.max(280, SCREEN_WIDTH * 0.75),
    borderRadius: 16,
    padding: 20,
    paddingBottom: 16, // Reduced bottom padding for better height
    borderWidth: 1,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    // Responsive width
    width: Math.min(320, SCREEN_WIDTH * 0.85),
    // Adjust height - make it more compact
    minHeight: 180, // Minimum height to ensure content fits
    maxHeight: 280, // Maximum height to prevent it from being too tall
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10, // Reduced for better height
    gap: 10,
  },
  badge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  progressText: {
    fontSize: 12,
    fontWeight: '500',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6, // Reduced for better height
    lineHeight: 22, // Slightly reduced
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16, // Reduced for better height
  },
  progressBarContainer: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 12, // Reduced margin for better height
  },
  progressDot: {
    flex: 1,
    height: 3,
    borderRadius: 2,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10, // Reduced for better height
    paddingHorizontal: 16,
    borderRadius: 10,
    gap: 6,
  },
  backButton: {
    borderWidth: 1,
    flex: 1,
  },
  skipButton: {
    borderWidth: 1,
    flex: 0.8,
  },
  nextButton: {
    flex: 1.5,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});

// Also export as default for compatibility with react-native-copilot
export default CustomTooltip;

