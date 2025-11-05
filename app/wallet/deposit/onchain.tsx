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
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useColorScheme } from '@/lib/useColorScheme';
import * as Clipboard from 'expo-clipboard';

export default function OnChainDepositScreen() {
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [selectedNetwork, setSelectedNetwork] = useState('polygon');

  const walletAddress = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0';

  const networks = [
    {
      id: 'polygon',
      name: 'Polygon',
      icon: 'https://cryptologos.cc/logos/polygon-matic-logo.png',
      tokens: 'USDC / MATIC',
      fee: 'Low',
    },
    {
      id: 'bnb',
      name: 'BNB Chain',
      icon: 'https://cryptologos.cc/logos/bnb-bnb-logo.png',
      tokens: 'USDC / BNB',
      fee: 'Low',
    },
    {
      id: 'ethereum',
      name: 'Ethereum',
      icon: 'https://cryptologos.cc/logos/ethereum-eth-logo.png',
      tokens: 'USDC / ETH',
      fee: 'High',
    },
  ];

  const handleCopyAddress = async () => {
    await Clipboard.setStringAsync(walletAddress);
    Alert.alert('Copied!', 'Wallet address copied to clipboard');
  };

  return (
    <View className={`flex-1 ${isDark ? 'bg-blocks-bg-dark' : 'bg-blocks-bg-light'}`}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View
        className={`px-4 pt-12 pb-4 ${isDark ? 'bg-blocks-bg-dark/80' : 'bg-blocks-bg-light/80'}`}
        style={{ paddingTop: StatusBar.currentHeight ? StatusBar.currentHeight + 16 : 48 }}
      >
        <View className="flex-row items-center justify-between">
          <TouchableOpacity
            onPress={() => router.back()}
            className={`w-10 h-10 rounded-full items-center justify-center ${
              isDark ? 'bg-blocks-card-dark/60' : 'bg-gray-200'
            }`}
          >
            <MaterialIcons name="arrow-back" size={24} color={isDark ? '#E0E0E0' : '#1F2937'} />
          </TouchableOpacity>
          <Text className={`text-lg font-bold ${isDark ? 'text-blocks-text-dark' : 'text-blocks-text-light'}`}>
            On-Chain Deposit
          </Text>
          <View className="w-10 h-10" />
        </View>
      </View>

      <ScrollView className="flex-1 px-4 pt-4" showsVerticalScrollIndicator={false}>
        <Text className={`text-center mb-6 ${isDark ? 'text-blocks-text-dark-secondary' : 'text-blocks-text-secondary'}`}>
          Send USDC or supported tokens to your wallet
        </Text>

        {/* Network Selection */}
        <Text className={`text-base font-bold mb-3 ${isDark ? 'text-blocks-text-dark' : 'text-blocks-text-light'}`}>
          Select Network
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-6">
          <View className="flex-row gap-3">
            {networks.map((network) => (
              <TouchableOpacity
                key={network.id}
                onPress={() => setSelectedNetwork(network.id)}
                className={`w-40 p-4 rounded-2xl ${
                  selectedNetwork === network.id
                    ? isDark
                      ? 'bg-blocks-card-dark border-2 border-teal'
                      : 'bg-white border-2 border-teal'
                    : isDark
                    ? 'bg-blocks-card-dark/50'
                    : 'bg-gray-100'
                }`}
              >
                <View className="flex-row items-center mb-2">
                  <View className="w-6 h-6 rounded-full bg-white items-center justify-center">
                    <Text className="text-xs">🔗</Text>
                  </View>
                  <Text className={`ml-2 font-bold ${isDark ? 'text-blocks-text-dark' : 'text-blocks-text-light'}`}>
                    {network.name}
                  </Text>
                </View>
                <Text className={`text-sm mb-1 ${isDark ? 'text-blocks-text-dark-secondary' : 'text-blocks-text-secondary'}`}>
                  {network.tokens}
                </Text>
                <Text className={`text-xs ${isDark ? 'text-blocks-text-dark-secondary' : 'text-blocks-text-secondary'}`}>
                  Fee: {network.fee}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* QR Code */}
        <View className={`items-center p-6 rounded-2xl mb-6 ${isDark ? 'bg-blocks-card-dark' : 'bg-white'}`}>
          <View className="w-44 h-44 bg-white p-2 rounded-xl mb-4">
            <Image
              source={{
                uri: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${walletAddress}`,
              }}
              className="w-full h-full"
              resizeMode="contain"
            />
          </View>

          {/* Wallet Address */}
          <View
            className={`w-full flex-row items-center justify-between p-3 rounded-xl ${
              isDark ? 'bg-blocks-bg-dark' : 'bg-gray-100'
            }`}
          >
            <Text className={`flex-1 font-mono text-sm ${isDark ? 'text-blocks-text-dark' : 'text-blocks-text-light'}`} numberOfLines={1}>
              {walletAddress.slice(0, 10)}...{walletAddress.slice(-8)}
            </Text>
            <TouchableOpacity onPress={handleCopyAddress} className="ml-3">
              <MaterialIcons name="content-copy" size={20} color="#0fa0bd" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity className="mt-3">
            <Text className="text-teal text-sm font-bold">View on Explorer →</Text>
          </TouchableOpacity>
        </View>

        {/* Warning */}
        <View className={`p-4 rounded-2xl mb-6 ${isDark ? 'bg-red-500/10' : 'bg-red-50'}`}>
          <View className="flex-row items-start">
            <MaterialIcons name="warning" size={20} color="#EF4444" />
            <Text className={`flex-1 ml-3 text-sm leading-relaxed ${isDark ? 'text-red-400' : 'text-red-600'}`}>
              Send only supported tokens on the selected chain. Deposits are confirmed after 1 network confirmation.
              Sending unsupported tokens may result in permanent loss.
            </Text>
          </View>
        </View>

        {/* Status */}
        <View
          className={`flex-row items-center p-4 rounded-2xl ${isDark ? 'bg-blocks-card-dark' : 'bg-white'}`}
        >
          <View className="w-2 h-2 rounded-full bg-green-500 mr-3" />
          <Text className="text-green-500 font-medium">Connected</Text>
          <View className="flex-1" />
          <Text className={isDark ? 'text-blocks-text-dark-secondary' : 'text-blocks-text-secondary'}>
            Awaiting deposit...
          </Text>
        </View>

        <View className="h-32" />
      </ScrollView>
    </View>
  );
}

