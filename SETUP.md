# Blocks App - Setup & Development Guide

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **Expo CLI**: `npm install -g expo-cli`
- **Git**

For mobile development:
- **iOS**: Xcode (Mac only) or Expo Go app
- **Android**: Android Studio or Expo Go app

## 🚀 Quick Start

### 1. Clone and Install

```bash
# Clone the repository
git clone <repository-url>
cd my-expo-app

# Install dependencies
npm install

# Install additional required packages (if not already installed)
npm install expo-linear-gradient expo-clipboard
```

### 2. Run the Development Server

```bash
# Start Expo development server
npm start

# Or use specific commands:
npm run ios      # iOS simulator (Mac only)
npm run android  # Android emulator
npm run web      # Web browser
```

### 3. Run on Physical Device

1. Install **Expo Go** from App Store (iOS) or Play Store (Android)
2. Start the dev server: `npm start`
3. Scan the QR code with:
   - iPhone: Camera app
   - Android: Expo Go app

## 📱 Development Workflow

### Project Structure

```
my-expo-app/
├── app/                    # Main application code
│   ├── (tabs)/            # Bottom tab screens
│   ├── property/          # Property detail screens
│   ├── invest/            # Investment flow screens
│   ├── wallet/            # Wallet and payment screens
│   └── _layout.tsx        # Root navigation setup
├── components/            # Reusable UI components
├── data/                  # Mock data
├── types/                 # TypeScript definitions
├── theme/                 # Theme configuration
├── lib/                   # Utility functions
└── assets/                # Images, fonts, etc.
```

### Key Files

- `app/_layout.tsx` - Root navigation configuration
- `app/(tabs)/_layout.tsx` - Bottom tab navigation
- `data/mockProperties.ts` - Sample property and user data
- `types/property.ts` - TypeScript interfaces
- `tailwind.config.js` - TailwindCSS/NativeWind configuration

## 🎨 Styling with NativeWind

This project uses **NativeWind** (Tailwind CSS for React Native). 

### Usage Examples

```tsx
// Light/Dark mode responsive
<View className="bg-blocks-bg-light dark:bg-blocks-bg-dark">
  <Text className="text-blocks-text-light dark:text-blocks-text-dark">
    Hello World
  </Text>
</View>

// Custom colors (defined in tailwind.config.js)
<View className="bg-teal">          // Primary teal
<View className="bg-blocks-card-dark"> // Dark mode card
<Text className="text-teal-light">    // Light teal text
```

### Adding Custom Colors

Edit `tailwind.config.js`:

```javascript
colors: {
  'your-color': {
    DEFAULT: '#hexcode',
    light: '#hexcode',
    dark: '#hexcode',
  }
}
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
# API Endpoints (for future backend integration)
API_URL=https://api.blocks.app
BLOCKCHAIN_RPC=https://polygon-rpc.com

# Feature Flags
ENABLE_BLOCKCHAIN=false
ENABLE_REAL_PAYMENTS=false
```

### App Configuration

Edit `app.json` for app metadata:

```json
{
  "expo": {
    "name": "Blocks",
    "slug": "blocks-rwa",
    "version": "1.0.0",
    "scheme": "blocks",
    // ... more config
  }
}
```

## 🧪 Testing

### Manual Testing Checklist

- [ ] Home screen loads and displays properties
- [ ] Property detail screen shows all information
- [ ] Investment flow works with low balance detection
- [ ] Wallet screens load correctly
- [ ] Portfolio displays user investments
- [ ] Profile screen is accessible
- [ ] Dark mode toggle works
- [ ] All navigation flows work smoothly

### Testing on Different Platforms

```bash
# iOS (Mac only)
npm run ios

# Android
npm run android

# Web (limited functionality)
npm run web
```

## 📦 Building for Production

### iOS

1. Update `app.json` with your bundle identifier
2. Configure signing in Xcode
3. Build:
```bash
expo build:ios
```

### Android

1. Update `app.json` with your package name
2. Configure signing credentials
3. Build:
```bash
expo build:android
```

### Using EAS Build (Recommended)

```bash
# Install EAS CLI
npm install -g eas-cli

# Configure EAS
eas build:configure

# Build for iOS
eas build --platform ios

# Build for Android
eas build --platform android
```

## 🐛 Troubleshooting

### Common Issues

**1. Metro bundler not starting**
```bash
# Clear cache and restart
npx expo start -c
```

**2. Dependencies not resolving**
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install
```

**3. TypeScript errors**
```bash
# Check TypeScript
npx tsc --noEmit
```

**4. NativeWind styles not applying**
- Ensure `global.css` is imported in `_layout.tsx`
- Check `nativewind-env.d.ts` exists
- Restart Metro bundler

**5. Navigation issues**
```bash
# Clear Expo cache
npx expo start -c
```

### Platform-Specific Issues

**iOS:**
- Make sure Xcode Command Line Tools are installed
- Check iOS simulator is properly configured
- Update CocoaPods: `cd ios && pod install`

**Android:**
- Ensure Android SDK is properly installed
- Check ANDROID_HOME environment variable
- Update Gradle if needed

## 🔄 Git Workflow

### Branch Strategy

```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Make changes and commit
git add .
git commit -m "feat: add new feature"

# Push to remote
git push origin feature/your-feature-name
```

### Commit Message Convention

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes (formatting)
- `refactor:` Code refactoring
- `test:` Adding tests
- `chore:` Maintenance tasks

## 📚 Useful Resources

### Documentation

- [Expo Documentation](https://docs.expo.dev/)
- [React Native](https://reactnative.dev/)
- [NativeWind](https://www.nativewind.dev/)
- [Expo Router](https://docs.expo.dev/router/introduction/)

### Community

- [Expo Forums](https://forums.expo.dev/)
- [React Native Community](https://reactnative.dev/community/overview)

## 🚧 Roadmap

### Current Phase (MVP)
- ✅ Property browsing
- ✅ Investment flow
- ✅ Wallet management
- ✅ Portfolio tracking
- ✅ Multiple payment methods

### Next Phase
- [ ] User authentication
- [ ] Backend API integration
- [ ] Hyperledger Fabric blockchain
- [ ] Smart contracts
- [ ] KYC/AML verification
- [ ] Push notifications
- [ ] Real-time updates

### Future Enhancements
- [ ] Secondary market trading
- [ ] Property governance
- [ ] Advanced analytics
- [ ] Social features
- [ ] Referral program

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

### Code Style

- Follow React/TypeScript best practices
- Use functional components and hooks
- Keep components small and focused
- Use meaningful variable names
- Add comments for complex logic
- Maintain consistent formatting (use Prettier)

## 📄 License

[To be determined]

## 📞 Support

For help or questions:
- Create an issue on GitHub
- Contact: [support email]

---

Happy coding! 🚀

