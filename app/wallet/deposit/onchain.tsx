import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  Image,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useColorScheme } from '@/lib/useColorScheme';
import { useWallet } from '@/services/useWallet';
import * as Clipboard from 'expo-clipboard';
import { blockchainNetworks, defaultWalletAddress } from '@/data/mockWallet';

export default function OnChainDepositScreen() {
  const router = useRouter();
  const { colors, isDarkColorScheme } = useColorScheme();
  const { balance } = useWallet();
  const [selectedNetwork, setSelectedNetwork] = useState('polygon');

  // Check account restrictions on mount
  useEffect(() => {
    const restrictions = balance.restrictions;
    if (restrictions) {
      if (restrictions.blockDeposits || restrictions.isUnderReview || restrictions.isRestricted) {
        const message = restrictions.blockDeposits 
          ? `Your wallet or deposit is blocked. ${restrictions.restrictionReason || 'Please contact Blocks team.'}`
          : 'Your account is under review/restricted. Deposits are not allowed. Please contact Blocks team.';
        
        Alert.alert(
          'Deposit Blocked',
          message,
          [
            {
              text: 'OK',
              onPress: () => router.back(),
            },
          ],
          { cancelable: false }
        );
      }
    }
  }, [balance.restrictions]);

  const walletAddress = defaultWalletAddress;
  const networks = blockchainNetworks;

  const handleCopyAddress = async () => {
    await Clipboard.setStringAsync(walletAddress);
    Alert.alert('Copied!', 'Wallet address copied to clipboard');
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle={isDarkColorScheme ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View
        style={{
          paddingHorizontal: 16,
          paddingTop: StatusBar.currentHeight ? StatusBar.currentHeight + 16 : 48,
          paddingBottom: 16,
          backgroundColor: `${colors.background}CC`,
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
              backgroundColor: isDarkColorScheme ? `${colors.card}99` : colors.muted,
            }}
          >
            <MaterialIcons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={{ color: colors.textPrimary, fontSize: 18, fontWeight: 'bold' }}>
            On-Chain Deposit
          </Text>
          <View style={{ width: 40, height: 40 }} />
        </View>
      </View>

      <ScrollView style={{ flex: 1, paddingHorizontal: 16, paddingTop: 16 }} showsVerticalScrollIndicator={false}>
        <Text style={{ color: colors.textSecondary, textAlign: 'center', marginBottom: 24 }}>
          Send USDC or supported tokens to your wallet
        </Text>

        {/* Network Selection */}
        <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: 'bold', marginBottom: 12 }}>
          Select Network
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 24 }}>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            {networks.map((network) => (
              <TouchableOpacity
                key={network.id}
                onPress={() => setSelectedNetwork(network.id)}
                style={{
                  width: 160,
                  padding: 16,
                  borderRadius: 16,
                  backgroundColor: selectedNetwork === network.id
                    ? colors.card
                    : isDarkColorScheme
                    ? `${colors.card}80`
                    : colors.muted,
                  borderWidth: selectedNetwork === network.id ? 2 : 0,
                  borderColor: selectedNetwork === network.id ? colors.primary : 'transparent',
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                  <View style={{
                    width: 24,
                    height: 24,
                    borderRadius: 9999,
                    backgroundColor: '#FFFFFF',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <Text style={{ fontSize: 12 }}>🔗</Text>
                  </View>
                  <Text style={{
                    marginLeft: 8,
                    fontWeight: 'bold',
                    color: colors.textPrimary,
                  }}>
                    {network.name}
                  </Text>
                </View>
                <Text style={{
                  fontSize: 14,
                  marginBottom: 4,
                  color: colors.textSecondary,
                }}>
                  {network.tokens}
                </Text>
                <Text style={{
                  fontSize: 12,
                  color: colors.textMuted,
                }}>
                  Fee: {network.fee}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* QR Code */}
        <View style={{
          alignItems: 'center',
          padding: 24,
          borderRadius: 16,
          marginBottom: 24,
          backgroundColor: colors.card,
        }}>
          <View style={{
            width: 176,
            height: 176,
            backgroundColor: '#FFFFFF',
            padding: 8,
            borderRadius: 12,
            marginBottom: 16,
          }}>
            <Image
              source={{
                uri: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${walletAddress}`,
              }}
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
              backgroundColor: isDarkColorScheme ? colors.background : colors.muted,
            }}
          >
            <Text style={{
              flex: 1,
              fontFamily: 'monospace',
              fontSize: 14,
              color: colors.textPrimary,
            }} numberOfLines={1}>
              {walletAddress.slice(0, 10)}...{walletAddress.slice(-8)}
            </Text>
            <TouchableOpacity onPress={handleCopyAddress} style={{ marginLeft: 12 }}>
              <MaterialIcons name="content-copy" size={20} color={colors.primary} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={{ marginTop: 12 }}>
            <Text style={{ color: colors.primary, fontSize: 14, fontWeight: 'bold' }}>
              View on Explorer →
            </Text>
          </TouchableOpacity>
        </View>

        {/* Warning */}
        <View style={{
          padding: 16,
          borderRadius: 16,
          marginBottom: 24,
          backgroundColor: isDarkColorScheme ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.05)',
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
            <MaterialIcons name="warning" size={20} color={colors.destructive} />
            <Text style={{
              flex: 1,
              marginLeft: 12,
              fontSize: 14,
              lineHeight: 20,
              color: isDarkColorScheme ? 'rgba(248, 113, 113, 1)' : 'rgba(220, 38, 38, 1)',
            }}>
              Send only supported tokens on the selected chain. Deposits are confirmed after 1 network confirmation.
              Sending unsupported tokens may result in permanent loss.
            </Text>
          </View>
        </View>

        {/* Status */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            padding: 16,
            borderRadius: 16,
            backgroundColor: colors.card,
          }}
        >
          <View style={{
            width: 8,
            height: 8,
            borderRadius: 9999,
            backgroundColor: colors.primary,
            marginRight: 12,
          }} />
          <Text style={{ color: colors.primary, fontWeight: '500' }}>Connected</Text>
          <View style={{ flex: 1 }} />
          <Text style={{ color: colors.textSecondary }}>
            Awaiting deposit...
          </Text>
        </View>

        <View style={{ height: 128 }} />
      </ScrollView>
    </View>
  );
}

