import { walkthroughable } from 'react-native-copilot';
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  FlatList,
} from 'react-native';

// CRITICAL FIX: walkthroughable creates its own internal ref system
// We should NOT pass refs directly to these components
// Instead, walkthroughable will handle refs internally and expose them via wrapperRef
// For auto-scrolling, we'll use the step's position data from stepChange event

// Simple wrapper - let walkthroughable handle refs internally
export const CopilotView = walkthroughable(View);
export const CopilotText = walkthroughable(Text);
export const CopilotTouchableOpacity = walkthroughable(TouchableOpacity);
export const CopilotTextInput = walkthroughable(TextInput);
export const CopilotScrollView = walkthroughable(ScrollView);
export const CopilotFlatList = walkthroughable(FlatList);

