import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode, RefObject, MutableRefObject } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Dimensions } from 'react-native';

interface TourContextType {
  isTourCompleted: (screenName: string) => Promise<boolean>;
  markTourCompleted: (screenName: string) => Promise<void>;
  resetTour: (screenName?: string) => Promise<void>;
  resetAllTours: () => Promise<void>;
  isFirstLaunch: () => Promise<boolean>;
  setFirstLaunch: (value: boolean) => Promise<void>;
  shouldStartTour: boolean;
  setShouldStartTour: (value: boolean) => void;
  currentStepName: string;
  setCurrentStepName: (name: string) => void;
  currentStepOrder: number;
  setCurrentStepOrder: (order: number) => void;
  updateCurrentStep: (stepName: string) => void;
  isTourActive: boolean;
  setIsTourActive: (active: boolean) => void;
  stepRefs: Map<string, RefObject<any>>;
  setStepRef: (stepName: string, ref: RefObject<any>) => void;
  scrollViewRef: MutableRefObject<any> | null;
  setScrollViewRef: (ref: MutableRefObject<any>) => void;
  scrollToStep: (stepName: string) => Promise<void>;
}

const TourContext = createContext<TourContextType | undefined>(undefined);

const TOUR_KEYS = {
  FIRST_LAUNCH: '@tour_first_launch',
  HOME: '@tour_completed_home',
  PROPERTY: '@tour_completed_property',
  INVEST: '@tour_completed_invest',
  WALLET: '@tour_completed_wallet',
  NOTIFICATIONS: '@tour_completed_notifications',
  PROFILE: '@tour_completed_profile',
};

export const TourProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [shouldStartTour, setShouldStartTourState] = useState(false);
  const [currentStepName, setCurrentStepName] = useState<string>('');
  const [currentStepOrder, setCurrentStepOrder] = useState<number>(1);
  const [isTourActive, setIsTourActiveState] = useState(false);
  const [stepRefs, setStepRefs] = useState<Map<string, RefObject<any>>>(new Map());
  const [scrollViewRef, setScrollViewRefState] = useState<MutableRefObject<any> | null>(null);
  
  // Wrap setters with logging
  const setShouldStartTour = useCallback((value: boolean) => {
    console.log('[TourContext] setShouldStartTour:', value);
    setShouldStartTourState(value);
  }, []);
  
  const setIsTourActive = useCallback((value: boolean) => {
    console.log('[TourContext] setIsTourActive:', value);
    setIsTourActiveState(value);
  }, []);
  
  // Step order mapping - maps step name to order number
  const STEP_ORDER_MAP: Record<string, number> = {
    'portfolio_balance': 1,
    'stats_section': 2,
    'property_card': 3,
    'guidance_card': 4,
  };
  
  const updateCurrentStep = (stepName: string) => {
    console.log('[TourContext] Updating step:', stepName);
    setCurrentStepName(stepName);
    const order = STEP_ORDER_MAP[stepName] || 1;
    setCurrentStepOrder(order);
  };

  // Method to register a step's ref
  const setStepRef = useCallback((stepName: string, ref: RefObject<any>) => {
    setStepRefs((prev) => {
      const newMap = new Map(prev);
      newMap.set(stepName, ref);
      return newMap;
    });
  }, []);

  // Method to set the scrollView ref
  const setScrollViewRef = useCallback((ref: MutableRefObject<any>) => {
    setScrollViewRefState(ref);
  }, []);

  // Method to scroll to a specific step
  const scrollToStep = useCallback(async (stepName: string): Promise<void> => {
    return new Promise((resolve) => {
      const ref = stepRefs.get(stepName);
      
      if (!ref || !ref.current || !scrollViewRef || !scrollViewRef.current) {
        console.warn(`[TourContext] Cannot scroll - missing refs for step: ${stepName}`);
        resolve();
        return;
      }

      try {
        // Measure the element's position
        ref.current.measureLayout(
          scrollViewRef.current,
          (x: number, y: number, width: number, height: number) => {
            console.log(`[TourContext] Scrolling to ${stepName}:`, { x, y, width, height });
            
            // Calculate scroll position to center element
            // Get screen height to calculate center position
            const screenHeight = Dimensions.get('window').height;
            const centerOffset = (screenHeight / 2) - (height / 2);
            const scrollToY = Math.max(0, y - centerOffset);

            // Smooth scroll to position
            if (scrollViewRef.current?.scrollTo) {
              scrollViewRef.current.scrollTo({
                y: scrollToY,
                animated: true,
              });
              
              // Resolve after animation completes
              setTimeout(() => resolve(), 300);
            } else {
              resolve();
            }
          },
          (error: any) => {
            console.error(`[TourContext] Error measuring ${stepName}:`, error);
            resolve();
          }
        );
      } catch (error) {
        console.error(`[TourContext] Error scrolling to ${stepName}:`, error);
        resolve();
      }
    });
  }, [stepRefs, scrollViewRef]);
  const isTourCompleted = async (screenName: string): Promise<boolean> => {
    try {
      const key = TOUR_KEYS[screenName.toUpperCase() as keyof typeof TOUR_KEYS];
      if (!key) return false;
      const value = await AsyncStorage.getItem(key);
      return value === 'true';
    } catch (error) {
      console.error('Error checking tour completion:', error);
      return false;
    }
  };

  const markTourCompleted = async (screenName: string): Promise<void> => {
    try {
      const key = TOUR_KEYS[screenName.toUpperCase() as keyof typeof TOUR_KEYS];
      if (!key) return;
      await AsyncStorage.setItem(key, 'true');
    } catch (error) {
      console.error('Error marking tour completed:', error);
    }
  };

  const resetTour = async (screenName?: string): Promise<void> => {
    console.log('[TourContext] resetTour called for:', screenName || 'all screens');
    try {
      if (screenName) {
        const key = TOUR_KEYS[screenName.toUpperCase() as keyof typeof TOUR_KEYS];
        if (key) {
          await AsyncStorage.removeItem(key);
          console.log('[TourContext] Removed tour completion for:', screenName);
        }
      } else {
        // Reset all tours
        await resetAllTours();
      }
    } catch (error) {
      console.error('[TourContext] Error resetting tour:', error);
    }
  };

  const resetAllTours = async (): Promise<void> => {
    try {
      await Promise.all([
        AsyncStorage.removeItem(TOUR_KEYS.HOME),
        AsyncStorage.removeItem(TOUR_KEYS.PROPERTY),
        AsyncStorage.removeItem(TOUR_KEYS.INVEST),
        AsyncStorage.removeItem(TOUR_KEYS.WALLET),
        AsyncStorage.removeItem(TOUR_KEYS.NOTIFICATIONS),
        AsyncStorage.removeItem(TOUR_KEYS.PROFILE),
      ]);
    } catch (error) {
      console.error('Error resetting all tours:', error);
    }
  };

  const isFirstLaunch = async (): Promise<boolean> => {
    try {
      const value = await AsyncStorage.getItem(TOUR_KEYS.FIRST_LAUNCH);
      return value !== 'true';
    } catch (error) {
      console.error('Error checking first launch:', error);
      return true;
    }
  };

  const setFirstLaunch = async (value: boolean): Promise<void> => {
    try {
      await AsyncStorage.setItem(TOUR_KEYS.FIRST_LAUNCH, value ? 'true' : 'false');
    } catch (error) {
      console.error('Error setting first launch:', error);
    }
  };

  return (
    <TourContext.Provider
      value={{
        isTourCompleted,
        markTourCompleted,
        resetTour,
        resetAllTours,
        isFirstLaunch,
        setFirstLaunch,
        shouldStartTour,
        setShouldStartTour,
        currentStepName,
        setCurrentStepName,
        currentStepOrder,
        setCurrentStepOrder,
        updateCurrentStep,
        isTourActive,
        setIsTourActive,
        stepRefs,
        setStepRef,
        scrollViewRef,
        setScrollViewRef,
        scrollToStep,
      }}
    >
      {children}
    </TourContext.Provider>
  );
};

export const useTour = (): TourContextType => {
  const context = useContext(TourContext);
  if (!context) {
    throw new Error('useTour must be used within a TourProvider');
  }
  return context;
};

