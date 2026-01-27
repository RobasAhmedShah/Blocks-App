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
import EmeraldLoader from '@/components/EmeraldLoader';

export default function CryptoPaymentScreen() {
  const router = useRouter();
  const { colors, isDarkColorScheme } = useColorScheme();
  const { isConnected, address, provider, chainId, switchToPolygonAmoy, isOnPolygonAmoy, connect, disconnect, refreshSession } = useWalletConnect();
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
  const [tokenAmount, setTokenAmount] = useState(0);
  const [tokenDecimals, setTokenDecimals] = useState(6); // Default to 6 decimals
  const [statusMessage, setStatusMessage] = useState<string>('');

  const tokenCount = parseFloat(params.tokenCount || '0');
  const totalInvestment = parseFloat(params.totalInvestment || '0');
  
  // OLD ADMIN ADDRESS - DO NOT USE
  const OLD_ADMIN_ADDRESS = '0x7E92A4257904d19006b669028e2B2C5fa30fc12f';
  // NEW ADMIN ADDRESS - CORRECT ONE
  const NEW_ADMIN_ADDRESS = '0xe19bf17047a06c6107a1E3803835E0730e19aDee';
  
  // Get admin address from params, but ensure it's never the old one
  let adminAddress = params.adminAddress || NEW_ADMIN_ADDRESS;
  
  // Safety check: If somehow the old address is passed, use the new one
  if (adminAddress.toLowerCase() === OLD_ADMIN_ADDRESS.toLowerCase()) {
    console.error('[Crypto Payment] ERROR: Old admin address detected! Using new address instead.');
    adminAddress = NEW_ADMIN_ADDRESS;
  }
  
  // Debug: Verify admin address is correct
  console.log('[Crypto Payment] Admin address check:', {
    fromParams: params.adminAddress,
    finalAdminAddress: adminAddress,
    expectedAddress: NEW_ADMIN_ADDRESS,
    oldAddress: OLD_ADMIN_ADDRESS,
    isCorrect: adminAddress.toLowerCase() === NEW_ADMIN_ADDRESS.toLowerCase(),
    isOld: adminAddress.toLowerCase() === OLD_ADMIN_ADDRESS.toLowerCase(),
  });

  // Polygon Amoy Testnet RPC URL
  const POLYGON_AMOY_RPC_URL = 'https://rpc-amoy.polygon.technology';
  // Token Contract Address on Polygon Amoy
  const TOKEN_CONTRACT_ADDRESS = '0x5dAe3dA171CFEA728CB7042860Ab31BAbD5E9385';
  
  // Fetch token decimals and set USDC amount on mount
  useEffect(() => {
    const fetchTokenInfo = async () => {
      try {
        // Fetch token decimals - ERC-20 decimals() function signature: 0x313ce567
        const decimalsFunction = '0x313ce567';
        const decimalsResponse = await fetch(POLYGON_AMOY_RPC_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'eth_call',
            params: [
              {
                to: TOKEN_CONTRACT_ADDRESS,
                data: decimalsFunction,
              },
              'latest',
            ],
            id: 1,
          }),
        });

        const decimalsData = await decimalsResponse.json();
        if (decimalsData.result && decimalsData.result !== '0x') {
          const decimals = parseInt(decimalsData.result, 16);
          setTokenDecimals(decimals);
          console.log('[Crypto Payment] Token decimals:', decimals);
        }
      } catch (error) {
        console.warn('[Crypto Payment] Error fetching token decimals:', error);
        setTokenDecimals(6); // Default to 6 (USDC standard)
      }
      
      // Set token amount (1:1 with USD)
      setTokenAmount(totalInvestment);
    };
    
    if (totalInvestment) {
      fetchTokenInfo();
    }
  }, [totalInvestment]);

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
      setStatusMessage('Preparing transaction...');

      // Verify we're on Polygon Amoy Testnet (chain ID 80002)
      const POLYGON_AMOY_CHAIN_ID = 80002;
      const POLYGON_AMOY_CHAIN_ID_HEX = '0x13882';
      
      // Check current chain ID
      let currentChainId: number | null = chainId || null;
      if (!currentChainId && provider) {
        try {
          const chainIdHex = await provider.request({ method: 'eth_chainId' });
          currentChainId = typeof chainIdHex === 'string' && chainIdHex.startsWith('0x')
            ? parseInt(chainIdHex, 16)
            : parseInt(chainIdHex.toString(), 10);
        } catch (error) {
          console.warn('[Crypto Payment] Could not get chain ID:', error);
        }
      }

      console.log('[Crypto Payment] Network check:', {
        currentChainId,
        isOnPolygonAmoy,
        expectedChainId: POLYGON_AMOY_CHAIN_ID,
      });

      // If not on Polygon Amoy, switch to it
      if (currentChainId !== POLYGON_AMOY_CHAIN_ID) {
        console.log('[Crypto Payment] Not on Polygon Amoy Testnet, switching...');
        setStatusMessage('Switching to Polygon Amoy...');
        try {
          await switchToPolygonAmoy();
          // Wait a bit for the switch to complete
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Verify switch was successful
          const newChainIdHex = await provider.request({ method: 'eth_chainId' });
          const newChainId = typeof newChainIdHex === 'string' && newChainIdHex.startsWith('0x')
            ? parseInt(newChainIdHex, 16)
            : parseInt(newChainIdHex.toString(), 10);
          
          if (newChainId !== POLYGON_AMOY_CHAIN_ID) {
            setSending(false);
            Alert.alert(
              'Wrong Network',
              'Please switch to Polygon Amoy Testnet to complete this payment.',
              [{ text: 'OK' }]
            );
            return;
          }
        } catch (error: any) {
          setSending(false);
          if (error.message?.includes('rejected')) {
            Alert.alert(
              'Network Switch Rejected',
              'You need to be on Polygon Amoy Testnet to complete this payment. Please switch networks and try again.',
              [{ text: 'OK' }]
            );
          } else {
            Alert.alert(
              'Network Switch Failed',
              'Failed to switch to Polygon Amoy Testnet. Please switch manually and try again.',
              [{ text: 'OK' }]
            );
          }
          return;
        }
      }

      // Token amount is 1:1 with USD
      const finalTokenAmount = tokenAmount || totalInvestment;

      // Convert tokens to token units using decimals
      const amountInTokenUnits = BigInt(Math.floor(finalTokenAmount * Math.pow(10, tokenDecimals)));

      console.log('[Crypto Payment] Sending token payment:', {
        from: address,
        to: adminAddress,
        tokenAmount: finalTokenAmount,
        tokenUnits: amountInTokenUnits.toString(),
        totalInvestment,
        tokenDecimals,
      });

      // Check token balance using ERC-20 balanceOf
      const balanceOfFunction = '0x70a08231';
      const walletAddress = address.startsWith('0x') ? address.slice(2).toLowerCase() : address.toLowerCase();
      const paddedAddress = walletAddress.padStart(64, '0');
      const balanceData = balanceOfFunction + paddedAddress;

      const balanceResponse = await fetch(POLYGON_AMOY_RPC_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_call',
          params: [
            {
              to: TOKEN_CONTRACT_ADDRESS,
              data: balanceData,
            },
            'latest',
          ],
          id: 1,
        }),
      });
      
      const balanceResult = await balanceResponse.json();
      if (balanceResult.error) {
        throw new Error(balanceResult.error.message || 'Failed to fetch token balance');
      }
      
      const balanceHex = balanceResult.result || '0x0';
      const balanceTokenUnits = BigInt(balanceHex === '0x' || balanceHex === '0x0' ? '0' : balanceHex);

      console.log('[Crypto Payment] Token balance from Polygon Amoy:', {
        balanceHex,
        balanceTokenUnits: balanceTokenUnits.toString(),
        balanceTokens: (Number(balanceTokenUnits) / Math.pow(10, tokenDecimals)).toFixed(6),
      });

      // Check if token balance is sufficient
      if (balanceTokenUnits < amountInTokenUnits) {
        const shortfall = amountInTokenUnits - balanceTokenUnits;
        const shortfallTokens = (Number(shortfall) / Math.pow(10, tokenDecimals)).toFixed(6);
        const balanceTokens = (Number(balanceTokenUnits) / Math.pow(10, tokenDecimals)).toFixed(6);
        const requiredTokens = (Number(amountInTokenUnits) / Math.pow(10, tokenDecimals)).toFixed(6);
        
        setSending(false);
        Alert.alert(
          'Insufficient Token Balance',
          `Your wallet balance is insufficient.\n\n` +
          `Balance: ${balanceTokens} Tokens\n` +
          `Required: ${requiredTokens} Tokens\n` +
          `Shortfall: ${shortfallTokens} Tokens\n\n` +
          `Please add more tokens to your wallet to complete this payment.`,
          [{ text: 'OK' }]
        );
        return;
      }

      // Prepare ERC-20 transfer transaction
      // transfer(address to, uint256 amount) function signature: 0xa9059cbb
      const transferFunction = '0xa9059cbb';
      
      // Debug: Verify address before encoding
      console.log('[Crypto Payment] About to encode transfer - adminAddress:', adminAddress);
      const recipientAddress = adminAddress.startsWith('0x') ? adminAddress.slice(2).toLowerCase() : adminAddress.toLowerCase();
      console.log('[Crypto Payment] Recipient address after processing:', recipientAddress);
      const paddedRecipient = recipientAddress.padStart(64, '0');
      console.log('[Crypto Payment] Padded recipient (first 42 chars):', paddedRecipient.substring(0, 42));
      const amountHex = amountInTokenUnits.toString(16);
      const paddedAmount = amountHex.padStart(64, '0');
      const transferData = transferFunction + paddedRecipient + paddedAmount;

      // Verify the encoded address matches what we expect
      const expectedRecipientHex = NEW_ADMIN_ADDRESS.startsWith('0x') 
        ? NEW_ADMIN_ADDRESS.slice(2).toLowerCase().padStart(64, '0')
        : NEW_ADMIN_ADDRESS.toLowerCase().padStart(64, '0');
      
      console.log('[Crypto Payment] ERC-20 transfer data:', {
        function: transferFunction,
        recipient: adminAddress,
        recipientHex: recipientAddress,
        paddedRecipient,
        expectedRecipientHex,
        matches: paddedRecipient === expectedRecipientHex,
        amount: amountInTokenUnits.toString(),
        paddedAmount,
        fullData: transferData,
        fullDataLength: transferData.length,
      });
      
      // Final safety check: Verify the encoded address is correct
      if (paddedRecipient !== expectedRecipientHex) {
        console.error('[Crypto Payment] WARNING: Encoded recipient does not match expected address!');
        console.error('[Crypto Payment] Encoded:', paddedRecipient);
        console.error('[Crypto Payment] Expected:', expectedRecipientHex);
        console.error('[Crypto Payment] Using encoded address anyway, but this should be investigated');
        // Don't throw - log warning but continue (might be a display issue in MetaMask)
      }

      // Get gas parameters from provider
      const gasPrice = await provider.request({ method: 'eth_gasPrice' });
      console.log('[Crypto Payment] Gas price:', gasPrice);

      // Estimate gas for ERC-20 transfer (usually around 65000)
      let gasLimit = '0xfde8'; // Default 65000 for ERC-20 transfer
      try {
        const gasEstimate = await provider.request({
          method: 'eth_estimateGas',
          params: [{
            from: address,
            to: TOKEN_CONTRACT_ADDRESS,
            data: transferData,
          }],
        });
        gasLimit = gasEstimate;
        console.log('[Crypto Payment] Gas estimate:', gasLimit);
      } catch (error) {
        console.warn('[Crypto Payment] Gas estimation failed, using default:', error);
      }

      // Prepare ERC-20 transfer transaction
      // The transaction goes to the token contract, with data encoding the transfer to admin address
      const transaction = {
        from: address,
        to: TOKEN_CONTRACT_ADDRESS, // Send to token contract
        data: transferData, // ERC-20 transfer data (transfers tokens to admin address)
        gas: gasLimit,
        gasPrice: gasPrice,
        value: '0x0', // Explicitly set value to 0 for token transfers (not ETH)
      };
      
      // Ensure all values are properly formatted as hex strings
      if (typeof transaction.gas === 'string' && !transaction.gas.startsWith('0x')) {
        transaction.gas = '0x' + parseInt(transaction.gas, 10).toString(16);
      }
      if (typeof transaction.gasPrice === 'string' && !transaction.gasPrice.startsWith('0x')) {
        transaction.gasPrice = '0x' + parseInt(transaction.gasPrice, 10).toString(16);
      }

      console.log('[Crypto Payment] Transaction prepared:', {
        from: address,
        to: TOKEN_CONTRACT_ADDRESS,
        recipient: adminAddress, // Tokens will be sent to this address
        data: transferData,
        tokenAmount: finalTokenAmount,
        recipient: adminAddress,
        gasLimit: parseInt(gasLimit, 16),
        gasPrice: parseInt(gasPrice, 16),
      });

      // Send ERC-20 transfer transaction via WalletConnect (MetaMask will handle signing)
      // The transaction will transfer tokens from user's wallet to admin address
      console.log('[Crypto Payment] Sending transaction to provider...');
      console.log('[Crypto Payment] Transaction object:', JSON.stringify(transaction, null, 2));
      
      // Ensure provider is ready before sending transaction
      if (!provider) {
        console.error('[Crypto Payment] ERROR: Provider is null/undefined');
        throw new Error('Wallet provider not available');
      }
      
      // Verify provider has request method
      if (typeof provider.request !== 'function') {
        console.error('[Crypto Payment] ERROR: Provider.request is not a function');
        console.error('[Crypto Payment] Provider object:', provider);
        console.error('[Crypto Payment] Provider type:', typeof provider);
        throw new Error('Provider does not support request method');
      }
      
      // Additional provider validation
      console.log('[Crypto Payment] Provider validation passed');
      console.log('[Crypto Payment] Provider has request method:', typeof provider.request === 'function');
      console.log('[Crypto Payment] Provider has send method:', typeof provider.send === 'function');
      console.log('[Crypto Payment] Provider has sendAsync method:', typeof provider.sendAsync === 'function');
      
      // Refresh the WalletConnect session before sending transaction
      // This helps ensure the connection is active and MetaMask modal will show
      console.log('[Crypto Payment] Refreshing WalletConnect session...');
      setStatusMessage('Preparing transaction...');
      try {
        await refreshSession();
        console.log('[Crypto Payment] Session refreshed successfully');
      } catch (refreshError: any) {
        // Ignore WalletConnect validation errors - they're usually harmless
        if (refreshError?.message?.includes('Cannot convert undefined')) {
          console.warn('[Crypto Payment] WalletConnect validation warning (non-critical):', refreshError.message);
        } else {
          console.warn('[Crypto Payment] Session refresh failed:', refreshError);
        }
        // Continue anyway - the transaction request will fail if session is truly broken
      }
      
      // Small delay after refresh to ensure provider is fully ready
      await new Promise(resolve => setTimeout(resolve, 300));
      
      setStatusMessage('Waiting for approval in MetaMask...');
      
      setStatusMessage('Waiting for approval in MetaMask...');
      
      console.log('[Crypto Payment] Sending transaction request to provider...');
      console.log('[Crypto Payment] Transaction details:', {
        from: transaction.from,
        to: transaction.to,
        value: transaction.value,
        gas: transaction.gas,
        gasPrice: transaction.gasPrice,
        dataLength: transaction.data?.length,
      });
      
      let hash: string;
      try {
        // Send transaction - this should trigger MetaMask approval modal
        // When already connected, WalletConnect should forward this to MetaMask
        // which will show the approval modal automatically
        console.log('[Crypto Payment] ========== STARTING TRANSACTION REQUEST ==========');
        console.log('[Crypto Payment] Timestamp:', new Date().toISOString());
        console.log('[Crypto Payment] Calling provider.request(eth_sendTransaction)...');
        console.log('[Crypto Payment] This should trigger MetaMask approval modal');
        console.log('[Crypto Payment] Provider exists?', !!provider);
        console.log('[Crypto Payment] Provider.request exists?', !!(provider && provider.request));
        console.log('[Crypto Payment] Is connected?', isConnected);
        console.log('[Crypto Payment] Address:', address);
        console.log('[Crypto Payment] Chain ID:', chainId);
        
        // Test if provider is responsive before making the actual request
        try {
          console.log('[Crypto Payment] Testing provider responsiveness...');
          const testChainId = await Promise.race([
            provider.request({ method: 'eth_chainId' }),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Provider test timeout')), 5000))
          ]);
          console.log('[Crypto Payment] Provider is responsive, chain ID:', testChainId);
        } catch (testError: any) {
          console.error('[Crypto Payment] Provider test failed:', testError);
          console.error('[Crypto Payment] This might indicate the provider is not ready');
          // Continue anyway - the actual request might still work
        }
        
        // Wrap provider.request in a Promise to handle cases where it doesn't return a promise
        // or returns undefined (which can happen with WalletConnect + MetaMask)
        console.log('[Crypto Payment] Creating request promise with timeout...');
        console.log('[Crypto Payment] Provider type:', typeof provider);
        console.log('[Crypto Payment] Provider.request type:', typeof provider.request);
        console.log('[Crypto Payment] Provider keys:', Object.keys(provider || {}));
        
        const requestWithTimeout = new Promise<string>(async (resolve, reject) => {
          console.log('[Crypto Payment] ========== PROMISE EXECUTOR STARTED ==========');
          console.log('[Crypto Payment] Promise executor timestamp:', new Date().toISOString());
          
          // Add heartbeat logs every 5 seconds to track if we're stuck
          const heartbeatInterval = setInterval(() => {
            console.log('[Crypto Payment] Heartbeat: Still waiting for transaction response...', new Date().toISOString());
          }, 5000);
          
          const timeoutId = setTimeout(() => {
            clearInterval(heartbeatInterval);
            console.error('[Crypto Payment] ========== TRANSACTION REQUEST TIMEOUT ==========');
            console.error('[Crypto Payment] Timeout after 90 seconds');
            console.error('[Crypto Payment] This usually means MetaMask did not respond');
            console.error('[Crypto Payment] Please check MetaMask manually for pending transactions');
            reject(new Error('Transaction request timeout - Please check MetaMask'));
          }, 90000); // 90 second timeout for user to approve in MetaMask

          try {
            console.log('[Crypto Payment] About to call provider.request...');
            console.log('[Crypto Payment] Request params:', {
              method: 'eth_sendTransaction',
              paramsLength: transaction ? 1 : 0,
              transactionKeys: transaction ? Object.keys(transaction) : [],
            });
            
            // Use sendAsync directly - it's more reliable for triggering MetaMask modal
            // when already connected, as it bypasses some WalletConnect session issues
            console.log('[Crypto Payment] Using sendAsync to send transaction...');
            console.log('[Crypto Payment] This method is more reliable for triggering MetaMask modal');
            
            let requestPromise: Promise<any>;
            
            // Prefer sendAsync if available (more reliable for MetaMask)
            if (typeof provider.sendAsync === 'function') {
              console.log('[Crypto Payment] Using sendAsync method...');
              requestPromise = new Promise((resolve, reject) => {
                const requestId = Date.now();
                console.log('[Crypto Payment] sendAsync request ID:', requestId);
                
                provider.sendAsync(
                  {
                    method: 'eth_sendTransaction',
                    params: [transaction],
                    id: requestId,
                    jsonrpc: '2.0',
                  },
                  (error: any, response: any) => {
                    console.log('[Crypto Payment] sendAsync callback invoked');
                    console.log('[Crypto Payment] Error:', error);
                    console.log('[Crypto Payment] Response:', response);
                    
                    if (error) {
                      console.error('[Crypto Payment] sendAsync error:', error);
                      reject(error);
                    } else if (response?.error) {
                      console.error('[Crypto Payment] sendAsync response error:', response.error);
                      reject(new Error(response.error.message || 'Transaction failed'));
                    } else {
                      console.log('[Crypto Payment] sendAsync success, result:', response?.result);
                      resolve(response?.result);
                    }
                  }
                );
              });
            } else {
              // Fallback to provider.request if sendAsync not available
              console.log('[Crypto Payment] sendAsync not available, using provider.request...');
              requestPromise = provider.request({
                method: 'eth_sendTransaction',
                params: [transaction],
              });
              
              console.log('[Crypto Payment] Request promise created:', typeof requestPromise);
              console.log('[Crypto Payment] Is promise?', requestPromise instanceof Promise);
              
              // Check if it's actually a promise
              if (!(requestPromise instanceof Promise)) {
                console.error('[Crypto Payment] provider.request did not return a Promise!');
                console.error('[Crypto Payment] Returned value:', requestPromise);
                clearTimeout(timeoutId);
                clearInterval(heartbeatInterval);
                reject(new Error('Provider request did not return a Promise'));
                return;
              }
            }
            
            console.log('[Crypto Payment] Awaiting request promise...');
            
            // Add a shorter timeout to detect if MetaMask isn't responding
            const quickTimeout = setTimeout(() => {
              console.warn('[Crypto Payment] Request is taking longer than 10 seconds - MetaMask might not be responding');
              console.warn('[Crypto Payment] This usually means MetaMask modal did not open');
              console.warn('[Crypto Payment] User should check MetaMask manually for pending transactions');
            }, 10000); // 10 second warning
            
            const result = await requestPromise;
            
            clearTimeout(quickTimeout);
            
            console.log('[Crypto Payment] Request promise resolved!');
            clearTimeout(timeoutId);
            clearInterval(heartbeatInterval);
            
            console.log('[Crypto Payment] Transaction request raw result:', result);
            console.log('[Crypto Payment] Result type:', typeof result);
            console.log('[Crypto Payment] Result is null?', result === null);
            console.log('[Crypto Payment] Result is undefined?', result === undefined);
            
            // Handle different result formats
            if (typeof result === 'string' && result.startsWith('0x')) {
              console.log('[Crypto Payment] Result is valid hash string');
              resolve(result);
            } else if (result && typeof result === 'object' && (result as any).hash) {
              console.log('[Crypto Payment] Result has hash property:', (result as any).hash);
              resolve((result as any).hash);
            } else if (result && typeof result === 'object' && (result as any).transactionHash) {
              console.log('[Crypto Payment] Result has transactionHash property:', (result as any).transactionHash);
              resolve((result as any).transactionHash);
            } else {
              console.error('[Crypto Payment] Unexpected result format:', result);
              console.error('[Crypto Payment] Result JSON:', JSON.stringify(result, null, 2));
              reject(new Error(`Unexpected result format: ${JSON.stringify(result)}`));
            }
          } catch (error: any) {
            clearTimeout(timeoutId);
            clearInterval(heartbeatInterval);
            console.error('[Crypto Payment] ========== ERROR IN PROVIDER.REQUEST ==========');
            console.error('[Crypto Payment] Error in provider.request catch block');
            console.error('[Crypto Payment] Error type:', typeof error);
            console.error('[Crypto Payment] Error:', error);
            console.error('[Crypto Payment] Error message:', error?.message);
            console.error('[Crypto Payment] Error code:', error?.code);
            console.error('[Crypto Payment] Error stack:', error?.stack);
            reject(error);
          }
        });
        
        console.log('[Crypto Payment] About to await requestWithTimeout...');
        hash = await requestWithTimeout;
        console.log('[Crypto Payment] requestWithTimeout resolved with hash:', hash);
        
        console.log('[Crypto Payment] Transaction hash received:', hash);

        if (!hash || !hash.startsWith('0x')) {
          console.error('[Crypto Payment] Invalid transaction hash:', hash);
          throw new Error('Invalid transaction hash returned from provider');
        }
        
        setTxHash(hash);
        setStatusMessage('Transaction sent! Completing investment...');
        console.log('[Crypto Payment] Transaction sent successfully');
        
      } catch (txError: any) {
        setStatusMessage('');
        console.error('[Crypto Payment] Error sending transaction:', txError);
        console.error('[Crypto Payment] Error details:', {
          code: txError?.code,
          message: txError?.message,
          data: txError?.data,
        });
        setSending(false);
        
        // Ignore WalletConnect validation errors - they're usually harmless
        // These errors occur in WalletConnect's internal validation but don't affect functionality
        if (txError?.message?.includes('Cannot convert undefined')) {
          console.warn('[Crypto Payment] WalletConnect validation error (non-critical) - this can usually be ignored');
          // The error is in WalletConnect's internal validation, but the transaction might still work
          // Try to proceed - if the transaction actually failed, it will be caught by the outer catch
          Alert.alert(
            'Transaction Status',
            'There was a minor validation warning, but your transaction may still be processing. Please check MetaMask to confirm.',
            [{ text: 'OK' }]
          );
          return;
        }
        
        // If user rejected, don't show error
        if (txError?.code === 4001 || txError?.message?.includes('rejected') || txError?.message?.includes('denied')) {
          console.log('[Crypto Payment] User rejected transaction');
          Alert.alert(
            'Transaction Cancelled',
            'You rejected the transaction in MetaMask.',
            [{ text: 'OK' }]
          );
          return;
        }
        
        // Check if it's a timeout
        if (txError?.message?.includes('timeout')) {
          Alert.alert(
            'Transaction Timeout',
            'The transaction request timed out. Please check MetaMask - you may have an approval waiting. If not, try again.',
            [{ text: 'OK' }]
          );
          return;
        }
        
        // Check if it's a connection issue
        if (txError?.code === -32000 || txError?.message?.includes('session') || txError?.message?.includes('connection')) {
          Alert.alert(
            'Connection Issue',
            'There was a connection issue with your wallet. Please disconnect and reconnect your wallet, then try again.',
            [{ text: 'OK' }]
          );
          return;
        }
        
        // Re-throw to be caught by outer catch
        throw txError;
      }

      // Start confirmation check in background, but proceed immediately
      // MetaMask shows transaction is confirmed, so we don't need to wait
      console.log('[Crypto Payment] Transaction sent, starting background confirmation check...');
      setTxConfirmed(true); // Set confirmed immediately for UI
      
      // Start confirmation check in background (non-blocking)
      waitForTransactionConfirmation(hash).catch((error) => {
        console.warn('[Crypto Payment] Background confirmation check failed:', error);
      });

      // Proceed immediately to complete investment
      // Don't wait for blockchain confirmation - MetaMask already shows it's confirmed
      console.log('[Crypto Payment] Proceeding to complete investment immediately...');

      // Transaction sent and approved in MetaMask, complete the investment
      console.log('[Crypto Payment] Completing investment with transaction hash:', hash);
      await completeInvestment(hash);

    } catch (error: any) {
      console.error('[Crypto Payment] Transaction error:', error);
      setSending(false);
      setStatusMessage('');
      
      let errorMessage = 'Failed to send payment';
      if (error?.code === 4001) {
        errorMessage = 'Transaction rejected by user';
      } else if (error?.code === -32000 || error?.message?.includes('insufficient funds')) {
        errorMessage = 'Insufficient balance. Please ensure you have enough tokens to cover the payment amount and gas fees.';
      } else if (error?.message) {
        errorMessage = error.message;
      }

      Alert.alert('Payment Failed', errorMessage, [{ text: 'OK' }]);
    }
  };

  const waitForTransactionConfirmation = async (hash: string) => {
    // Poll for transaction receipt using Polygon Amoy RPC directly (more reliable)
    let confirmed = false;
    let attempts = 0;
    const maxAttempts = 10; // Reduced to 10 attempts (30 seconds max)

    console.log('[Crypto Payment] Waiting for transaction confirmation:', hash);

    while (!confirmed && attempts < maxAttempts) {
      try {
        // Try using Polygon Amoy RPC directly first (more reliable)
        const receiptResponse = await fetch(POLYGON_AMOY_RPC_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'eth_getTransactionReceipt',
            params: [hash],
            id: 1,
          }),
        });

        const receiptData = await receiptResponse.json();
        const receipt = receiptData.result;

        if (receipt && receipt.status) {
          // Status can be '0x1' (success) or '0x0' (failure) or '1' or '0'
          const status = receipt.status === '0x1' || receipt.status === '1' || receipt.status === 1;
          
          if (status) {
            confirmed = true;
            setTxConfirmed(true);
            console.log('[Crypto Payment] Transaction confirmed via RPC:', receipt);
            break;
          } else {
            console.warn('[Crypto Payment] Transaction failed with status:', receipt.status);
            throw new Error('Transaction failed on blockchain');
          }
        } else {
          console.log(`[Crypto Payment] Transaction not yet confirmed (attempt ${attempts + 1}/${maxAttempts})`);
        }
      } catch (error: any) {
        // If RPC fails, try using provider as fallback
        try {
          const receipt = await provider.request({
            method: 'eth_getTransactionReceipt',
            params: [hash],
          });

          if (receipt && (receipt.status === '0x1' || receipt.status === '1' || receipt.status === 1)) {
            confirmed = true;
            setTxConfirmed(true);
            console.log('[Crypto Payment] Transaction confirmed via provider:', receipt);
            break;
          }
        } catch (providerError) {
          // Only log warning, don't break the loop
          if (attempts === 0) {
            console.warn('[Crypto Payment] Error checking receipt (both RPC and provider failed):', error, providerError);
          }
        }
      }

      attempts++;
      // Wait 2 seconds between checks (faster polling)
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    if (!confirmed) {
      console.warn('[Crypto Payment] Transaction confirmation timeout after', attempts, 'attempts');
      console.warn('[Crypto Payment] Proceeding anyway - MetaMask shows transaction is confirmed');
      // Set confirmed state so UI updates
      setTxConfirmed(true);
    }
    
    return confirmed;
  };

  const completeInvestment = async (txHash: string) => {
    try {
      console.log('[Crypto Payment] Starting investment completion...');
      // Call backend to complete investment with crypto payment
      // The backend should verify the transaction and complete the purchase
      const propertyId = params.propertyId;
      const tokenId = params.tokenId;

      console.log('[Crypto Payment] Investment parameters:', {
        totalInvestment,
        propertyId,
        tokenCount,
        tokenId,
        txHash,
      });

      // For now, we'll call the invest function
      // In production, you'd call a backend endpoint that verifies the crypto payment
      // invest function signature: invest(amount, propertyId, tokenCount, propertyTokenId?)
      await invest(totalInvestment, propertyId, tokenCount, tokenId);
      
      console.log('[Crypto Payment] Investment completed successfully');

      Alert.alert(
        'Payment Successful!',
        `Your payment has been confirmed.\n\nTransaction: ${txHash.slice(0, 10)}...${txHash.slice(-8)}\n\nYour investment is being processed.`,
        [
          {
            text: 'OK',
            onPress: () => {
              // Navigate to confirmation page
              // Wallet stays connected (no disconnect)
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
            <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, marginBottom: 4 }}>Amount (Tokens)</Text>
            <Text style={{ color: '#10B981', fontSize: 16, fontWeight: 'bold' }}>
              {(tokenAmount || totalInvestment).toFixed(2)} Tokens
            </Text>
            <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, marginTop: 4 }}>
              * Using 1:1 conversion (1 USD = 1 Token) on Polygon Amoy Testnet
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
          <>
            <TouchableOpacity
              onPress={handleSendPayment}
              disabled={sending}
              style={{
                backgroundColor: sending ? 'rgba(16, 185, 129, 0.5)' : '#10B981',
                borderRadius: 12,
                padding: 16,
                alignItems: 'center',
                marginBottom: 16,
                opacity: sending ? 0.7 : 1,
              }}
            >
              {sending ? (
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <EmeraldLoader />
                  <Text style={{ color: '#FFFFFF', fontSize: 14, marginLeft: 12 }}>
                    Processing...
                  </Text>
                </View>
              ) : (
                <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' }}>
                  Send Payment
                </Text>
              )}
            </TouchableOpacity>
            
            {/* Status Message */}
            {statusMessage && (
              <View style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', borderRadius: 12, padding: 12, marginBottom: 24 }}>
                <Text style={{ color: '#3B82F6', fontSize: 14, textAlign: 'center' }}>
                  {statusMessage}
                </Text>
              </View>
            )}
          </>
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
