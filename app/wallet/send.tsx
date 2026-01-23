import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useColorScheme } from '@/lib/useColorScheme';
import { useWalletConnect } from '@/src/wallet/WalletConnectProvider';
import { LinearGradient } from 'expo-linear-gradient';
import EmeraldLoader from '@/components/EmeraldLoader';

export default function SendScreen() {
  const router = useRouter();
  const { colors, isDarkColorScheme } = useColorScheme();
  const { isConnected, address, provider } = useWalletConnect();
  
  const [recipientAddress, setRecipientAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [sending, setSending] = useState(false);

  // Check if wallet is connected
  if (!isConnected || !address || !provider) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
        <StatusBar barStyle={isDarkColorScheme ? 'light-content' : 'dark-content'} />
        <MaterialIcons name="account-balance-wallet" size={64} color={colors.textMuted} />
        <Text style={{ color: colors.textPrimary, fontSize: 18, fontWeight: 'bold', marginTop: 16, textAlign: 'center' }}>
          Wallet Not Connected
        </Text>
        <Text style={{ color: colors.textSecondary, fontSize: 14, marginTop: 8, textAlign: 'center' }}>
          Please connect your wallet to send payments
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

  const handleSend = async () => {
    // Validate inputs
    if (!recipientAddress.trim()) {
      Alert.alert('Error', 'Please enter recipient address');
      return;
    }

    if (!recipientAddress.startsWith('0x') || recipientAddress.length !== 42) {
      Alert.alert('Error', 'Please enter a valid Ethereum address');
      return;
    }

    const amountNum = parseFloat(amount);
    if (!amount || isNaN(amountNum) || amountNum <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    try {
      setSending(true);

      // Get current network/chain ID
      const chainId = await provider.request({ method: 'eth_chainId' });
      console.log('[Send] Current chain ID:', chainId);

      // Convert amount to wei (ETH) - 1 ETH = 10^18 wei
      const amountInWei = (amountNum * 1e18).toString(16);
      const value = `0x${amountInWei}`;

      // Estimate gas (optional but recommended)
      let gasLimit = '0x5208'; // Default 21000 for simple ETH transfer
      try {
        const gasEstimate = await provider.request({
          method: 'eth_estimateGas',
          params: [{
            from: address,
            to: recipientAddress,
            value: value,
          }],
        });
        gasLimit = gasEstimate;
        console.log('[Send] Gas estimate:', gasLimit);
      } catch (error) {
        console.warn('[Send] Gas estimation failed, using default:', error);
      }

      // Get gas price
      let gasPrice = '0x0';
      try {
        gasPrice = await provider.request({ method: 'eth_gasPrice' });
        console.log('[Send] Gas price:', gasPrice);
      } catch (error) {
        console.warn('[Send] Gas price fetch failed:', error);
      }

      // Get nonce
      let nonce = '0x0';
      try {
        nonce = await provider.request({
          method: 'eth_getTransactionCount',
          params: [address, 'latest'],
        });
        console.log('[Send] Nonce:', nonce);
      } catch (error) {
        console.warn('[Send] Nonce fetch failed:', error);
      }

      // Prepare transaction
      const transaction = {
        from: address,
        to: recipientAddress,
        value: value,
        gas: gasLimit,
        gasPrice: gasPrice,
        nonce: nonce,
      };

      console.log('[Send] Sending transaction:', transaction);

      // Send transaction via WalletConnect
      const txHash = await provider.request({
        method: 'eth_sendTransaction',
        params: [transaction],
      });

      console.log('[Send] Transaction hash:', txHash);

      Alert.alert(
        'Transaction Sent!',
        `Transaction submitted successfully.\n\nTx Hash: ${txHash.slice(0, 10)}...${txHash.slice(-8)}\n\nAmount: ${amount} ETH`,
        [
          {
            text: 'View on Explorer',
            onPress: () => {
              // Open blockchain explorer
              const explorerUrl = chainId === '0x1' || chainId === '0x1'
                ? `https://etherscan.io/tx/${txHash}`
                : `https://sepolia.etherscan.io/tx/${txHash}`;
              // You can use Linking.openURL(explorerUrl) here
            },
          },
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );

      // Clear form
      setRecipientAddress('');
      setAmount('');
    } catch (error: any) {
      console.error('[Send] Transaction error:', error);
      
      let errorMessage = 'Failed to send transaction';
      if (error?.message) {
        errorMessage = error.message;
      } else if (error?.code === 4001) {
        errorMessage = 'Transaction rejected by user';
      } else if (error?.code === -32603) {
        errorMessage = 'Transaction failed. Please check your balance and try again.';
      }

      Alert.alert('Transaction Failed', errorMessage);
    } finally {
      setSending(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
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
            Send Payment
          </Text>
          <View style={{ width: 40, height: 40 }} />
        </View>
      </View>

      <ScrollView style={{ flex: 1, paddingHorizontal: 16, paddingTop: 24 }} showsVerticalScrollIndicator={false}>
        {/* Connected Wallet Info */}
        <View
          style={{
            padding: 16,
            borderRadius: 16,
            marginBottom: 24,
            backgroundColor: colors.card,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <Text style={{ color: colors.textSecondary, fontSize: 12, marginBottom: 8 }}>
            From Wallet
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ color: colors.textPrimary, fontSize: 14, fontFamily: 'monospace' }}>
              {address.slice(0, 6)}...{address.slice(-4)}
            </Text>
            <View
              style={{
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderRadius: 8,
                backgroundColor: colors.primary + '20',
              }}
            >
              <Text style={{ color: colors.primary, fontSize: 12, fontWeight: '600' }}>
                Connected
              </Text>
            </View>
          </View>
        </View>

        {/* Recipient Address */}
        <View style={{ marginBottom: 24 }}>
          <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: 'bold', marginBottom: 12 }}>
            Recipient Address
          </Text>
          <TextInput
            value={recipientAddress}
            onChangeText={setRecipientAddress}
            placeholder="0x..."
            placeholderTextColor={colors.textMuted}
            style={{
              backgroundColor: colors.card,
              borderRadius: 12,
              padding: 16,
              color: colors.textPrimary,
              fontSize: 16,
              fontFamily: 'monospace',
              borderWidth: 1,
              borderColor: colors.border,
            }}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        {/* Amount */}
        <View style={{ marginBottom: 24 }}>
          <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: 'bold', marginBottom: 12 }}>
            Amount (ETH)
          </Text>
          <View
            style={{
              backgroundColor: colors.card,
              borderRadius: 12,
              padding: 16,
              borderWidth: 1,
              borderColor: colors.border,
              flexDirection: 'row',
              alignItems: 'center',
            }}
          >
            <TextInput
              value={amount}
              onChangeText={setAmount}
              placeholder="0.0"
              placeholderTextColor={colors.textMuted}
              style={{
                flex: 1,
                color: colors.textPrimary,
                fontSize: 24,
                fontWeight: '600',
              }}
              keyboardType="decimal-pad"
            />
            <Text style={{ color: colors.textSecondary, fontSize: 16, marginLeft: 8 }}>
              ETH
            </Text>
          </View>
        </View>

        {/* Send Button */}
        <TouchableOpacity
          onPress={handleSend}
          disabled={sending || !recipientAddress.trim() || !amount}
          style={{
            backgroundColor: sending || !recipientAddress.trim() || !amount
              ? colors.muted
              : colors.primary,
            borderRadius: 12,
            padding: 16,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 24,
            opacity: sending || !recipientAddress.trim() || !amount ? 0.5 : 1,
          }}
        >
          {sending ? (
            <EmeraldLoader />
          ) : (
            <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' }}>
              Send Payment
            </Text>
          )}
        </TouchableOpacity>

        {/* Info */}
        <View
          style={{
            padding: 16,
            borderRadius: 12,
            backgroundColor: isDarkColorScheme ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.05)',
            marginBottom: 24,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
            <MaterialIcons name="info" size={20} color={colors.primary} />
            <Text style={{
              flex: 1,
              marginLeft: 12,
              fontSize: 14,
              lineHeight: 20,
              color: colors.textSecondary,
            }}>
              Transactions are processed on the blockchain. Please ensure you have sufficient balance for gas fees.
              The transaction will be confirmed in your connected wallet.
            </Text>
          </View>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
