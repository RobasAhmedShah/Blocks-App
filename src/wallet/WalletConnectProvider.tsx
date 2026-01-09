import React, { createContext, useContext, ReactNode } from 'react';
import { useWalletConnectModal, WalletConnectModal } from '@walletconnect/modal-react-native';

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
      chains: ['eip155:1'],
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

  const value: WalletConnectContextType = {
    connect: open,
    disconnect: close,
    isConnected,
    address: address || null,
    provider,
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
