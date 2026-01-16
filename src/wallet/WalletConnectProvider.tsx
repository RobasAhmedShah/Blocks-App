import React, { createContext, useContext, ReactNode } from 'react';
import { useWalletConnectModal, WalletConnectModal } from '@walletconnect/modal-react-native';

// Helper function to get network name from chain ID
const getNetworkName = (chainId: number): string => {
  switch (chainId) {
    case 1:
      return 'Ethereum Mainnet';
    case 11155111:
      return 'Sepolia Testnet';
    case 80002:
      return 'Polygon Amoy Testnet';
    case 5777:
    case 1337:
      return 'Local Testnet';
    default:
      return `Chain ${chainId}`;
  }
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

const sessionParams = {
  namespaces: {
    eip155: {
      methods: [
        'eth_sendTransaction',
        'eth_signTransaction',
        'eth_sign',
        'personal_sign',
        'eth_signTypedData',
      ],
      // Support multiple chains - let wallet choose
      chains: ['eip155:1', 'eip155:11155111', 'eip155:80002', 'eip155:5777', 'eip155:1337'], // Mainnet, Sepolia, Polygon Amoy, Ganache, Local
      events: ['chainChanged', 'accountsChanged'],
      rpcMap: {},
    },
  },
};

interface WalletConnectContextType {
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  isConnected: boolean;
  address: string | null;
  provider?: any;
  chainId?: number | null;
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

  // Detect chain ID when provider is available
  React.useEffect(() => {
    const detectChainId = async () => {
      if (provider && isConnected) {
        try {
          const chainIdHex = await provider.request({ method: 'eth_chainId' });
          // Chain ID comes as hex string (e.g., "0x1" for mainnet)
          const chainIdDecimal = typeof chainIdHex === 'string' && chainIdHex.startsWith('0x')
            ? parseInt(chainIdHex, 16)
            : parseInt(chainIdHex.toString(), 10);
          
          console.log('[WalletConnect] Detected chain:', {
            hex: chainIdHex,
            decimal: chainIdDecimal,
            network: getNetworkName(chainIdDecimal)
          });
          
          setChainId(chainIdDecimal);
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
      };

      provider.on('chainChanged', handleChainChanged);

      return () => {
        if (provider.removeListener) {
          provider.removeListener('chainChanged', handleChainChanged);
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
      await close();
      setChainId(null);
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
      // Ensure modal is closed even if disconnect fails
      try {
        await close();
        setChainId(null);
      } catch (closeError) {
        console.error('Error closing modal:', closeError);
      }
    }
  };

  const value: WalletConnectContextType = {
    connect: handleConnect,
    disconnect: handleDisconnect,
    isConnected,
    address: address || null,
    provider,
    chainId,
  };

  return (
    <>
      <WalletConnectModal
        projectId={PROJECT_ID}
        providerMetadata={providerMetadata}
        sessionParams={sessionParams}
      />
      <WalletConnectContext.Provider value={value}>
        {children}
      </WalletConnectContext.Provider>
    </>
  );
};
