import { Alert } from 'react-native';

export const showSkipConfirmation = (handleStop: () => void) => {
  Alert.alert(
    'Skip Tour?',
    'You can restart the tour anytime from Settings > App Tour',
    [
      { text: 'Continue Tour', style: 'cancel' },
      { text: 'Skip', onPress: handleStop, style: 'destructive' },
    ]
  );
};

export const TOUR_STEPS = {
  HOME: {
    PORTFOLIO_BALANCE: {
      order: 1,
      name: 'portfolio_balance',
      title: 'Your Portfolio Balance',
      text: 'This shows your total investment value across all properties. Tap to view your wallet and manage funds.',
      totalSteps: 4,
    },
    STATS_SECTION: {
      order: 2,
      name: 'stats_section',
      title: 'Platform Statistics',
      text: 'See our platform metrics: 50+ properties available, $2M+ invested by users, and 12% average ROI. These numbers update in real-time.',
      totalSteps: 4,
    },
    PROPERTY_CARD: {
      order: 3,
      name: 'property_card',
      title: 'Featured Properties',
      text: 'Browse available properties below. Tap any property card to view details, check token availability, ROI, and make investments.',
      totalSteps: 4,
    },
    GUIDANCE_CARD: {
      order: 4,
      name: 'guidance_card',
      title: 'Need Help Getting Started?',
      text: 'Tap the guidance card to learn how to invest, understand tokenization, and maximize your returns. Perfect for beginners!',
      totalSteps: 4,
    },
  },
  PROPERTY: {
    IMAGES: {
      order: 1,
      name: 'property_images',
      title: 'Property Gallery',
      text: 'Swipe through high-quality images of the property and surrounding area.',
      totalSteps: 5,
    },
    TOKEN_INFO: {
      order: 2,
      name: 'token_info',
      title: 'Tokenization Details',
      text: 'Each property is divided into tokens. See the token price, total supply, and available tokens.',
      totalSteps: 5,
    },
    CALCULATOR: {
      order: 3,
      name: 'calculator',
      title: 'Calculate Your Investment',
      text: 'Use the calculator to see potential returns, rental income, and ROI before investing.',
      totalSteps: 5,
    },
    DOCUMENTS: {
      order: 4,
      name: 'documents',
      title: 'Legal Documents',
      text: 'Review property deeds, contracts, and certificates. All verified and blockchain-secured.',
      totalSteps: 5,
    },
    INVEST_BUTTON: {
      order: 5,
      name: 'invest_button',
      title: 'Start Investing',
      text: 'Ready to invest? Tap here to choose how many tokens you want to purchase.',
      totalSteps: 5,
    },
  },
  INVEST: {
    DRAG_HANDLE: {
      order: 1,
      name: 'drag_handle',
      title: 'Modal Controls',
      text: 'Swipe down anytime to close this screen and return to property details.',
      totalSteps: 6,
    },
    TOKEN_INPUT: {
      order: 2,
      name: 'token_input',
      title: 'Choose Token Amount',
      text: 'Enter the number of tokens you want to purchase. Use +/- buttons for quick adjustments.',
      totalSteps: 6,
    },
    PRICE_INPUT: {
      order: 3,
      name: 'price_input',
      title: 'Investment Amount',
      text: 'This shows your total investment in USD. Both fields sync automatically.',
      totalSteps: 6,
    },
    SLIDER: {
      order: 4,
      name: 'slider',
      title: 'Investment Progress',
      text: 'Visual indicator of how many available tokens you\'re purchasing. Don\'t exceed the maximum!',
      totalSteps: 6,
    },
    TRANSACTION_FEE: {
      order: 5,
      name: 'transaction_fee',
      title: 'Transaction Costs',
      text: 'A 2% platform fee is applied. This covers blockchain gas fees and platform maintenance.',
      totalSteps: 6,
    },
    CONFIRM_BUTTON: {
      order: 6,
      name: 'confirm_button',
      title: 'Confirm Investment',
      text: 'Review all details above, then tap to complete your investment securely on blockchain.',
      totalSteps: 6,
    },
  },
  WALLET: {
    BALANCE: {
      order: 1,
      name: 'balance',
      title: 'Wallet Balance',
      text: 'Your available USDC balance for making investments. Keep funds here for instant transactions.',
      totalSteps: 5,
    },
    DEPOSIT: {
      order: 2,
      name: 'deposit',
      title: 'Add Funds',
      text: 'Deposit USDC using credit card, bank transfer, or crypto. Funds available instantly.',
      totalSteps: 5,
    },
    WITHDRAW: {
      order: 3,
      name: 'withdraw',
      title: 'Withdraw Earnings',
      text: 'Transfer your rental income and investment returns to your bank or crypto wallet.',
      totalSteps: 5,
    },
    TRANSACTIONS: {
      order: 4,
      name: 'transactions',
      title: 'Transaction History',
      text: 'View all deposits, withdrawals, investments, and rental payments with full details.',
      totalSteps: 5,
    },
    FILTER_TABS: {
      order: 5,
      name: 'filter_tabs',
      title: 'Filter Transactions',
      text: 'Sort by transaction type (All, Deposits, Withdrawals, Investments) for quick access.',
      totalSteps: 5,
    },
  },
  PROFILE: {
    PROFILE_PICTURE: {
      order: 1,
      name: 'profile_picture',
      title: 'Your Profile',
      text: 'Tap the edit icon to change your profile picture and personal information.',
      totalSteps: 5,
    },
    BOOKMARKS: {
      order: 2,
      name: 'bookmarks',
      title: 'Saved Properties',
      text: 'Quick access to properties you\'ve bookmarked. Tap to view details.',
      totalSteps: 5,
    },
    SECURITY: {
      order: 3,
      name: 'security',
      title: 'Account Security',
      text: 'Manage password, 2FA, and biometric login. Keep your investments secure.',
      totalSteps: 5,
    },
    THEME: {
      order: 4,
      name: 'theme',
      title: 'Customize Appearance',
      text: 'Choose between Light, Dark, or System theme. Your preference is saved automatically.',
      totalSteps: 5,
    },
    BIOMETRIC: {
      order: 5,
      name: 'biometric',
      title: 'Face ID / Touch ID',
      text: 'Enable biometric authentication for faster, more secure access to your account.',
      totalSteps: 5,
    },
  },
};

// Helper to get total steps for a screen
export const getTotalSteps = (screenName: string): number => {
  const steps = TOUR_STEPS[screenName.toUpperCase() as keyof typeof TOUR_STEPS];
  return steps ? Object.keys(steps).length : 0;
};

// Helper to get step details by name
export const getStepDetails = (stepName: string): any => {
  for (const screen of Object.values(TOUR_STEPS)) {
    for (const step of Object.values(screen)) {
      if (step.name === stepName) {
        return step;
      }
    }
  }
  return null;
};

