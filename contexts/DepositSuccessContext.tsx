import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { Modal, View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/lib/useColorScheme';

interface DepositSuccessState {
  visible: boolean;
  title: string;
  message: string;
}

interface DepositSuccessContextType {
  showDepositSuccess: (title: string, message: string) => void;
  hideDepositSuccess: () => void;
}

const DepositSuccessContext = createContext<DepositSuccessContextType | undefined>(undefined);

export function DepositSuccessProvider({ children }: { children: ReactNode }) {
  const { colors, isDarkColorScheme } = useColorScheme();
  const [state, setState] = useState<DepositSuccessState>({
    visible: false,
    title: '',
    message: '',
  });

  const showDepositSuccess = useCallback((title: string, message: string) => {
    setState({
      visible: true,
      title,
      message,
    });
  }, []);

  const hideDepositSuccess = useCallback(() => {
    setState(prev => ({ ...prev, visible: false }));
  }, []);

  return (
    <DepositSuccessContext.Provider value={{ showDepositSuccess, hideDepositSuccess }}>
      {children}
      
      {/* Global Deposit Success Modal */}
      <Modal
        visible={state.visible}
        transparent={true}
        animationType="fade"
        onRequestClose={hideDepositSuccess}
      >
        <View style={{
          flex: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 24,
        }}>
          <View style={{
            backgroundColor: isDarkColorScheme ? 'rgba(0, 0, 0, 0.9)' : '#FFFFFF',
            borderRadius: 20,
            padding: 24,
            width: '100%',
            maxWidth: 320,
            alignItems: 'center',
            borderWidth: 1.5,
            borderColor: colors.primary,
            position: 'relative',
          }}>
            {/* Close Button */}
            <TouchableOpacity
              onPress={hideDepositSuccess}
              style={{
                position: 'absolute',
                top: 12,
                right: 12,
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: isDarkColorScheme ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 10,
              }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons 
                name="close" 
                size={20} 
                color={isDarkColorScheme ? colors.textSecondary : colors.textPrimary} 
              />
            </TouchableOpacity>

            <View style={{ alignItems: 'center', width: '100%' }}>
              <View style={{
                width: 64,
                height: 64,
                borderRadius: 32,
                backgroundColor: isDarkColorScheme ? 'rgba(16, 185, 129, 0.2)' : 'rgba(16, 185, 129, 0.1)',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16,
              }}>
                <Ionicons name="checkmark-circle" size={48} color="#10B981" />
              </View>
              <Text style={{
                fontSize: 20,
                fontWeight: 'bold',
                color: colors.textPrimary,
                marginBottom: 8,
                textAlign: 'center',
              }}>
                {state.title}
              </Text>
              <Text style={{
                fontSize: 14,
                color: colors.textSecondary,
                textAlign: 'center',
                lineHeight: 20,
              }}>
                {state.message}
              </Text>
            </View>
          </View>
        </View>
      </Modal>
    </DepositSuccessContext.Provider>
  );
}

export function useDepositSuccess() {
  const context = useContext(DepositSuccessContext);
  if (context === undefined) {
    throw new Error('useDepositSuccess must be used within a DepositSuccessProvider');
  }
  return context;
}

