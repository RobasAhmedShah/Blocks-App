# Blocks - Real World Asset Tokenization Platform

A modern mobile application for tokenizing real estate properties in Pakistan, enabling fractional investment and democratizing access to premium real estate opportunities.

## 🌟 Overview

Blocks connects property builders with investors, allowing users to purchase fractional ownership of properties through blockchain-based tokens. Once properties are completed, rental income is automatically distributed to token holders proportionally.

### Key Features

- **Property Marketplace**: Browse and invest in tokenized real estate properties
- **Fractional Ownership**: Buy property shares starting from as low as $50
- **Rental Income Distribution**: Earn passive income from property rentals
- **Multi-Currency Wallet**: Manage USDC deposits and withdrawals
- **Multiple Payment Methods**: 
  - Debit/Credit Card
  - On-Chain Transfers (Polygon, BNB Chain, Ethereum)
  - Binance Pay Integration
- **Portfolio Tracking**: Monitor your investments and returns
- **Smart UX**: Intelligent balance detection and deposit suggestions
- **Dark Mode**: Full dark/light theme support

## 📱 Screenshots

The app features a modern, intuitive design inspired by leading fintech applications, with smooth animations and gesture-based navigation.

## 🏗️ Architecture

### Tech Stack

- **Framework**: React Native with Expo
- **Navigation**: Expo Router (file-based routing)
- **Styling**: NativeWind (Tailwind CSS for React Native)
- **State Management**: React Hooks
- **Type Safety**: TypeScript
- **Icons**: MaterialIcons from @expo/vector-icons

### Project Structure

```
app/
├── (tabs)/                 # Bottom tab navigation
│   ├── index.tsx          # Home/Property Listing
│   ├── portfolio.tsx      # Portfolio Overview
│   ├── wallet.tsx         # Wallet & Transactions
│   └── profile.tsx        # User Profile
├── property/
│   └── [id].tsx          # Property Detail Screen
├── invest/
│   └── [id].tsx          # Investment Flow
├── wallet/
│   ├── deposit.tsx        # Deposit Method Selection
│   ├── deposit/
│   │   ├── card.tsx      # Card Deposit
│   │   ├── onchain.tsx   # On-Chain Deposit
│   │   └── binance.tsx   # Binance Pay
│   ├── withdraw.tsx       # Withdrawal
│   └── transfer.tsx       # Internal Transfer
└── _layout.tsx           # Root Navigation

data/
└── mockProperties.ts      # Sample property data

types/
└── property.ts           # TypeScript interfaces

components/
└── nativewindui/         # Reusable UI components
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ installed
- Expo CLI installed globally: `npm install -g expo-cli`
- iOS Simulator (Mac) or Android Emulator/Device

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd Blocks
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

4. Run on your device:
   - Press `i` for iOS Simulator
   - Press `a` for Android Emulator
   - Scan QR code with Expo Go app on physical device

## 💡 Key Features Explained

### 1. Property Investment Flow

Users can browse properties, view detailed information including:
- Property valuation and tokenomics
- Builder/Developer information
- Expected ROI and yield
- Amenities and features
- Verified documents
- Recent project updates

### 2. Smart Investment UX

When a user attempts to invest with insufficient balance:
- The app automatically calculates the required amount
- Offers to redirect to deposit screen with pre-filled amount
- No manual calculation needed by the user

### 3. Wallet System

**Deposit Methods:**
- **Card**: Instant deposits with 2.9% processing fee
- **On-Chain**: Direct crypto transfers (USDC) via QR code
- **Binance Pay**: Zero-fee instant deposits

**Features:**
- Real-time balance tracking
- Transaction history with filters
- Quick actions (Deposit, Withdraw, Transfer)

### 4. Portfolio Management

- Track all property investments
- View current value and ROI
- Monitor rental income distributions
- Income timeline visualization
- Property-specific performance metrics

### 5. Rental Income Distribution

For completed properties generating rental income:
- Monthly automatic distributions
- Proportional to token ownership
- Transparent transaction history
- Next distribution date tracking

## 🎨 Design Philosophy

### Color Palette

- **Primary**: Teal (#0fa0bd) - Trust, stability, growth
- **Primary Light**: #79F0E5 - Accents and highlights
- **Background Dark**: #012A24 - Deep teal for dark mode
- **Success**: Green - Positive returns, gains
- **Warning**: Yellow/Orange - Alerts, pending actions

### User Experience

1. **Swipe-First Navigation**: Horizontal scrolling for property cards, stats, and timelines
2. **Gesture-Based**: Pull to refresh, swipe through images
3. **Minimal Clicks**: Direct actions with clear CTAs
4. **Smart Defaults**: Auto-fill amounts, suggested investments
5. **Progressive Disclosure**: Show details only when needed

## 🔮 Future Enhancements

### Phase 1 (Current)
- ✅ Property browsing and investment
- ✅ Wallet management
- ✅ Portfolio tracking
- ✅ Multiple payment methods

### Phase 2 (Planned)
- [ ] Hyperledger Fabric blockchain integration
- [ ] Smart contract deployment for properties
- [ ] Automated rental distribution via smart contracts
- [ ] KYC/AML verification
- [ ] Real-time property value updates

### Phase 3 (Future)
- [ ] Secondary market for token trading
- [ ] Property voting and governance
- [ ] Staking and rewards program
- [ ] Multi-chain support
- [ ] NFT certificates for property ownership

## 🔒 Security Considerations

- All transactions are currently simulated (mock data)
- Blockchain integration will include:
  - Multi-signature wallets
  - Escrow contracts for fund security
  - Transparent on-chain property records
  - Automated compliance checks
- User authentication and authorization to be implemented
- End-to-end encryption for sensitive data

## 📄 Data Models

### Property
```typescript
interface Property {
  id: string;
  title: string;
  location: string;
  valuation: number;
  tokenPrice: number;
  totalTokens: number;
  soldTokens: number;
  estimatedROI: number;
  status: 'funding' | 'construction' | 'completed' | 'generating-income';
  // ... more fields
}
```

### User Investment
```typescript
interface UserInvestment {
  id: string;
  propertyId: string;
  tokensOwned: number;
  investmentAmount: number;
  currentValue: number;
  roi: number;
  rentalEarned: number;
  // ... more fields
}
```

## 🤝 Contributing

This is a prototype/demo application. For production use:
1. Implement proper authentication
2. Connect to real blockchain network
3. Integrate with property databases
4. Add KYC/AML compliance
5. Implement proper error handling
6. Add comprehensive testing

## 📜 License

[To be determined]

## 👥 Team

Developed for real-world asset tokenization in Pakistan's real estate market.

## 📞 Support

For questions or support, please contact [support email/link]

---

**Note**: This application currently uses mock data for demonstration purposes. Blockchain integration and real property data will be added in future phases.

