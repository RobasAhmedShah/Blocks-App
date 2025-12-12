# Magic SDK Passwordless Authentication Setup

This document explains the Magic SDK passwordless authentication implementation in the Blocks React Native Expo app.

## Overview

The app now uses **Magic SDK** for passwordless authentication via Email OTP (One-Time Password). Users no longer need to create passwords - they simply enter their email and receive a verification code.

## Key Features

- ✨ **Passwordless Login**: Email-based OTP authentication
- 🔐 **Automatic User Creation**: Magic automatically creates user accounts on first login
- 🎯 **No Signup Required**: Same flow for new and existing users
- 💼 **Non-Custodial Wallets**: Each user gets an Ethereum wallet automatically
- 🔒 **Secure**: Uses Magic's DID (Decentralized ID) token system

## Configuration

### Magic Publishable Key

The app uses the following Magic publishable key:
```typescript
const MAGIC_PUBLISHABLE_KEY = 'pk_live_9E93488C0CC96A3B';
```

This is configured in `services/magicService.ts`.

### Environment Variables (Recommended for Production)

For production, move the key to environment variables:

1. Create `.env` file:
```env
EXPO_PUBLIC_MAGIC_PUBLISHABLE_KEY=pk_live_9E93488C0CC96A3B
```

2. Update `services/magicService.ts`:
```typescript
const MAGIC_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_MAGIC_PUBLISHABLE_KEY || 'pk_live_9E93488C0CC96A3B';
```

## Implementation Files

### 1. Magic Service (`services/magicService.ts`)

Core service that handles Magic SDK interactions:

- `getMagicInstance()`: Returns singleton Magic instance
- `loginWithEmailOTP()`: Handles OTP login flow with custom UI
- `getUserInfo()`: Fetches user email and wallet address
- `isLoggedIn()`: Checks if user has active session
- `logout()`: Logs out user and clears session
- `verifySession()`: Verifies current session validity

### 2. Auth Context (`contexts/AuthContext.tsx`)

Updated to integrate Magic SDK:

- Checks Magic session on app startup
- Stores user email and wallet address
- Handles Magic logout on sign out
- Maintains backward compatibility with biometric auth

### 3. Sign In Screen (`app/onboarding/signin.tsx`)

New passwordless signin flow:

1. User enters email
2. Magic sends OTP to email
3. User enters 6-digit code
4. Magic verifies and creates/logs in user
5. App receives DID token and user info

### 4. Welcome Screen (`app/onboarding/welcome.tsx`)

Simplified to show single "Get Started" button that goes to signin. No separate signup flow needed.

## Authentication Flow

### First Time User

1. User clicks "Get Started" → Goes to signin screen
2. Enters email address
3. Receives OTP code via email
4. Enters 6-digit code
5. Magic creates new account automatically
6. User is logged in with wallet created

### Returning User

1. User enters email address
2. Receives OTP code via email
3. Enters 6-digit code
4. Magic verifies existing account
5. User is logged in with existing wallet

## User Data Stored

### Magic SDK Provides:
- `email`: User's email address
- `publicAddress`: Ethereum wallet address
- `issuer`: Unique user identifier (DID)

### Stored in Secure Store:
- `magic_did_token`: DID token for session management
- `magic_user_info`: User email and wallet address (JSON)
- `auth_token`: Compatibility token (stores 'magic_did_token')

## API Integration

To use the DID token with your backend:

```typescript
// Get user info from Magic
const userInfo = await getUserInfo();

// Send to your backend
const response = await fetch('https://your-api.com/auth/verify', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${didToken}`,
  },
  body: JSON.stringify({
    email: userInfo.email,
    publicAddress: userInfo.publicAddress,
  }),
});
```

### Backend Verification

Use Magic Admin SDK to verify DID tokens:

```javascript
// Node.js backend
const { Magic } = require('@magic-sdk/admin');
const magic = new Magic(process.env.MAGIC_SECRET_KEY);

// Verify DID token
try {
  magic.token.validate(didToken);
  const issuer = magic.token.getIssuer(didToken);
  const userMetadata = await magic.users.getMetadataByIssuer(issuer);
  
  // userMetadata contains email, publicAddress, etc.
} catch (error) {
  // Invalid token
}
```

## Security Notes

⚠️ **Important**:
- The publishable key (`pk_live_*`) is safe for client-side use
- Never expose your Magic Secret Key in the frontend
- DID tokens expire after 15 minutes by default
- OTP codes expire after 10 minutes
- Store tokens in Secure Store, not AsyncStorage

## Testing

### Development Testing

1. Run the app:
```bash
npm start
```

2. Go to Sign In screen
3. Enter your email
4. Check your email for OTP code
5. Enter code to verify

### Production Testing

Use your personal email or Magic's test email format:
- `test+{any}@magic.link` - Always succeeds
- OTP will be: `000000` for test emails

## Troubleshooting

### Common Issues

1. **"Magic is not defined"**
   - Ensure Magic SDK is installed: `npm install @magic-sdk/react-native-expo`

2. **OTP not received**
   - Check spam folder
   - Verify email address is correct
   - Check Magic Dashboard for delivery status

3. **Session not persisting**
   - Check that DID token is stored in Secure Store
   - Verify `verifySession()` is called on app startup

4. **RPC errors**
   - These are related to blockchain interactions
   - Not critical for authentication flow
   - Can be ignored if only using auth features

## Wallet Features

### Accessing User's Wallet

```typescript
const userInfo = await getUserInfo();
console.log('Wallet Address:', userInfo.publicAddress);
```

### Signing Transactions (Future)

Magic SDK can sign blockchain transactions:

```typescript
const magic = getMagicInstance();
const provider = magic.rpcProvider;

// Use with ethers.js or web3.js
// Example with ethers:
// const ethersProvider = new ethers.providers.Web3Provider(provider);
```

## Migration from Password Auth

If migrating from password-based auth:

1. Users will need to re-authenticate with Magic
2. Match users by email address
3. Link Magic issuer ID to your user database
4. Disable old password endpoints

## Resources

- [Magic Documentation](https://magic.link/docs)
- [React Native SDK](https://magic.link/docs/home/wallets/react-native)
- [Magic Dashboard](https://dashboard.magic.link/)
- [Admin SDK](https://magic.link/docs/home/authentication/admin)

## Support

For issues with:
- **Magic SDK**: Check [Magic Documentation](https://magic.link/docs)
- **Expo**: Check [Expo Documentation](https://docs.expo.dev/)
- **App Integration**: Check this README and code comments

## Changelog

### v1.0.0
- Initial Magic SDK integration
- Passwordless OTP authentication
- Automatic user creation
- Wallet address retrieval
- Session management

