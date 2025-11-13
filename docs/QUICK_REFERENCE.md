# Blocks App - Quick Reference Guide

## 🚀 Quick Commands

```bash
# Development
npm start                    # Start Expo dev server
npm run ios                  # Run on iOS simulator
npm run android              # Run on Android emulator
npm run web                  # Run in web browser

# Maintenance
npm run lint                 # Check code quality
npm run format               # Format code
npx expo start -c            # Clear cache and start

# Building
eas build --platform ios     # Build iOS app
eas build --platform android # Build Android app
```

## 📁 File Structure Quick Guide

```
app/
├── (tabs)/          → Main bottom tab screens
├── property/        → Property detail screens
├── invest/          → Investment flow
├── wallet/          → Wallet & payments
└── _layout.tsx      → Navigation config

data/
└── mockProperties.ts → Sample data (edit here for testing)

types/
└── property.ts      → TypeScript interfaces
```

## 🎨 Common UI Patterns

### Responsive Dark Mode Component
```tsx
import { useColorScheme } from '@/lib/useColorScheme';

export default function MyComponent() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  return (
    <View className={`${isDark ? 'bg-blocks-bg-dark' : 'bg-blocks-bg-light'}`}>
      <Text className={`${isDark ? 'text-blocks-text-dark' : 'text-blocks-text-light'}`}>
        Hello
      </Text>
    </View>
  );
}
```

### Navigation
```tsx
import { useRouter } from 'expo-router';

const router = useRouter();

// Navigate to screen
router.push('/property/123');

// Navigate with params
router.push(`/invest/${propertyId}`);

// Go back
router.back();

// Replace (no back button)
router.replace('/(tabs)');
```

### Accessing Route Params
```tsx
import { useLocalSearchParams } from 'expo-router';

const { id, amount } = useLocalSearchParams();
```

## 🎨 Color Classes

```css
/* Backgrounds */
bg-blocks-bg-light          /* #f6f8f8 */
bg-blocks-bg-dark           /* #012A24 */
bg-blocks-card-light        /* #FFFFFF */
bg-blocks-card-dark         /* #0B3D36 */

/* Text */
text-blocks-text-light      /* #1F2937 */
text-blocks-text-dark       /* #E0E0E0 */
text-blocks-text-secondary  /* #6B7280 */
text-blocks-text-dark-secondary /* #A9A9A9 */

/* Primary Colors */
bg-teal                     /* #0fa0bd */
text-teal                   /* #0fa0bd */
bg-teal-light               /* #79F0E5 */

/* Utility */
bg-green-500                /* Success */
bg-red-500                  /* Error */
bg-yellow-500               /* Warning */
```

## 📊 Mock Data Locations

### Properties
```typescript
// Edit: data/mockProperties.ts
export const mockProperties: Property[] = [...]
```

### User Investments
```typescript
// Edit: data/mockProperties.ts
export const mockUserInvestments: UserInvestment[] = [...]
```

### Wallet Balance
```typescript
// Edit: data/mockProperties.ts
export const mockWalletBalance: WalletBalance = {...}
```

## 🔧 Common Tasks

### Add a New Property
1. Open `data/mockProperties.ts`
2. Add new property object to `mockProperties` array
3. Follow existing property structure

### Change Theme Colors
1. Open `tailwind.config.js`
2. Modify colors in `extend.colors` section
3. Restart Metro bundler: `npx expo start -c`

### Add a New Screen
1. Create file in appropriate `app/` subdirectory
2. Add to navigation in `app/_layout.tsx`
3. Follow naming convention: lowercase with hyphens

### Create a Reusable Component
1. Create in `components/` directory
2. Export as default or named export
3. Import where needed

## 🐛 Common Issues & Fixes

### Metro Bundler Issues
```bash
# Clear cache and restart
npx expo start -c

# Clear watchman
watchman watch-del-all

# Reset Metro
rm -rf .expo
```

### TypeScript Errors
```bash
# Check types
npx tsc --noEmit

# If needed, regenerate types
npx expo customize tsconfig.json
```

### Styling Not Working
- Check `global.css` is imported in `_layout.tsx`
- Verify `nativewind-env.d.ts` exists
- Restart Metro: `npx expo start -c`

### Navigation Issues
- Check file naming (lowercase, hyphens)
- Verify route is registered in `_layout.tsx`
- Check for typos in `router.push()` paths

## 📱 Testing Checklist

```
Property Browsing
  [ ] List loads correctly
  [ ] Search filters work
  [ ] Property cards display
  [ ] Navigate to detail works

Property Detail
  [ ] Images carousel works
  [ ] All tabs load
  [ ] Investment button works
  [ ] Back navigation works

Investment Flow
  [ ] Token amount input works
  [ ] Balance check works
  [ ] Low balance redirect works
  [ ] Confirmation flow completes

Wallet
  [ ] Balance displays
  [ ] Transaction list loads
  [ ] Filters work
  [ ] Deposit options load

Deposit Screens
  [ ] Card form validates
  [ ] On-chain QR generates
  [ ] Binance Pay flow works
  [ ] Back navigation works

Portfolio
  [ ] Total value calculates
  [ ] Property list displays
  [ ] Charts render
  [ ] Navigation works

Profile
  [ ] Dark mode toggle works
  [ ] Menu items navigate
  [ ] Stats display correctly
```

## 🎯 Key Files to Know

| File | Purpose |
|------|---------|
| `app/_layout.tsx` | Root navigation setup |
| `app/(tabs)/_layout.tsx` | Bottom tab configuration |
| `data/mockProperties.ts` | All mock data |
| `types/property.ts` | TypeScript interfaces |
| `tailwind.config.js` | Styling configuration |
| `lib/useColorScheme.tsx` | Theme management |
| `global.css` | Global styles |

## 💡 Pro Tips

1. **Use TypeScript**: Full type safety throughout
2. **Follow Naming**: Kebab-case for files, PascalCase for components
3. **Dark Mode First**: Always consider both themes
4. **Mobile First**: Test on actual devices
5. **Reuse Components**: Don't repeat UI patterns
6. **Use Mock Data**: Edit `mockProperties.ts` for testing
7. **Clear Cache Often**: `npx expo start -c` fixes many issues

## 📚 Quick Links

- [Expo Docs](https://docs.expo.dev/)
- [NativeWind](https://www.nativewind.dev/)
- [React Navigation](https://reactnavigation.org/)
- [TypeScript](https://www.typescriptlang.org/docs/)
- [Tailwind CSS](https://tailwindcss.com/docs)

## 🎨 Icon Reference

Using `@expo/vector-icons` (MaterialIcons):

```tsx
import { MaterialIcons } from '@expo/vector-icons';

<MaterialIcons name="home" size={24} color="black" />
<MaterialIcons name="trending-up" size={24} color="#0fa0bd" />
<MaterialIcons name="account-balance-wallet" size={24} />
```

Common icons used in app:
- `home`, `pie-chart`, `account-balance-wallet`, `person`
- `trending-up`, `arrow-back`, `arrow-forward`
- `add`, `remove`, `search`, `filter`
- `check-circle`, `info-outline`, `warning`
- `location-on`, `business`, `verified`

## 🔄 Version Control

```bash
# Create feature branch
git checkout -b feature/your-feature

# Stage changes
git add .

# Commit with message
git commit -m "feat: add new feature"

# Push to remote
git push origin feature/your-feature
```

## 📞 Getting Help

1. Check this guide first
2. Review `SETUP.md` for detailed instructions
3. Check `README.md` for project overview
4. Search existing issues on GitHub
5. Create new issue with:
   - Clear description
   - Steps to reproduce
   - Expected vs actual behavior
   - Screenshots if applicable

---

**Happy Coding! 🚀**

*Keep this file handy for quick reference during development.*

