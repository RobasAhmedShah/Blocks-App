import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface WalkthroughContextType {
  isWalkthroughCompleted: (screenName: string) => Promise<boolean>;
  markWalkthroughCompleted: (screenName: string) => Promise<void>;
  resetWalkthrough: (screenName?: string) => Promise<void>;
  resetAllWalkthroughs: () => Promise<void>;
  isFirstLaunch: () => Promise<boolean>;
  setFirstLaunch: (value: boolean) => Promise<void>;
}

const WalkthroughContext = createContext<WalkthroughContextType | undefined>(undefined);

const WALKTHROUGH_KEYS = {
  FIRST_LAUNCH: '@walkthrough_first_launch',
  HOME: '@walkthrough_completed_home',
  PORTFOLIO: '@walkthrough_completed_portfolio',
  PROPERTY: '@walkthrough_completed_property',
  WALLET: '@walkthrough_completed_wallet',
  PROFILE: '@walkthrough_completed_profile',
};

export const WalkthroughProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const isWalkthroughCompleted = async (screenName: string): Promise<boolean> => {
    try {
      const key = WALKTHROUGH_KEYS[screenName.toUpperCase() as keyof typeof WALKTHROUGH_KEYS];
      if (!key) return false;
      const value = await AsyncStorage.getItem(key);
      return value === 'true';
    } catch (error) {
      console.error('Error checking walkthrough completion:', error);
      return false;
    }
  };

  const markWalkthroughCompleted = async (screenName: string): Promise<void> => {
    try {
      const key = WALKTHROUGH_KEYS[screenName.toUpperCase() as keyof typeof WALKTHROUGH_KEYS];
      if (!key) return;
      await AsyncStorage.setItem(key, 'true');
    } catch (error) {
      console.error('Error marking walkthrough completed:', error);
    }
  };

  const resetWalkthrough = async (screenName?: string): Promise<void> => {
    try {
      if (screenName) {
        const key = WALKTHROUGH_KEYS[screenName.toUpperCase() as keyof typeof WALKTHROUGH_KEYS];
        if (key) {
          await AsyncStorage.removeItem(key);
        }
      } else {
        // Reset all walkthroughs
        await resetAllWalkthroughs();
      }
    } catch (error) {
      console.error('Error resetting walkthrough:', error);
    }
  };

  const resetAllWalkthroughs = async (): Promise<void> => {
    try {
      await Promise.all([
        AsyncStorage.removeItem(WALKTHROUGH_KEYS.HOME),
        AsyncStorage.removeItem(WALKTHROUGH_KEYS.PORTFOLIO),
        AsyncStorage.removeItem(WALKTHROUGH_KEYS.PROPERTY),
        AsyncStorage.removeItem(WALKTHROUGH_KEYS.WALLET),
        AsyncStorage.removeItem(WALKTHROUGH_KEYS.PROFILE),
      ]);
    } catch (error) {
      console.error('Error resetting all walkthroughs:', error);
    }
  };

  const isFirstLaunch = async (): Promise<boolean> => {
    try {
      const value = await AsyncStorage.getItem(WALKTHROUGH_KEYS.FIRST_LAUNCH);
      return value !== 'true';
    } catch (error) {
      console.error('Error checking first launch:', error);
      return true;
    }
  };

  const setFirstLaunch = async (value: boolean): Promise<void> => {
    try {
      await AsyncStorage.setItem(WALKTHROUGH_KEYS.FIRST_LAUNCH, value ? 'true' : 'false');
    } catch (error) {
      console.error('Error setting first launch:', error);
    }
  };

  return (
    <WalkthroughContext.Provider
      value={{
        isWalkthroughCompleted,
        markWalkthroughCompleted,
        resetWalkthrough,
        resetAllWalkthroughs,
        isFirstLaunch,
        setFirstLaunch,
      }}
    >
      {children}
    </WalkthroughContext.Provider>
  );
};

export const useWalkthrough = (): WalkthroughContextType => {
  const context = useContext(WalkthroughContext);
  if (!context) {
    throw new Error('useWalkthrough must be used within a WalkthroughProvider');
  }
  return context;
};

