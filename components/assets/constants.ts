import { Dimensions } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Calculate available height for cards dynamically
// Account for: Header (~94px), Pagination dots (~24px), Action buttons (~64px), Navigation hint (~32px), SafeArea (~40px), margins (~16px)
const HEADER_HEIGHT = 94;
const PAGINATION_HEIGHT = 24;
const ACTION_BUTTONS_HEIGHT = 64;
const NAVIGATION_HINT_HEIGHT = 32;
const SAFE_AREA_PADDING = 40;
const VERTICAL_MARGINS = 16;

const RESERVED_HEIGHT = (
  HEADER_HEIGHT + 
  PAGINATION_HEIGHT + 
  ACTION_BUTTONS_HEIGHT + 
  NAVIGATION_HINT_HEIGHT + 
  SAFE_AREA_PADDING + 
  VERTICAL_MARGINS
);

const AVAILABLE_HEIGHT = SCREEN_HEIGHT - RESERVED_HEIGHT;

// Calculate card height: use 90% of available height
// Ensure minimum height of 350px for very small screens
// Cap at 70% of screen height for very large screens
const CARD_HEIGHT = Math.max(
  350,
  Math.min(
    AVAILABLE_HEIGHT * 0.99,
    SCREEN_HEIGHT * 0.8
  )
);

export const ASSETS_CONSTANTS = {
  SCREEN_WIDTH,
  SCREEN_HEIGHT,
  CARD_WIDTH: SCREEN_WIDTH * 0.9,
  CARD_HEIGHT,
  SPACING: 16,
  TIME_RANGES: ['3M', '6M', '1Y', 'All'] as const,
};

