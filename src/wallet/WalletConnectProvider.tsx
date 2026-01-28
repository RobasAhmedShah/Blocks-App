import React, { createContext, useContext, ReactNode } from 'react';
import { useWalletConnectModal, WalletConnectModal } from '@walletconnect/modal-react-native';

// Polygon Amoy Testnet configuration
const POLYGON_AMOY_CHAIN_ID = 80002;
const POLYGON_AMOY_CHAIN_ID_HEX = '0x13882';

// Helper function to get network name from chain ID
const getNetworkName = (chainId: number): string => {
  if (chainId === POLYGON_AMOY_CHAIN_ID) {
    return 'Polygon Amoy Testnet';
  }
  return `Chain ${chainId}`;
};

// Project configuration
const PROJECT_ID = '5cbb6067937682b38b12150d7b2f5d94';

const providerMetadata = {
  name: 'Blocks',
  description: 'Blocks mobile app',
  url: 'https://blocks.app',
  icons: ['https://blocks.app/icon.png'],
  redirect: {
    native: 'blocks://',
  },
};

// Session params for WalletConnect - only Polygon Amoy Testnet
const sessionParams = {
  namespaces: {
    eip155: {
      methods: [
        'eth_sendTransaction',
        'eth_signTransaction',
        'eth_sign',
        'personal_sign',
        'eth_signTypedData',
        'wallet_switchEthereumChain',
        'wallet_addEthereumChain',
      ],
      chains: ['eip155:80002'],
      events: ['chainChanged', 'accountsChanged'],
      rpcMap: {
        'eip155:80002': 'https://rpc-amoy.polygon.technology',
      },
    },
  },
} as const;

interface WalletConnectContextType {
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  switchToPolygonAmoy: () => Promise<void>;
  refreshSession: () => Promise<void>;
  isConnected: boolean;
  address: string | null;
  provider?: any;
  chainId?: number | null;
  isOnPolygonAmoy: boolean;
}

const WalletConnectContext = createContext<WalletConnectContextType | undefined>(undefined);

export const useWalletConnect = () => {
  const context = useContext(WalletConnectContext);
  if (!context) {
    throw new Error('useWalletConnect must be used within WalletConnectProvider');
  }
  return context;
};

interface WalletConnectProviderProps {
  children: ReactNode;
}

export const WalletConnectProvider = ({ children }: WalletConnectProviderProps) => {
  // Use the official WalletConnect Modal hook
  const { open, close, isConnected, address, provider } = useWalletConnectModal();
  const [chainId, setChainId] = React.useState<number | null>(null);
  
  // Memoize sessionParams to prevent recreation on every render
  // Always return a valid structure to prevent WalletConnect validation errors
  const memoizedSessionParams = React.useMemo(() => {
    try {
      // Deep clone to ensure we have a fresh object
      const params = JSON.parse(JSON.stringify(sessionParams));
      
      // Validate all required fields are present
      if (
        params?.namespaces?.eip155?.chains?.length > 0 &&
        params?.namespaces?.eip155?.methods?.length > 0 &&
        params?.namespaces?.eip155?.events?.length > 0 &&
        params?.namespaces?.eip155?.rpcMap &&
        typeof params.namespaces.eip155.rpcMap === 'object'
      ) {
        // Ensure rpcMap has all required entries
        params.namespaces.eip155.chains.forEach((chain: string) => {
          if (!params.namespaces.eip155.rpcMap[chain]) {
            console.warn(`[WalletConnect] Missing RPC URL for chain ${chain}, adding default`);
            params.namespaces.eip155.rpcMap[chain] = 'https://rpc-amoy.polygon.technology';
          }
        });
        
        return params;
      }
      
      console.error('[WalletConnect] Invalid sessionParams structure');
      // Return a minimal valid structure instead of undefined
      return {
        namespaces: {
          eip155: {
            methods: ['eth_sendTransaction', 'eth_signTransaction'],
            chains: ['eip155:80002'],
            events: ['chainChanged', 'accountsChanged'],
            rpcMap: {
              'eip155:80002': 'https://rpc-amoy.polygon.technology',
            },
          },
        },
      };
    } catch (error) {
      console.error('[WalletConnect] Error validating sessionParams:', error);
      // Return a minimal valid structure instead of undefined
      return {
        namespaces: {
          eip155: {
            methods: ['eth_sendTransaction', 'eth_signTransaction'],
            chains: ['eip155:80002'],
            events: ['chainChanged', 'accountsChanged'],
            rpcMap: {
              'eip155:80002': 'https://rpc-amoy.polygon.technology',
            },
          },
        },
      };
    }
  }, []);

  // Check if currently on Polygon Amoy
  const isOnPolygonAmoy = chainId === POLYGON_AMOY_CHAIN_ID;

  // Close modal when connection is established
  React.useEffect(() => {
    if (isConnected && address) {
      console.log('[WalletConnect] Connection established, closing modal...');
      // Small delay to ensure connection is fully established
      const timer = setTimeout(() => {
        Promise.resolve(close()).catch((error) => {
          console.error('[WalletConnect] Error closing modal after connection:', error);
        });
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isConnected, address, close]);

  // Function to switch to Polygon Amoy Testnet
  const switchToPolygonAmoy = async () => {
    if (!provider) {
      throw new Error('Wallet not connected');
    }

    try {
      console.log('[WalletConnect] Attempting to switch to Polygon Amoy Testnet...');
      
      // Try to switch network first
      try {
        await provider.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: POLYGON_AMOY_CHAIN_ID_HEX }],
        });
        console.log('[WalletConnect] Successfully switched to Polygon Amoy Testnet');
      } catch (switchError: any) {
        // If the chain is not added, add it first
        // Error code 4902 means the chain is not added to the wallet
        if (switchError.code === 4902 || switchError.code === -32000) {
          console.log('[WalletConnect] Chain not found, adding Polygon Amoy Testnet...');
          await provider.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: POLYGON_AMOY_CHAIN_ID_HEX,
                chainName: 'Polygon Amoy Testnet',
                nativeCurrency: {
                  name: 'MATIC',
                  symbol: 'MATIC',
                  decimals: 18,
                },
                rpcUrls: ['https://rpc-amoy.polygon.technology'],
                blockExplorerUrls: ['https://amoy.polygonscan.com'],
              },
            ],
          });
          console.log('[WalletConnect] Successfully added Polygon Amoy Testnet');
        } else {
          // Re-throw if it's a different error (user rejected, etc.)
          throw switchError;
        }
      }
    } catch (error: any) {
      console.error('[WalletConnect] Error switching to Polygon Amoy:', error);
      if (error.code === 4001) {
        throw new Error('User rejected network switch');
      }
      throw new Error(`Failed to switch to Polygon Amoy Testnet: ${error.message || 'Unknown error'}`);
    }
  };

  // Detect chain ID when provider is available
  React.useEffect(() => {
    const detectChainId = async () => {
      if (provider && isConnected) {
        try {
          const chainIdHex = await provider.request({ method: 'eth_chainId' });
          // Chain ID comes as hex string (e.g., "0x13882" for Polygon Amoy)
          const chainIdDecimal = typeof chainIdHex === 'string' && chainIdHex.startsWith('0x')
            ? parseInt(chainIdHex, 16)
            : parseInt(chainIdHex as string, 10);
          
          console.log('[WalletConnect] Detected chain:', {
            hex: chainIdHex,
            decimal: chainIdDecimal,
            network: getNetworkName(chainIdDecimal),
            isPolygonAmoy: chainIdDecimal === POLYGON_AMOY_CHAIN_ID
          });
          
          setChainId(chainIdDecimal);

          // If not on Polygon Amoy, prompt user to switch
          if (chainIdDecimal !== POLYGON_AMOY_CHAIN_ID) {
            console.warn('[WalletConnect] Wallet is not on Polygon Amoy Testnet. Current chain:', chainIdDecimal);
            console.log('[WalletConnect] User should switch to Polygon Amoy (80002) to use this app');
          }
        } catch (error) {
          console.error('[WalletConnect] Error detecting chain ID:', error);
          setChainId(null);
        }
      } else {
        setChainId(null);
      }
    };

    detectChainId();

    // Listen for chain changes
    if (provider && provider.on) {
      const handleChainChanged = (newChainId: string) => {
        console.log('[WalletConnect] Chain changed:', newChainId);
        const chainIdDecimal = typeof newChainId === 'string' && newChainId.startsWith('0x')
          ? parseInt(newChainId, 16)
          : parseInt(newChainId.toString(), 10);
        
        setChainId(chainIdDecimal);

        // Log if switched to Polygon Amoy
        if (chainIdDecimal === POLYGON_AMOY_CHAIN_ID) {
          console.log('[WalletConnect] Successfully switched to Polygon Amoy Testnet');
        } else {
          console.warn('[WalletConnect] Wallet switched to unsupported chain:', chainIdDecimal);
        }
      };

      const handleAccountsChanged = (accounts: string[]) => {
        console.log('[WalletConnect] Accounts changed:', accounts);
      };

      provider.on('chainChanged', handleChainChanged);
      provider.on('accountsChanged', handleAccountsChanged);

      return () => {
        if (provider.removeListener) {
          provider.removeListener('chainChanged', handleChainChanged);
          provider.removeListener('accountsChanged', handleAccountsChanged);
        }
      };
    }
  }, [provider, isConnected]);

  const handleConnect = async () => {
    try {
      console.log('[WalletConnect] Opening connection modal...');
      await open();
      console.log('[WalletConnect] Connection modal opened successfully');
    } catch (error) {
      console.error('[WalletConnect] Error opening connection modal:', error);
      throw error; // Re-throw so caller can handle it
    }
  };

  const handleDisconnect = async () => {
    try {
      // If provider exists and has disconnect method, use it
      if (provider && typeof provider.disconnect === 'function') {
        await provider.disconnect();
      }
      
      // Close the modal (this also disconnects the session in WalletConnect Modal)
      await Promise.resolve(close());
      setChainId(null);
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
      // Ensure modal is closed even if disconnect fails
      try {
        await Promise.resolve(close());
        setChainId(null);
      } catch (closeError) {
        console.error('Error closing modal:', closeError);
      }
    }
  };

  const refreshSession = async () => {
    try {
      console.log('[WalletConnect] Refreshing session...');
      
      if (!provider) {
        console.warn('[WalletConnect] No provider to refresh');
        return;
      }

      // Ping the provider to ensure session is active
      // This helps wake up the connection and ensures MetaMask modal will show
      // Wrap in try-catch to prevent WalletConnect validation errors from breaking the flow
      try {
        // Use a timeout to prevent hanging
        const chainIdPromise = provider.request({ method: 'eth_chainId' });
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Chain ID request timeout')), 5000)
        );
        
        const currentChainId = await Promise.race([chainIdPromise, timeoutPromise]);
        console.log('[WalletConnect] Session is active, chain ID:', currentChainId);
      } catch (error: any) {
        // Silently handle errors - this is just a ping to wake up the session
        if (error?.message?.includes('timeout')) {
          console.warn('[WalletConnect] Chain ID request timed out - session might be slow');
        } else if (error?.message?.includes('Cannot convert undefined')) {
          console.warn('[WalletConnect] WalletConnect validation error during refresh - this is usually harmless');
        } else {
          console.warn('[WalletConnect] Session ping failed (non-critical):', error?.message || error);
        }
        // Don't throw - this is a best-effort refresh
      }

      console.log('[WalletConnect] Session refresh complete');
    } catch (error: any) {
      // Catch any unexpected errors
      if (error?.message?.includes('Cannot convert undefined')) {
        console.warn('[WalletConnect] WalletConnect validation error - this is usually harmless and can be ignored');
      } else {
        console.error('[WalletConnect] Error refreshing session:', error);
      }
      // Don't throw - this is a best-effort refresh
    }
  };

  const value: WalletConnectContextType = {
    connect: handleConnect,
    disconnect: handleDisconnect,
    switchToPolygonAmoy,
    refreshSession,
    isConnected,
    address: address || null,
    provider,
    chainId,
    isOnPolygonAmoy,
  };

  // Build modal props - always include sessionParams to prevent undefined errors
  // WalletConnect's isValidUpdate expects sessionParams to always be an object
  const modalProps: any = {
    projectId: PROJECT_ID,
    providerMetadata: providerMetadata,
    sessionParams: memoizedSessionParams, // Always include (never undefined)
  };

  return (
    <>
      <WalletConnectModal {...modalProps} />
      <WalletConnectContext.Provider value={value}>
        {children}
      </WalletConnectContext.Provider>
    </>
  );
};
