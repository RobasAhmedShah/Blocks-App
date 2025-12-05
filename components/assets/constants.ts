import { Dimensions } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export const ASSETS_CONSTANTS = {
  SCREEN_WIDTH,
  SCREEN_HEIGHT,
  CARD_WIDTH: SCREEN_WIDTH * 0.9,
  CARD_HEIGHT: SCREEN_HEIGHT * 0.7,
  SPACING: 16,
  TIME_RANGES: ['3M', '6M', '1Y', 'All'] as const,
};

