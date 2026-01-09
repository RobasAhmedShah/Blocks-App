# WalletConnect Runtime Crash Fix

## Issue
The app was crashing on startup with:
```
ERROR: WalletConnectModal.subscribeSession is not a function (it is undefined)
```

## Root Cause
The provider implementation was using **invalid APIs** that don't exist in `@walletconnect/modal-react-native`:
- ❌ `WalletConnectModal.subscribeSession()` - Does not exist
- ❌ `WalletConnectModal.connect()` - Wrong usage pattern
- ❌ `WalletConnectModal.disconnect()` - Wrong usage pattern
- ❌ Manual session subscription with `useEffect` - Not needed

## Solution

### 1. Fixed Provider Implementation (`src/wallet/WalletConnectProvider.tsx`)

**Before** (Incorrect):
```typescript
// ❌ Wrong: Manual state management and invalid APIs
const [isConnected, setIsConnected] = useState(false);
const [address, setAddress] = useState<string | null>(null);

useEffect(() => {
  // ❌ This method doesn't exist
  const unsubscribe = WalletConnectModal.subscribeSession((session) => {
    // ...
  });
}, []);

const connect = async () => {
  // ❌ Wrong usage
  const result = await WalletConnectModal.connect({...});
};
```

**After** (Correct):
```typescript
// ✅ Correct: Use the official hook
import { useWalletConnectModal } from '@walletconnect/modal-react-native';

export const WalletConnectProvider = ({ children }) => {
  // ✅ Official hook provides everything
  const { open, close, isConnected, address, provider } = useWalletConnectModal();

  const value = {
    connect: open,      // ✅ Correct API
    disconnect: close,  // ✅ Correct API
    isConnected,        // ✅ Auto-managed
    address: address || null,
    provider,
  };

  return (
    <WalletConnectContext.Provider value={value}>
      {children}
    </WalletConnectContext.Provider>
  );
};
```

### 2. Added Modal Initialization (`app/_layout.tsx`)

**Added** the required `<WalletConnectModal>` wrapper with configuration:

```typescript
import { WalletConnectModal } from '@walletconnect/modal-react-native';

return (
  <WalletConnectModal
    projectId="5cbb6067937682b38b12150d7b2f5d94"
    providerMetadata={{
      name: 'Blocks',
      description: 'Blocks mobile app',
      url: 'https://blocks.app',
      icons: ['https://blocks.app/icon.png'],
      redirect: { native: 'blocks://' },
    }}
    sessionParams={{
      namespaces: {
        eip155: {
          methods: ['eth_sendTransaction', 'eth_signTransaction', 'eth_sign', 'personal_sign', 'eth_signTypedData'],
          chains: ['eip155:1'],
          events: ['chainChanged', 'accountsChanged'],
          rpcMap: {},
        },
      },
    }}>
    <WalletConnectProvider>
      {/* Rest of app */}
    </WalletConnectProvider>
  </WalletConnectModal>
);
```

## Key Changes Summary

### ❌ Removed (Invalid)
1. Manual `useState` for `isConnected` and `address`
2. `WalletConnectModal.subscribeSession()` call
3. Manual `useEffect` session listener
4. Custom `connect()` implementation with `WalletConnectModal.connect()`
5. Custom `disconnect()` implementation with `WalletConnectModal.disconnect()`

### ✅ Added (Correct)
1. `useWalletConnectModal()` hook import and usage
2. `<WalletConnectModal>` wrapper in root layout
3. Project configuration in modal wrapper
4. Direct hook values: `open`, `close`, `isConnected`, `address`, `provider`

## API Reference

### Correct WalletConnect Modal React Native APIs

```typescript
// ✅ Initialize modal at root
<WalletConnectModal projectId="..." providerMetadata={{...}} sessionParams={{...}}>
  {children}
</WalletConnectModal>

// ✅ Use the hook in components
const { open, close, isConnected, address, provider } = useWalletConnectModal();

// ✅ Open modal
await open();

// ✅ Close/disconnect
await close();

// ✅ Check connection state
if (isConnected) { ... }

// ✅ Get wallet address
const walletAddress = address;
```

### ❌ Invalid APIs (Don't Use)
```typescript
// ❌ These don't exist in @walletconnect/modal-react-native
WalletConnectModal.subscribeSession()
WalletConnectModal.connect()
WalletConnectModal.disconnect()
```

## Testing

After this fix:
1. ✅ App starts without crash
2. ✅ WalletConnect provider initializes correctly
3. ✅ Modal can be opened via `useWalletConnect().connect()`
4. ✅ Connection state automatically managed
5. ✅ Address automatically extracted from session

## Files Modified

1. `src/wallet/WalletConnectProvider.tsx` - Completely refactored to use correct hook API
2. `app/_layout.tsx` - Added `<WalletConnectModal>` wrapper with configuration

## No Changes Made To

- Dependencies (`package.json`)
- Babel/Metro/NativeWind config
- Routing or navigation structure
- Any other app logic

## Runtime Verification

The fix ensures:
- ✅ No more `subscribeSession is not a function` error
- ✅ Clean app startup
- ✅ Proper modal initialization
- ✅ Correct session management
- ✅ Automatic state updates
