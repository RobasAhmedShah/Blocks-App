# Magic Wallet Login

A Next.js application that implements passwordless authentication and wallet management using Magic SDK. Users can sign in with their email address and automatically receive a non-custodial Ethereum wallet on the Sepolia testnet.

## Features

- ✨ **Passwordless Authentication**: Email-based login using Magic Link (OTP)
- 🔐 **Non-Custodial Wallets**: Automatic wallet creation for each user
- 💰 **Balance Display**: Real-time Ethereum balance viewing
- 🌐 **Sepolia Testnet**: Configured for Ethereum Sepolia test network
- ⚡ **Next.js 16**: Built with the latest Next.js App Router
- 🎨 **Tailwind CSS**: Modern, responsive UI styling

## Prerequisites

- Node.js 18+ installed
- npm, yarn, pnpm, or bun package manager
- A Magic account (for API keys)
- An Alchemy account (for RPC endpoint)

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd magic-wallet-login
```

2. Install dependencies:
```bash
npm install
# or
yarn install
# or
pnpm install
```

3. Configure your environment (see Configuration section below)

4. Run the development server:
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Configuration

### Magic SDK Configuration

The application uses Magic SDK for authentication and wallet management. The configuration is located in `src/components/MagicWalletLogin.tsx`:

```typescript
const magic = new Magic("pk_live_9E93488C0CC96A3B", {
  network: {
    rpcUrl: "https://eth-sepolia.g.alchemy.com/v2/LHvAGa97NfNDF7jFvlM-vc6A44NzklzU",
    chainId: 11155111,
  },
});
```

#### Configuration Details:

- **Magic Publishable Key**: `pk_live_9E93488C0CC96A3B`
  - This is your Magic publishable API key
  - Get your key from [Magic Dashboard](https://dashboard.magic.link/)
  - The `pk_live_` prefix indicates a production/live key

- **RPC Endpoint**: `https://eth-sepolia.g.alchemy.com/v2/LHvAGa97NfNDF7jFvlM-vc6A44NzklzU`
  - Alchemy Sepolia testnet RPC endpoint
  - Get your Alchemy API key from [Alchemy Dashboard](https://dashboard.alchemy.com/)
  - Format: `https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY`

- **Chain ID**: `11155111`
  - Ethereum Sepolia testnet chain ID
  - This ensures the wallet is created on the correct network

### Environment Variables (Recommended)

For production, it's recommended to use environment variables instead of hardcoding keys:

1. Create a `.env.local` file in the root directory:
```env
NEXT_PUBLIC_MAGIC_PUBLISHABLE_KEY=pk_live_9E93488C0CC96A3B
NEXT_PUBLIC_ALCHEMY_API_KEY=LHvAGa97NfNDF7jFvlM-vc6A44NzklzU
NEXT_PUBLIC_CHAIN_ID=11155111
```

2. Update the component to use environment variables:
```typescript
const magic = new Magic(process.env.NEXT_PUBLIC_MAGIC_PUBLISHABLE_KEY!, {
  network: {
    rpcUrl: `https://eth-sepolia.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}`,
    chainId: parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || "11155111"),
  },
});
```

## Project Structure

```
magic-wallet-login/
├── src/
│   ├── app/
│   │   ├── layout.tsx          # Root layout component
│   │   ├── page.tsx            # Home page (renders MagicWalletLogin)
│   │   └── globals.css         # Global styles
│   └── components/
│       └── MagicWalletLogin.tsx # Main authentication component
├── public/                     # Static assets
├── package.json                # Dependencies and scripts
├── next.config.ts              # Next.js configuration
├── tsconfig.json               # TypeScript configuration
└── README.md                   # This file
```

## How It Works

### Authentication Flow

1. **User enters email**: User provides their email address on the login screen
2. **Magic Link sent**: Magic SDK sends a one-time password (OTP) to the user's email
3. **User verifies**: User clicks the Magic Link or enters the OTP code
4. **Wallet created**: Upon successful authentication, Magic automatically creates a non-custodial wallet
5. **Data displayed**: The app fetches and displays:
   - User email
   - Wallet address (public address)
   - Wallet balance (in ETH)

### Technical Implementation

- **Client-Side Only**: Magic SDK is initialized only on the client side to avoid SSR issues
- **Provider Pattern**: Uses Magic's RPC provider with ethers.js to interact with the blockchain
- **Automatic Wallet Retrieval**: The app attempts to get the wallet address from user metadata first, then falls back to the provider
- **Balance Fetching**: Uses Magic's RPC provider to fetch balance, avoiding CORS issues

## Dependencies

### Core Dependencies

- **next** (^16.0.1): React framework for production
- **react** (^19.2.0): UI library
- **react-dom** (^19.2.0): React DOM renderer
- **magic-sdk** (^31.2.0): Magic SDK for authentication and wallet management
- **ethers** (^6.15.0): Ethereum library for blockchain interactions

### Development Dependencies

- **typescript** (^5): TypeScript compiler
- **tailwindcss** (^4): Utility-first CSS framework
- **@types/react** (^19): TypeScript types for React
- **@types/node** (^20): TypeScript types for Node.js

## API Keys and Services

### Magic SDK

- **Service**: [Magic](https://magic.link/)
- **Purpose**: Passwordless authentication and wallet management
- **Key Type**: Publishable Key (safe for client-side use)
- **Current Key**: `pk_live_9E93488C0CC96A3B`
- **Dashboard**: [https://dashboard.magic.link/](https://dashboard.magic.link/)

### Alchemy

- **Service**: [Alchemy](https://www.alchemy.com/)
- **Purpose**: Ethereum RPC endpoint for Sepolia testnet
- **Key Type**: API Key
- **Current Key**: `LHvAGa97NfNDF7jFvlM-vc6A44NzklzU`
- **Endpoint**: `https://eth-sepolia.g.alchemy.com/v2/LHvAGa97NfNDF7jFvlM-vc6A44NzklzU`
- **Dashboard**: [https://dashboard.alchemy.com/](https://dashboard.alchemy.com/)

## Network Configuration

- **Network**: Ethereum Sepolia Testnet
- **Chain ID**: 11155111
- **RPC URL**: Alchemy Sepolia endpoint
- **Currency**: ETH (Ethereum)

## Usage

1. **Start the application**: Run `npm run dev`
2. **Enter email**: Type your email address in the input field
3. **Click "Send Magic Link"**: You'll receive an email with a Magic Link
4. **Verify**: Click the link in your email or enter the OTP code
5. **View wallet**: Once authenticated, you'll see:
   - Your email address
   - Your wallet address (public key)
   - Your wallet balance in ETH

## Features Implemented

- ✅ Email-based passwordless authentication
- ✅ Automatic wallet creation
- ✅ Wallet address display
- ✅ Real-time balance fetching
- ✅ Logout functionality
- ✅ Error handling and user feedback
- ✅ Loading states
- ✅ Responsive UI with Tailwind CSS

## Troubleshooting

### Common Issues

1. **"window is not defined" error**
   - This is handled by initializing Magic only on the client side
   - The component uses `useMemo` with a `typeof window` check

2. **CORS errors**
   - The app uses Magic's RPC provider instead of direct RPC calls
   - This avoids CORS issues by routing through Magic's infrastructure

3. **RPC connection errors**
   - Ensure your Alchemy API key is valid
   - Check that the Sepolia testnet endpoint is accessible
   - Verify the chain ID matches (11155111 for Sepolia)

4. **Wallet address not showing**
   - The app tries multiple methods to retrieve the address
   - Check browser console for debug logs
   - Try logging out and back in

## Security Notes

⚠️ **Important**: 
- The Magic publishable key (`pk_live_*`) is safe to use client-side
- However, for production, consider using environment variables
- Never commit your Alchemy API key to public repositories
- Use environment variables for all sensitive configuration

## Building for Production

```bash
npm run build
npm start
```

## License

This project is private and proprietary.

## Support

For issues related to:
- **Magic SDK**: Check [Magic Documentation](https://magic.link/docs)
- **Alchemy**: Check [Alchemy Documentation](https://docs.alchemy.com/)
- **Next.js**: Check [Next.js Documentation](https://nextjs.org/docs)

## Changelog

### Version 0.1.0
- Initial implementation
- Email-based authentication with Magic SDK
- Wallet creation and management
- Balance display functionality
- Sepolia testnet configuration
