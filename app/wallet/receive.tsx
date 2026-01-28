import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  Image,
  Alert,
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useColorScheme } from '@/lib/useColorScheme';
import { useWalletConnect } from '@/src/wallet/WalletConnectProvider';
import * as Clipboard from 'expo-clipboard';
import { LinearGradient } from 'expo-linear-gradient';

export default function ReceiveScreen() {
  const router = useRouter();
  const { colors, isDarkColorScheme } = useColorScheme();
  const { isConnected, address } = useWalletConnect();
  
  const [copied, setCopied] = useState(false);

  // Check if wallet is connected
  if (!isConnected || !address) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
        <StatusBar barStyle={isDarkColorScheme ? 'light-content' : 'dark-content'} />
        <MaterialIcons name="account-balance-wallet" size={64} color={colors.textMuted} />
        <Text style={{ color: colors.textPrimary, fontSize: 18, fontWeight: 'bold', marginTop: 16, textAlign: 'center' }}>
          Wallet Not Connected
        </Text>
        <Text style={{ color: colors.textSecondary, fontSize: 14, marginTop: 8, textAlign: 'center' }}>
          Please connect your wallet to receive payments
        </Text>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            marginTop: 24,
            paddingHorizontal: 24,
            paddingVertical: 12,
            backgroundColor: colors.primary,
            borderRadius: 12,
          }}
        >
          <Text style={{ color: '#FFFFFF', fontWeight: '600' }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleCopyAddress = async () => {
    await Clipboard.setStringAsync(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    Alert.alert('Copied!', 'Wallet address copied to clipboard');
  };

  // Generate QR code URL
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(address)}`;

  return (
    <LinearGradient colors={['#064E3B', '#022C22', '#000']} style={{ flex: 1 }}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View
        style={{
          paddingHorizontal: 16,
          paddingTop: StatusBar.currentHeight ? StatusBar.currentHeight + 16 : 48,
          paddingBottom: 16,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              width: 40,
              height: 40,
              borderRadius: 9999,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(255,255,255,0.1)',
            }}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>
            Receive Payment
          </Text>
          <View style={{ width: 40, height: 40 }} />
        </View>
      </View>

      <ScrollView style={{ flex: 1, paddingHorizontal: 16, paddingTop: 24 }} showsVerticalScrollIndicator={false}>
        <Text style={{ color: 'rgba(255,255,255,0.6)', textAlign: 'center', marginBottom: 24, fontSize: 14 }}>
          Share your wallet address to receive payments
        </Text>

        {/* QR Code */}
        <View
          style={{
            alignItems: 'center',
            padding: 24,
            borderRadius: 16,
            marginBottom: 24,
            backgroundColor: 'rgba(255,255,255,0.06)',
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.1)',
          }}
        >
          <View
            style={{
              width: 240,
              height: 240,
              backgroundColor: '#FFFFFF',
              padding: 16,
              borderRadius: 12,
              marginBottom: 16,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Image
              source={{ uri: qrCodeUrl }}
              style={{ width: '100%', height: '100%' }}
              resizeMode="contain"
            />
          </View>

          {/* Wallet Address */}
          <View
            style={{
              width: '100%',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: 12,
              borderRadius: 12,
              backgroundColor: 'rgba(255,255,255,0.06)',
            }}
          >
            <Text
              style={{
                flex: 1,
                fontFamily: 'monospace',
                fontSize: 14,
                color: '#fff',
              }}
              numberOfLines={1}
            >
              {address}
            </Text>
            <TouchableOpacity
              onPress={handleCopyAddress}
              style={{
                marginLeft: 12,
                padding: 8,
                borderRadius: 8,
                backgroundColor: copied ? '#10B981' : 'transparent',
              }}
            >
              <MaterialIcons
                name={copied ? 'check' : 'content-copy'}
                size={20}
                color={copied ? '#FFFFFF' : '#10B981'}
              />
            </TouchableOpacity>
          </View>

          {copied && (
            <Text style={{ color: '#10B981', fontSize: 12, marginTop: 8, fontWeight: '500' }}>
              Address copied!
            </Text>
          )}
        </View>

        {/* Share Options */}
        <View style={{ marginBottom: 24 }}>
          <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold', marginBottom: 12 }}>
            Share Address
          </Text>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <TouchableOpacity
              onPress={handleCopyAddress}
              style={{
                flex: 1,
                padding: 16,
                borderRadius: 12,
                backgroundColor: 'rgba(255,255,255,0.06)',
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.1)',
                alignItems: 'center',
              }}
            >
              <MaterialIcons name="content-copy" size={24} color="#10B981" />
              <Text style={{ color: '#fff', fontSize: 14, marginTop: 8, fontWeight: '500' }}>
                Copy
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                // Implement share functionality
                Alert.alert('Share', 'Share functionality will be implemented here');
              }}
              style={{
                flex: 1,
                padding: 16,
                borderRadius: 12,
                backgroundColor: 'rgba(255,255,255,0.06)',
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.1)',
                alignItems: 'center',
              }}
            >
              <MaterialIcons name="share" size={24} color="#10B981" />
              <Text style={{ color: '#fff', fontSize: 14, marginTop: 8, fontWeight: '500' }}>
                Share
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Info */}
        <View
          style={{
            padding: 16,
            borderRadius: 12,
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            marginBottom: 24,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
            <Ionicons name="information-circle" size={20} color="#3B82F6" />
            <Text style={{
              flex: 1,
              marginLeft: 12,
              fontSize: 14,
              lineHeight: 20,
              color: 'rgba(255,255,255,0.8)',
            }}>
              Send only supported tokens (ETH, USDC) to this address. Sending unsupported tokens may result in permanent loss.
              Make sure you're on the correct network before sending.
            </Text>
          </View>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </LinearGradient>
  );
}
