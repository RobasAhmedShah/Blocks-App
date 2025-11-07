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
const LoadingDots = () => {
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
            backgroundColor: '#00F2C3',
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
            backgroundColor: '#00F2C3',
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
            backgroundColor: '#00F2C3',
          },
          getDotStyle(dot3),
        ]}
      />
    </View>
  );
};

// Message bubble component
const MessageBubble = ({ message, isUser }: { message: ChatMessage; isUser: boolean }) => {
  const { colors } = useColorScheme();

  if (isUser) {
    return (
      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 16 }}>
        <View style={{ maxWidth: '80%', alignItems: 'flex-end' }}>
          <Text
            style={{
              fontSize: 14,
              fontWeight: '500',
              color: 'rgba(255, 255, 255, 0.8)',
              marginBottom: 4,
            }}
          >
            You
          </Text>
          <View
            style={{
              backgroundColor: '#2C2C2E',
              borderRadius: 16,
              borderBottomRightRadius: 4,
              paddingHorizontal: 16,
              paddingVertical: 12,
            }}
          >
            <Text style={{ color: '#E8ECEF', fontSize: 16, lineHeight: 22 }}>
              {message.content}
            </Text>
          </View>
        </View>
      </View>
    );
  }

  // AI message with gradient border effect
  return (
    <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16, alignItems: 'flex-end' }}>
      <View
        style={{
          width: 32,
          height: 32,
          borderRadius: 16,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 1,
          borderColor: 'rgba(0, 221, 168, 0.5)',
        }}
      >
        <Ionicons name="shield-checkmark" size={18} color="#00DDA8" />
      </View>
      <View style={{ flex: 1, maxWidth: '80%' }}>
        <Text
          style={{
            fontSize: 14,
            fontWeight: '500',
            color: 'rgba(255, 255, 255, 0.8)',
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
              borderColor: 'rgba(255, 138, 0, 0.5)',
              backgroundColor: 'rgba(127, 29, 29, 0.2)',
              paddingHorizontal: 16,
              paddingVertical: 12,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <Ionicons name="warning" size={20} color="#FFB84D" />
              <Text style={{ color: '#E8ECEF', fontSize: 16, lineHeight: 22, flex: 1 }}>
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
              borderColor: 'rgba(0, 242, 195, 0.5)',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              paddingHorizontal: 16,
              paddingVertical: 12,
              shadowColor: '#00F2C3',
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 4,
            }}
          >
            <Text style={{ color: '#E8ECEF', fontSize: 16, lineHeight: 22 }}>
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
      // Use requestAnimationFrame for more reliable scrolling
      requestAnimationFrame(() => {
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 100);
      });
    }
  }, [messages, isLoading]);

  // Reset scroll position when modal opens
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
      // Scroll to bottom after sending
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 200);
    }
  };

  const handleSuggestedPrompt = (prompt: string) => {
    sendMessage(prompt);
    clearError();
    // Scroll to bottom after sending
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 200);
  };

  const handleClose = () => {
    // Reset scroll position before closing
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
      style={{ justifyContent: 'flex-end', margin: 0 }}
      avoidKeyboard={true}
      onBackdropPress={handleClose}
      onModalHide={() => {
        // Reset scroll position when modal closes
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
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          borderTopWidth: 1,
          borderTopColor: 'rgba(255, 255, 255, 0.1)',
          overflow: 'hidden',
        }}
      >
        <BlurView intensity={80} tint="dark" style={{ flex: 1 }}>
            {/* Handle */}
            <View
              style={{
                height: 40,
                width: '100%',
                alignItems: 'center',
                justifyContent: 'center',
                paddingTop: 8,
                paddingBottom: 8,
              }}
            >
              <View
                style={{
                  height: 6,
                  width: 40,
                  borderRadius: 3,
                  backgroundColor: 'rgba(255, 255, 255, 0.3)',
                }}
              />
            </View>

              {/* Header */}
              <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
                <Text
                  style={{
                    fontSize: 20,
                    fontWeight: 'bold',
                    color: '#FFFFFF',
                    textAlign: 'center',
                    marginBottom: 4,
                  }}
                >
                  Ask about this Property
                </Text>
                <Text
                  style={{
                    fontSize: 12,
                    color: 'rgba(255, 193, 7, 0.8)',
                    textAlign: 'center',
                  }}
                >
                  Powered by Gemini
                </Text>
              </View>

              {/* Messages */}
              <ScrollView
                ref={scrollViewRef}
                style={{ flex: 1 }}
                contentContainerStyle={{ 
                  paddingHorizontal: 16, 
                  paddingBottom: 100, // Extra padding to ensure content isn't cut off
                  paddingTop: 8,
                }}
                showsVerticalScrollIndicator={true}
                keyboardShouldPersistTaps="handled"
                nestedScrollEnabled={true}
              >
                {messages.map((message, index) => (
                  <MessageBubble
                    key={index}
                    message={message}
                    isUser={message.role === 'user'}
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
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderWidth: 1,
                        borderColor: 'rgba(0, 221, 168, 0.5)',
                      }}
                    >
                      <Ionicons name="shield-checkmark" size={18} color="#00DDA8" />
                    </View>
                    <View style={{ flex: 1, maxWidth: '80%' }}>
                      <Text
                        style={{
                          fontSize: 14,
                          fontWeight: '500',
                          color: 'rgba(255, 255, 255, 0.8)',
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
                          borderColor: 'rgba(0, 242, 195, 0.5)',
                          backgroundColor: 'rgba(255, 255, 255, 0.1)',
                          paddingHorizontal: 16,
                          paddingVertical: 18,
                        }}
                      >
                        <LoadingDots />
                      </View>
                    </View>
                  </View>
                )}

                {/* Suggested prompts (only show on first message) */}
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
                          borderColor: 'rgba(255, 255, 255, 0.2)',
                          backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        }}
                      >
                        <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '500' }}>
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
                        borderColor: 'rgba(255, 255, 255, 0.2)',
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      }}
                    >
                      <Ionicons name="refresh" size={16} color="#FFFFFF" />
                      <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '500' }}>
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
                        borderColor: 'rgba(255, 255, 255, 0.2)',
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      }}
                    >
                      <Ionicons name="help-circle" size={16} color="#FFFFFF" />
                      <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '500' }}>
                        Support
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </ScrollView>

              {/* Input area */}
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                  padding: 16,
                  borderTopWidth: 1,
                  borderTopColor: 'rgba(255, 255, 255, 0.1)',
                  backgroundColor: 'rgba(0, 0, 0, 0.6)',
                }}
              >
                <TextInput
                  value={input}
                  onChangeText={setInput}
                  placeholder="Ask me anything..."
                  placeholderTextColor="rgba(255, 255, 255, 0.5)"
                  style={{
                    flex: 1,
                    height: 48,
                    borderRadius: 12,
                    backgroundColor: '#1F2937',
                    color: '#FFFFFF',
                    paddingHorizontal: 16,
                    fontSize: 16,
                  }}
                  multiline={false}
                  onSubmitEditing={handleSend}
                  returnKeyType="send"
                  editable={!isLoading}
                />
                <TouchableOpacity
                  onPress={handleSend}
                  disabled={!input.trim() || isLoading}
                  activeOpacity={0.7}
                >
                  <LinearGradient
                    colors={['#00F2C3', '#00B894']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 12,
                      alignItems: 'center',
                      justifyContent: 'center',
                      opacity: input.trim() && !isLoading ? 1 : 0.5,
                    }}
                  >
                    <Ionicons name="send" size={22} color="#000000" />
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </BlurView>
        </View>
    </Modal>
  );
}

