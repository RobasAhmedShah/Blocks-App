import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Modal from 'react-native-modal';
import { useChatbot, ChatMessage } from '@/services/useChatbot';
import { Property } from '@/types/property';
import { useColorScheme } from '@/lib/useColorScheme';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface PropertyChatbotProps {
  property: Property;
  visible: boolean;
  onClose: () => void;
}

const suggestedPrompts = [
  "What's the rental yield?",
  "Tell me about the developer",
  "Compare to my portfolio",
];

// Loading dots animation component
const LoadingDots = ({ colors }: { colors: any }) => {
  const dot1 = useRef(new Animated.Value(0.6)).current;
  const dot2 = useRef(new Animated.Value(0.6)).current;
  const dot3 = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    const animateDot = (dot: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.parallel([
            Animated.timing(dot, {
              toValue: 1,
              duration: 400,
              useNativeDriver: true,
            }),
            Animated.timing(dot, {
              toValue: 0.6,
              duration: 400,
              delay: 400,
              useNativeDriver: true,
            }),
          ]),
        ])
      );
    };

    const animations = [
      animateDot(dot1, 0),
      animateDot(dot2, 160),
      animateDot(dot3, 320),
    ];

    animations.forEach((anim) => anim.start());

    return () => {
      animations.forEach((anim) => anim.stop());
    };
  }, [dot1, dot2, dot3]);

  const getDotStyle = (dot: Animated.Value) => ({
    opacity: dot,
    transform: [
      {
        scale: dot.interpolate({
          inputRange: [0.6, 1],
          outputRange: [0.8, 1],
        }),
      },
    ],
  });

  return (
    <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View
        style={[
          {
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: colors.primary,
          },
          getDotStyle(dot1),
        ]}
      />
      <Animated.View
        style={[
          {
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: colors.primary,
          },
          getDotStyle(dot2),
        ]}
      />
      <Animated.View
        style={[
          {
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: colors.primary,
          },
          getDotStyle(dot3),
        ]}
      />
    </View>
  );
};

// Message bubble component
const MessageBubble = ({ message, isUser, colors, isDarkColorScheme }: { 
  message: ChatMessage; 
  isUser: boolean;
  colors: any;
  isDarkColorScheme: boolean;
}) => {
  if (isUser) {
    return (
      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 16 }}>
        <View style={{ maxWidth: '80%', alignItems: 'flex-end' }}>
          <Text
            style={{
              fontSize: 14,
              fontWeight: '500',
              color: colors.textSecondary,
              marginBottom: 4,
            }}
          >
            You
          </Text>
          <View
            style={{
              backgroundColor: colors.primary,
              borderRadius: 16,
              borderBottomRightRadius: 4,
              paddingHorizontal: 16,
              paddingVertical: 12,
            }}
          >
            <Text style={{ color: colors.primaryForeground, fontSize: 16, lineHeight: 22 }}>
              {message.content}
            </Text>
          </View>
        </View>
      </View>
    );
  }

  // AI message
  return (
    <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16, alignItems: 'flex-end',
      zIndex: 1000,
      position: 'relative',
     }}>
      <View
        style={{
          width: 32,
          height: 32,
          borderRadius: 16,
          backgroundColor: isDarkColorScheme ? 'rgba(22, 163, 74, 0.2)' : 'rgba(22, 163, 74, 0.1)',
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 1,
          borderColor: colors.primary,
        }}
      >
        <Ionicons name="shield-checkmark" size={18} color={colors.primary} />
      </View>
      <View style={{ flex: 1, maxWidth: '80%' }}>
        <Text
          style={{
            fontSize: 14,
            fontWeight: '500',
            color: colors.textSecondary,
            marginBottom: 4,
          }}
        >
          Blocks AI
        </Text>
        {message.error ? (
          <View
            style={{
              borderRadius: 16,
              borderBottomLeftRadius: 4,
              borderWidth: 1,
              borderColor: isDarkColorScheme ? 'rgba(239, 68, 68, 0.3)' : 'rgba(239, 68, 68, 0.5)',
              backgroundColor: isDarkColorScheme ? 'rgba(127, 29, 29, 0.2)' : 'rgba(254, 242, 242, 0.8)',
              paddingHorizontal: 16,
              paddingVertical: 12,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons name="warning" size={20} color="#EF4444" />
              <Text style={{ color: colors.textPrimary, fontSize: 16, lineHeight: 22, flex: 1 }}>
                {message.content}
              </Text>
            </View>
          </View>
        ) : (
          <View
            style={{
              borderRadius: 16,
              borderBottomLeftRadius: 4,
              borderWidth: 1,
              borderColor: colors.border,
              backgroundColor: colors.card,
              paddingHorizontal: 16,
              paddingVertical: 12,
              shadowColor: colors.primary,
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 2,
            }}
          >
            <Text style={{ color: colors.textPrimary, fontSize: 16, lineHeight: 22 }}>
              {message.content}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

export default function PropertyChatbot({ property, visible, onClose }: PropertyChatbotProps) {
  const [input, setInput] = useState('');
  const { messages, isLoading, error, sendMessage, retryLastMessage, clearError } = useChatbot({
    property,
  });
  const scrollViewRef = useRef<ScrollView>(null);
  const { colors, isDarkColorScheme } = useColorScheme();

  useEffect(() => {
    if (messages.length > 0 && scrollViewRef.current) {
      requestAnimationFrame(() => {
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 100);
      });
    }
  }, [messages, isLoading]);

  useEffect(() => {
    if (visible && scrollViewRef.current) {
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({ y: 0, animated: false });
      }, 100);
    }
  }, [visible]);

  const handleSend = () => {
    if (input.trim() && !isLoading) {
      sendMessage(input);
      setInput('');
      clearError();
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 200);
    }
  };

  const handleSuggestedPrompt = (prompt: string) => {
    sendMessage(prompt);
    clearError();
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 200);
  };

  const handleClose = () => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({ y: 0, animated: false });
    }
    onClose();
  };

  return (
    <Modal
      isVisible={visible}
      onSwipeComplete={handleClose}
      swipeDirection="down"
      propagateSwipe={true}
      style={{ justifyContent: 'flex-end', margin: 0}}
      avoidKeyboard={true}
      onBackdropPress={handleClose}
      onModalHide={() => {
        if (scrollViewRef.current) {
          scrollViewRef.current.scrollTo({ y: 0, animated: false });
        }
      }}
      swipeThreshold={50}
      animationIn="slideInUp"
      animationOut="slideOutDown"
      useNativeDriverForBackdrop={true}
    >
      <View
        style={{
          height: SCREEN_HEIGHT * 0.9,
          backgroundColor: colors.card,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          overflow: 'hidden',
        }}
      >
        {/* Handle */}
        <View
          style={{
            height: 40,
            width: '100%',
            alignItems: 'center',
            justifyContent: 'center',
            paddingTop: 8,
            paddingBottom: 8,
            backgroundColor: colors.card,
          }}
        >
          <View
            style={{
              height: 6,
              width: 40,
              borderRadius: 3,
              backgroundColor: colors.textMuted,
              opacity: 0.5,
            }}
          />
        </View>

        {/* Header */}
        <View 
          style={{ 
            paddingHorizontal: 16, 
            paddingBottom: 16,
            backgroundColor: colors.card,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
          }}
        >
          <Text
            style={{
              fontSize: 20,
              fontWeight: 'bold',
              color: colors.textPrimary,
              textAlign: 'center',
              marginBottom: 4,
            }}
          >
            Ask about this Property
          </Text>
          <View className="flex-row items-center justify-center gap-2">
            <Text
              style={{
                fontSize: 12,
                color: colors.textMuted,
                textAlign: 'center',
              }}
            >
              Powered by
            </Text>
            <View 
              style={{
                paddingHorizontal: 8,
                paddingVertical: 2,
                backgroundColor: isDarkColorScheme ? 'rgba(22, 163, 74, 0.15)' : 'rgba(22, 163, 74, 0.1)',
                borderRadius: 4,
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  color: colors.primary,
                  fontWeight: '600',
                }}
              >
                Gemini AI
              </Text>
            </View>
          </View>
        </View>

        {/* Messages */}
        <ScrollView
          ref={scrollViewRef}
          style={{ flex: 1, backgroundColor: colors.background }}
          contentContainerStyle={{ 
            paddingHorizontal: 16, 
            paddingBottom: 100,
            paddingTop: 16,
          }}
          showsVerticalScrollIndicator={true}
          keyboardShouldPersistTaps="never"
          nestedScrollEnabled={true}
        >
          {messages.map((message, index) => (
            <MessageBubble
              key={index}
              message={message}
              isUser={message.role === 'user'}
              colors={colors}
              isDarkColorScheme={isDarkColorScheme}
            />
          ))}

          {/* Loading indicator */}
          {isLoading && (
            <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16, alignItems: 'flex-end' }}>
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: isDarkColorScheme ? 'rgba(22, 163, 74, 0.2)' : 'rgba(22, 163, 74, 0.1)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 1,
                  borderColor: colors.primary,
                }}
              >
                <Ionicons name="shield-checkmark" size={18} color={colors.primary} />
              </View>
              <View style={{ flex: 1, maxWidth: '80%' }}>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: '500',
                    color: colors.textSecondary,
                    marginBottom: 4,
                  }}
                >
                  Blocks AI
                </Text>
                <View
                  style={{
                    borderRadius: 16,
                    borderBottomLeftRadius: 4,
                    borderWidth: 1,
                    borderColor: colors.border,
                    backgroundColor: colors.card,
                    paddingHorizontal: 16,
                    paddingVertical: 18,
                  }}
                >
                  <LoadingDots colors={colors} />
                </View>
              </View>
            </View>
          )}

          {/* Suggested prompts */}
          {messages.length === 1 && !isLoading && (
            <View
              style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                gap: 8,
                marginLeft: 44,
                marginBottom: 16,
              }}
            >
              {suggestedPrompts.map((prompt, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => handleSuggestedPrompt(prompt)}
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: colors.border,
                    backgroundColor: colors.card,
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={{ color: colors.textPrimary, fontSize: 14, fontWeight: '500' }}>
                    {prompt}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Error retry buttons */}
          {error && messages[messages.length - 1]?.error && (
            <View
              style={{
                flexDirection: 'row',
                gap: 8,
                marginLeft: 44,
                marginTop: 8,
              }}
            >
              <TouchableOpacity
                onPress={retryLastMessage}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: 20,
                  borderWidth: 1,
                  borderColor: colors.border,
                  backgroundColor: colors.muted,
                }}
                activeOpacity={0.7}
              >
                <Ionicons name="refresh" size={16} color={colors.textPrimary} />
                <Text style={{ color: colors.textPrimary, fontSize: 14, fontWeight: '500' }}>
                  Try Again
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={onClose}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: 20,
                  borderWidth: 1,
                  borderColor: colors.border,
                  backgroundColor: colors.muted,
                }}
                activeOpacity={0.7}
              >
                <Ionicons name="help-circle" size={16} color={colors.textPrimary} />
                <Text style={{ color: colors.textPrimary, fontSize: 14, fontWeight: '500' }}>
                  Support
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>

        {/* Input area */}
        <View
        // className='bg-red-400 border-t border-border'
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            padding: 16,
            borderTopWidth: 1,
            borderTopColor: colors.border,
            backgroundColor: colors.card,
          }}
        >
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Ask me anything..."
            placeholderTextColor={colors.textMuted}
            style={{
              flex: 1,
              height: 48,
              borderRadius: 12,
              backgroundColor: colors.card,
              color: colors.textPrimary,
              paddingHorizontal: 16,
              fontSize: 16,
              borderWidth: 1,
              borderColor: colors.border,
            }}
            multiline={false}
            onSubmitEditing={() => {
              handleSend();
              Keyboard.dismiss();
            }}
            returnKeyType="send"
            editable={!isLoading}
            blurOnSubmit={true}
          />
          <TouchableOpacity
            onPress={handleSend}
            disabled={!input.trim() || isLoading}
            activeOpacity={0.7}
          >
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: colors.primary,
                opacity: input.trim() && !isLoading ? 1 : 0.5,
              }}
            >
              <Ionicons name="send" size={22} color={colors.primaryForeground} />
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}