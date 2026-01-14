import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useColorScheme } from '@/lib/useColorScheme';
import { useWalletConnect } from '@/src/wallet/WalletConnectProvider';
import { useApp } from '@/contexts/AppContext';
import { LinearGradient } from 'expo-linear-gradient';

export default function CryptoPaymentScreen() {
  const router = useRouter();
  const { colors, isDarkColorScheme } = useColorScheme();
  const { isConnected, address, provider } = useWalletConnect();
  const { invest } = useApp();
  
  const params = useLocalSearchParams<{
    tokenCount: string;
    totalAmount: string;
    transactionFee: string;
    totalInvestment: string;
    propertyTitle: string;
    propertyId: string;
    tokenId?: string;
    tokenName?: string;
    tokenSymbol?: string;
    tokenPrice: string;
    adminAddress: string;
  }>();

  const [sending, setSending] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [txConfirmed, setTxConfirmed] = useState(false);
  const [isLocalTestnet, setIsLocalTestnet] = useState(false);
  const [ethAmount, setEthAmount] = useState(0);

  const tokenCount = parseFloat(params.tokenCount || '0');
  const totalInvestment = parseFloat(params.totalInvestment || '0');
  const adminAddress = params.adminAddress || '0x7E92A4257904d19006b669028e2B2C5fa30fc12f';

  // Local testnet RPC URL (Ganache)
  const TESTNET_RPC_URL = 'http://192.168.1.142:7545';
  
  // Detect network type on mount and when provider changes
  useEffect(() => {
    const detectNetwork = async () => {
      if (provider) {
        try {
          const chainId = await provider.request({ method: 'eth_chainId' });
          // Local testnet Chain ID is 1337 (0x539) - Geth/Ganache default
          // Chain ID comes as hex string (e.g., "0x539") or sometimes as number
          const chainIdDecimal = typeof chainId === 'string' && chainId.startsWith('0x')
            ? parseInt(chainId, 16)  // Parse hex string
            : parseInt(chainId.toString(), 10); // Parse as decimal if already a number
          const isLocal = chainIdDecimal === 1337 || chainId === '0x539' || chainId === '1337';
          
          // Always use local testnet for this app (user requirement)
          setIsLocalTestnet(true);
          
          // Calculate ETH amount - always 1:1 for local testnet
          setEthAmount(totalInvestment);
          
          console.log('[Crypto Payment] Network detected:', { 
            chainId, 
            chainIdDecimal,
            isLocal, 
            ethAmt: totalInvestment,
            expectedForLocal: '0x539 (1337)'
          });
        } catch (error) {
          console.warn('[Crypto Payment] Error detecting network:', error);
          // Default to local testnet if detection fails (since user wants local)
          setIsLocalTestnet(true);
          setEthAmount(totalInvestment);
        }
      }
    };
    
    detectNetwork();
    
    // Also listen for chain changes
    if (provider && provider.on) {
      const handleChainChanged = (chainId: string) => {
        console.log('[Crypto Payment] Chain changed:', chainId);
        detectNetwork();
      };
      
      provider.on('chainChanged', handleChainChanged);
      
      return () => {
        if (provider.removeListener) {
          provider.removeListener('chainChanged', handleChainChanged);
        }
      };
    }
  }, [provider, totalInvestment]);

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
          Please connect your wallet to proceed with payment
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

  const handleSendPayment = async () => {
    try {
      setSending(true);

      // Use detected network type and ETH amount
      const finalEthAmount = ethAmount || (isLocalTestnet ? totalInvestment : totalInvestment / 2000);

      // Convert ETH to wei (1 ETH = 10^18 wei)
      const amountInWei = BigInt(Math.floor(finalEthAmount * 1e18)).toString(16);
      const value = `0x${amountInWei}`;

      console.log('[Crypto Payment] Sending payment:', {
        from: address,
        to: adminAddress,
        ethAmount: finalEthAmount,
        value,
        totalInvestment,
        isLocalTestnet,
      });

      // Check wallet balance first using local RPC (same as wallet.tsx)
      const balanceResponse = await fetch(TESTNET_RPC_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_getBalance',
          params: [address, 'latest'],
          id: 1,
        }),
      });
      
      const balanceData = await balanceResponse.json();
      if (balanceData.error) {
        throw new Error(balanceData.error.message || 'Failed to fetch balance');
      }
      
      const balanceHex = balanceData.result;
      const balanceWei = BigInt(balanceHex);
      const requiredWei = BigInt(value);

      console.log('[Crypto Payment] Balance from local RPC:', {
        balanceHex,
        balanceWei: balanceWei.toString(),
        balanceETH: (Number(balanceWei) / 1e18).toFixed(6),
      });

      // For local testnet, use local RPC for all transaction parameters
      let gasPrice: string;
      let gasLimit: string;
      let nonce: string;

      if (isLocalTestnet) {
        // Use local RPC for all parameters
        console.log('[Crypto Payment] Using local RPC for transaction parameters');
        
        // Get gas price from local RPC
        const gasPriceResponse = await fetch(TESTNET_RPC_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'eth_gasPrice',
            params: [],
            id: 2,
          }),
        });
        const gasPriceData = await gasPriceResponse.json();
        gasPrice = gasPriceData.result || '0x4a817c800'; // Default 20 gwei if failed
        console.log('[Crypto Payment] Gas price from local RPC:', gasPrice);

        // Estimate gas from local RPC
        gasLimit = '0x5208'; // Default 21000
        try {
          const gasEstimateResponse = await fetch(TESTNET_RPC_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              jsonrpc: '2.0',
              method: 'eth_estimateGas',
              params: [{
                from: address,
                to: adminAddress,
                value: value,
              }],
              id: 3,
            }),
          });
          const gasEstimateData = await gasEstimateResponse.json();
          if (gasEstimateData.result) {
            gasLimit = gasEstimateData.result;
            console.log('[Crypto Payment] Gas estimate from local RPC:', gasLimit);
          }
        } catch (error) {
          console.warn('[Crypto Payment] Gas estimation from local RPC failed, using default:', error);
        }

        // Get nonce from local RPC
        const nonceResponse = await fetch(TESTNET_RPC_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'eth_getTransactionCount',
            params: [address, 'latest'],
            id: 4,
          }),
        });
        const nonceData = await nonceResponse.json();
        nonce = nonceData.result || '0x0';
        console.log('[Crypto Payment] Nonce from local RPC:', nonce);
      } else {
        // Use WalletConnect provider for mainnet
        gasPrice = await provider.request({ method: 'eth_gasPrice' });
        console.log('[Crypto Payment] Gas price from provider:', gasPrice);

        gasLimit = '0x5208'; // Default 21000
        try {
          const gasEstimate = await provider.request({
            method: 'eth_estimateGas',
            params: [{
              from: address,
              to: adminAddress,
              value: value,
            }],
          });
          gasLimit = gasEstimate;
          console.log('[Crypto Payment] Gas estimate from provider:', gasLimit);
        } catch (error) {
          console.warn('[Crypto Payment] Gas estimation from provider failed, using default:', error);
        }

        nonce = await provider.request({
          method: 'eth_getTransactionCount',
          params: [address, 'latest'],
        });
        console.log('[Crypto Payment] Nonce from provider:', nonce);
      }

      // Calculate total required (amount + gas fees)
      const gasPriceBigInt = BigInt(gasPrice);
      const gasLimitBigInt = BigInt(gasLimit);
      const gasCost = gasPriceBigInt * gasLimitBigInt;
      const totalRequired = requiredWei + gasCost;

      console.log('[Crypto Payment] Balance check:', {
        balanceHex,
        balanceWei: balanceWei.toString(),
        requiredWei: requiredWei.toString(),
        gasCost: gasCost.toString(),
        totalRequired: totalRequired.toString(),
        balanceETH: (Number(balanceWei) / 1e18).toFixed(6),
        requiredETH: (Number(totalRequired) / 1e18).toFixed(6),
      });

      // Check if balance is sufficient
      if (balanceWei < totalRequired) {
        const shortfall = totalRequired - balanceWei;
        const shortfallETH = (Number(shortfall) / 1e18).toFixed(6);
        const balanceETH = (Number(balanceWei) / 1e18).toFixed(6);
        const requiredETH = (Number(totalRequired) / 1e18).toFixed(6);
        
        setSending(false);
        Alert.alert(
          'Insufficient Balance',
          `Your wallet balance is insufficient.\n\n` +
          `Balance: ${balanceETH} ETH\n` +
          `Required: ${requiredETH} ETH\n` +
          `Shortfall: ${shortfallETH} ETH\n\n` +
          `Please add more ETH to your wallet to complete this payment.`,
          [{ text: 'OK' }]
        );
        return;
      }

      // Prepare transaction
      const transaction = {
        from: address,
        to: adminAddress,
        value: value,
        gas: gasLimit,
        gasPrice: gasPrice,
        nonce: nonce,
      };

      // Verify chain ID before sending - always expect local testnet (1337)
      const currentChainId = await provider.request({ method: 'eth_chainId' });
      // Parse chain ID correctly - it comes as hex string (0x539) or sometimes as number
      const currentChainIdDecimal = typeof currentChainId === 'string' && currentChainId.startsWith('0x')
        ? parseInt(currentChainId, 16)  // Parse hex string
        : parseInt(currentChainId.toString(), 10); // Parse as decimal if already a number
      const expectedChainId = '0x539'; // Always expect local testnet (1337)
      const expectedChainIdDecimal = 1337;
      
      // Also check if it matches as hex string or decimal string
      const chainIdMatches = currentChainId === expectedChainId || 
                             currentChainId === '1337' || 
                             currentChainIdDecimal === 1337;
      
      console.log('[Crypto Payment] Network verification:', {
        currentChainId,
        currentChainIdType: typeof currentChainId,
        currentChainIdDecimal,
        expectedChainId,
        expectedChainIdDecimal,
        isLocalTestnet,
        matches: chainIdMatches,
      });
      
      // Since balance check passed and we're using local RPC, proceed with transaction
      // MetaMask will handle the network check and show error if wrong network
      // But we'll log a warning if chain ID doesn't match
      if (!chainIdMatches) {
        console.warn('[Crypto Payment] Chain ID mismatch, but proceeding since balance check passed:', {
          currentChainId,
          currentChainIdDecimal,
          expectedChainId,
          expectedChainIdDecimal,
        });
        // Don't block - let MetaMask handle it, but try to switch if possible
        if (currentChainIdDecimal !== 1337) {
          try {
            // Try to switch network (non-blocking)
            await provider.request({
              method: 'wallet_switchEthereumChain',
              params: [{ chainId: '0x539' }],
            }).catch(() => {
              // If switch fails, continue anyway - MetaMask will show error if needed
              console.warn('[Crypto Payment] Network switch failed, but continuing');
            });
          } catch (e) {
            // Continue anyway
            console.warn('[Crypto Payment] Network switch error (non-blocking):', e);
          }
        }
      }

      console.log('[Crypto Payment] Transaction prepared:', {
        ...transaction,
        valueETH: (Number(BigInt(value)) / Number(BigInt('1000000000000000000'))).toFixed(6),
        gasLimitDecimal: parseInt(gasLimit, 16),
        gasPriceDecimal: parseInt(gasPrice, 16),
        nonceDecimal: parseInt(nonce, 16),
        isLocalTestnet,
        chainId: currentChainId,
      });

      // Send transaction via WalletConnect (MetaMask will handle signing)
      // Even for local testnet, we need WalletConnect to sign the transaction
      // The transaction parameters are correct, MetaMask will use them
      const hash = await provider.request({
        method: 'eth_sendTransaction',
        params: [transaction],
      });

      console.log('[Crypto Payment] Transaction hash:', hash);
      setTxHash(hash);

      // Wait for transaction confirmation (polling)
      await waitForTransactionConfirmation(hash);

      // Transaction confirmed, complete the investment
      await completeInvestment(hash);

    } catch (error: any) {
      console.error('[Crypto Payment] Transaction error:', error);
      setSending(false);
      
      let errorMessage = 'Failed to send payment';
      if (error?.code === 4001) {
        errorMessage = 'Transaction rejected by user';
      } else if (error?.code === -32000 || error?.message?.includes('insufficient funds')) {
        errorMessage = 'Insufficient balance. Please ensure you have enough ETH to cover the payment amount and gas fees.';
      } else if (error?.message) {
        errorMessage = error.message;
      }

      Alert.alert('Payment Failed', errorMessage, [{ text: 'OK' }]);
    }
  };

  const waitForTransactionConfirmation = async (hash: string) => {
    // Poll for transaction receipt
    let confirmed = false;
    let attempts = 0;
    const maxAttempts = 60; // 5 minutes max wait

    while (!confirmed && attempts < maxAttempts) {
      try {
        const receipt = await provider.request({
          method: 'eth_getTransactionReceipt',
          params: [hash],
        });

        if (receipt && receipt.status === '0x1') {
          confirmed = true;
          setTxConfirmed(true);
          console.log('[Crypto Payment] Transaction confirmed:', receipt);
          break;
        }
      } catch (error) {
        console.warn('[Crypto Payment] Error checking receipt:', error);
      }

      attempts++;
      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds between checks
    }

    if (!confirmed) {
      throw new Error('Transaction confirmation timeout');
    }
  };

  const completeInvestment = async (txHash: string) => {
    try {
      // Call backend to complete investment with crypto payment
      // The backend should verify the transaction and complete the purchase
      const propertyId = params.propertyId;
      const tokenId = params.tokenId;

      // For now, we'll call the invest function
      // In production, you'd call a backend endpoint that verifies the crypto payment
      // invest function signature: invest(amount, propertyId, tokenCount, propertyTokenId?)
      await invest(totalInvestment, propertyId, tokenCount, tokenId);

      Alert.alert(
        'Payment Successful!',
        `Your payment has been confirmed.\n\nTransaction: ${txHash.slice(0, 10)}...${txHash.slice(-8)}\n\nYour investment is being processed.`,
        [
          {
            text: 'OK',
            onPress: () => {
              router.replace({
                pathname: `/invest/${propertyId}/confirm` as any,
                params: {
                  tokenCount: tokenCount.toString(),
                  totalAmount: params.totalAmount,
                  totalInvestment: params.totalInvestment,
                  propertyTitle: params.propertyTitle,
                },
              } as any);
            },
          },
        ]
      );
    } catch (error: any) {
      console.error('[Crypto Payment] Error completing investment:', error);
      Alert.alert(
        'Payment Sent',
        `Your payment was sent successfully, but there was an error processing the investment.\n\nTransaction: ${txHash}\n\nPlease contact support with this transaction hash.`,
        [{ text: 'OK' }]
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <LinearGradient colors={['#064E3B', '#022C22', '#000']} style={{ flex: 1 }}>
      <StatusBar barStyle="light-content" />
      
      {/* Header */}
      <View style={{ paddingHorizontal: 16, paddingTop: StatusBar.currentHeight ? StatusBar.currentHeight + 16 : 48, paddingBottom: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>Crypto Payment</Text>
          <View style={{ width: 40 }} />
        </View>
      </View>

      <ScrollView style={{ flex: 1, paddingHorizontal: 16, paddingTop: 24 }}>
        {/* Payment Summary */}
        <View style={{ backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 16, padding: 20, marginBottom: 24 }}>
          <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, marginBottom: 8 }}>Property</Text>
          <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 16 }}>
            {params.propertyTitle}
          </Text>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
            <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14 }}>Tokens</Text>
            <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600' }}>{tokenCount.toFixed(2)}</Text>
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
            <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14 }}>Amount</Text>
            <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600' }}>${params.totalAmount}</Text>
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
            <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14 }}>Fee</Text>
            <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600' }}>${params.transactionFee}</Text>
          </View>

          <View style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.1)', marginVertical: 12 }} />

          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>Total</Text>
            <Text style={{ color: '#10B981', fontSize: 18, fontWeight: 'bold' }}>${params.totalInvestment}</Text>
          </View>
        </View>

        {/* Payment Details */}
        <View style={{ backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 16, padding: 20, marginBottom: 24 }}>
          <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold', marginBottom: 16 }}>Payment Details</Text>
          
          <View style={{ marginBottom: 12 }}>
            <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, marginBottom: 4 }}>From</Text>
            <Text style={{ color: '#fff', fontSize: 14, fontFamily: 'monospace' }}>
              {address}
            </Text>
          </View>

          <View style={{ marginBottom: 12 }}>
            <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, marginBottom: 4 }}>To (Admin)</Text>
            <Text style={{ color: '#fff', fontSize: 14, fontFamily: 'monospace' }}>
              {adminAddress}
            </Text>
          </View>

          <View>
            <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, marginBottom: 4 }}>Amount (ETH)</Text>
            <Text style={{ color: '#10B981', fontSize: 16, fontWeight: 'bold' }}>
              {isLocalTestnet 
                ? `${(ethAmount || totalInvestment).toFixed(6)} ETH (Testnet)`
                : `~${((ethAmount || totalInvestment / 2000)).toFixed(6)} ETH`}
            </Text>
            <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, marginTop: 4 }}>
              {isLocalTestnet 
                ? '* Using 1:1 conversion for local testnet (1 USD = 1 ETH)'
                : '* ETH price may vary. Actual amount will be calculated at transaction time.'}
            </Text>
          </View>
        </View>

        {/* Transaction Status */}
        {txHash && (
          <View style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', borderRadius: 16, padding: 20, marginBottom: 24, borderWidth: 1, borderColor: '#10B981' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
              <Ionicons name="checkmark-circle" size={24} color="#10B981" />
              <Text style={{ color: '#10B981', fontSize: 16, fontWeight: 'bold', marginLeft: 8 }}>
                {txConfirmed ? 'Transaction Confirmed' : 'Transaction Sent'}
              </Text>
            </View>
            <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, fontFamily: 'monospace', marginTop: 8 }}>
              {txHash}
            </Text>
            {!txConfirmed && (
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12 }}>
                <ActivityIndicator size="small" color="#10B981" />
                <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, marginLeft: 8 }}>
                  Waiting for confirmation...
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Send Payment Button */}
        {!txHash && (
          <TouchableOpacity
            onPress={handleSendPayment}
            disabled={sending}
            style={{
              backgroundColor: sending ? 'rgba(16, 185, 129, 0.5)' : '#10B981',
              borderRadius: 12,
              padding: 16,
              alignItems: 'center',
              marginBottom: 24,
              opacity: sending ? 0.7 : 1,
            }}
          >
            {sending ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' }}>
                Send Payment
              </Text>
            )}
          </TouchableOpacity>
        )}

        {/* Info */}
        <View style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', borderRadius: 12, padding: 16, marginBottom: 24 }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
            <Ionicons name="information-circle" size={20} color="#3B82F6" />
            <Text style={{
              flex: 1,
              marginLeft: 12,
              fontSize: 14,
              lineHeight: 20,
              color: 'rgba(255,255,255,0.8)',
            }}>
              Your payment will be sent to the admin address. Once the transaction is confirmed on the blockchain, your investment will be processed automatically.
            </Text>
          </View>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </LinearGradient>
  );
}
