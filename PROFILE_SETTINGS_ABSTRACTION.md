# Profile Settings Abstraction Summary

## Overview
All profile settings screens now use centralized data from `@data/mockProfile.ts`, types from `@types/profilesettings.ts`, and services from `@services/useProfile.ts`.

## Changes Made

### 1. **Personal Information Screen** (`app/profilesettings/personalinfo.tsx`)
- **Before**: Hardcoded `UserInfo` interface and data
- **After**: Imports `mockUserInfo` from `@data/mockProfile` and `UserInfo` type from `@types/profilesettings`
- **Changes**:
  ```typescript
  import { mockUserInfo } from "@/data/mockProfile";
  import { UserInfo } from "@/types/profilesettings";
  
  const [userInfo, setUserInfo] = useState<UserInfo>(mockUserInfo);
  ```

### 2. **Security Screen** (`app/profilesettings/security.tsx`)
- **Before**: Hardcoded `SecuritySettings` interface and data
- **After**: Imports `mockSecuritySettings` from `@data/mockProfile` and `SecuritySettings` type from `@types/profilesettings`
- **Changes**:
  ```typescript
  import { mockSecuritySettings } from "@/data/mockProfile";
  import { SecuritySettings } from "@/types/profilesettings";
  
  const [settings, setSettings] = useState<SecuritySettings>(mockSecuritySettings);
  ```

### 3. **Linked Bank Accounts Screen** (`app/profilesettings/linkedbank.tsx`)
- **Before**: Hardcoded `BankAccount` interface and array of 3 mock accounts
- **After**: Imports `mockBankAccounts` from `@data/mockProfile` and `BankAccount` type from `@types/profilesettings`
- **Changes**:
  ```typescript
  import { mockBankAccounts } from "@/data/mockProfile";
  import { BankAccount } from "@/types/profilesettings";
  
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>(mockBankAccounts);
  ```

### 4. **Notification Settings Screen** (`app/profilesettings/notification.tsx`)
- **Before**: Hardcoded `NotificationSettings` interface and data with 10 settings
- **After**: Imports `mockNotificationSettings` from `@data/mockProfile` and `NotificationSettings` type from `@types/profilesettings`
- **Changes**:
  ```typescript
  import { mockNotificationSettings } from "@/data/mockProfile";
  import { NotificationSettings } from "@/types/profilesettings";
  
  const [settings, setSettings] = useState<NotificationSettings>(mockNotificationSettings);
  ```

### 5. **Language Screen** (`app/profilesettings/language.tsx`)
- **Before**: Hardcoded `Language` interface and array of 21 languages
- **After**: Imports `languages` from `@data/mockProfile` and `Language` type from `@types/profilesettings`
- **Changes**:
  ```typescript
  import { languages } from "@/data/mockProfile";
  import { Language } from "@/types/profilesettings";
  
  // Removed hardcoded languages array - now using imported data
  ```

### 6. **Contact Support Screen** (`app/profilesettings/contactsupport.tsx`)
- **Before**: Hardcoded contact methods, phone numbers, addresses, etc.
- **After**: Imports `contactInfo` and `contactMethodsData` from `@data/mockProfile`
- **Changes**:
  ```typescript
  import { contactInfo, contactMethodsData } from "@/data/mockProfile";
  import { ContactMethod, ContactMethodData } from "@/types/profilesettings";
  
  // Maps contactMethodsData with action handlers
  const contactMethods: ContactMethod[] = contactMethodsData.map((method) => ({
    ...method,
    action: getActionHandler(method.id)
  }));
  ```

### 7. **Privacy Policy Screen** (`app/profilesettings/privacypolicy.tsx`)
- **Already Abstracted**: Uses `privacyPolicySections` from `@data/mockProfile`
- **No Changes Needed**: Already properly abstracted

### 8. **Terms & Conditions Screen** (`app/profilesettings/termsandcondition.tsx`)
- **Already Abstracted**: Uses `termsOfServiceSections` from `@data/mockProfile`
- **No Changes Needed**: Already properly abstracted

### 9. **FAQs Screen** (`app/profilesettings/faqs.tsx`)
- **Already Abstracted**: Uses `faqs` and `quickActions` from `@data/mockProfile`
- **No Changes Needed**: Already properly abstracted

## Updated Files

### `types/profilesettings.ts`
- Contains all interfaces:
  - `FAQItem`, `QuickAction`
  - `ContactMethod`, `ContactMethodData`, `ContactInfo`, `SocialMediaLink`
  - `PolicySection`, `TermsSection`
  - `UserInfo`, `SecuritySettings`, `BankAccount`
  - `NotificationSettings`, `Language`

### `data/mockProfile.ts`
- Contains all mock data:
  - `quickActions`: Quick action buttons for support
  - `contactInfo`: Intelik contact information
  - `contactMethodsData`: Contact methods (chat, email, phone, WhatsApp)
  - `mockUserInfo`: User profile information
  - `mockSecuritySettings`: Security preferences
  - `mockBankAccounts`: Linked bank accounts (3 accounts)
  - `mockNotificationSettings`: Notification preferences
  - `languages`: Available languages (21 languages)
  - `faqs`: Frequently asked questions (32 FAQs across 8 categories)
  - `privacyPolicySections`: Privacy policy (11 sections)
  - `termsOfServiceSections`: Terms of service (16 sections)

### `services/useProfile.ts`
- Provides a centralized hook `useProfile()` that returns all profile-related data
- Provides utility functions:
  - `updateUserInfo()`: Update user information
  - `updateSecuritySettings()`: Update security preferences
  - `updateNotificationSettings()`: Update notification preferences
  - `addBankAccount()`: Add a new bank account
  - `removeBankAccount()`: Remove a bank account
  - `setPrimaryBankAccount()`: Set primary account
  - `getContactInfo()`: Get contact information
  - `getLanguages()`: Get available languages

## Benefits of Abstraction

1. **Single Source of Truth**: All data is centralized in `mockProfile.ts`
2. **Type Safety**: All interfaces defined in `profilesettings.ts`
3. **Reusability**: Services can be used across multiple screens
4. **Maintainability**: Changes to data structure only need to be made in one place
5. **Consistency**: All screens use the same data format
6. **Testability**: Easier to mock data for testing

## Integration with Intelik

All contact information now uses Intelik's data:
- Email: `contact@intelik.net`
- Business Email: `business@intelik.net`
- Phone: `+1 (800) 123-4567`
- Address: `123 Investment Street, Suite 500, San Francisco, CA 94105, United States`
- Social Media: Twitter, Facebook, Instagram, LinkedIn

## Usage Example

```typescript
// In any component
import { useProfile } from "@/services/useProfile";

function MyComponent() {
  const profile = useProfile();
  
  console.log(profile.userInfo);
  console.log(profile.bankAccounts);
  console.log(profile.languages);
  // etc.
}
```

## Future Enhancements

- Add API integration to replace mock data
- Add local storage persistence for user preferences
- Add validation for user input
- Add error handling for failed updates
- Add loading states for async operations

