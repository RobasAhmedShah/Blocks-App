import React from 'react';
import { View, Text, TouchableOpacity, Platform, InputAccessoryView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/lib/useColorScheme';
import { Keyboard } from 'react-native';

interface KeyboardDismissButtonProps {
  inputAccessoryViewID: string;
}

export const KeyboardDismissButton: React.FC<KeyboardDismissButtonProps> = ({ inputAccessoryViewID }) => {
  const { colors, isDarkColorScheme } = useColorScheme();

  if (Platform.OS !== 'ios') {
    return null; // Only show on iOS
  }

  return (
    <InputAccessoryView nativeID={inputAccessoryViewID}>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'flex-end',
          alignItems: 'center',
          backgroundColor: isDarkColorScheme ? '#1C1C1E' : '#F2F2F7',
          borderTopWidth: 1,
          borderTopColor: isDarkColorScheme ? '#38383A' : '#C6C6C8',
          paddingHorizontal: 16,
          paddingVertical: 8,
          height: 44,
        }}
      >
        <TouchableOpacity
          onPress={() => Keyboard.dismiss()}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 12,
            paddingVertical: 6,
          }}
          activeOpacity={0.7}
        >
          <Text
            style={{
              color: colors.primary,
              fontSize: 17,
              fontWeight: '600',
            }}
          >
            Done
          </Text>
        </TouchableOpacity>
      </View>
    </InputAccessoryView>
  );
};

