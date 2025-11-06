import {
  UserInfo,
  SecuritySettings,
  BankAccount,
  NotificationSettings,
  Language,
  ContactInfo,
  FAQItem,
  PolicySection,
  TermsSection,
  ContactMethodData,
} from "@/types/profilesettings";
import {
  mockUserInfo,
  mockSecuritySettings,
  mockBankAccounts,
  mockNotificationSettings,
  languages,
  contactInfo,
  faqs,
  privacyPolicySections,
  termsOfServiceSections,
  contactMethodsData,
} from "@/data/mockProfile";

/**
 * Hook to get user profile information
 */
export function useProfile() {
  return {
    userInfo: mockUserInfo,
    securitySettings: mockSecuritySettings,
    bankAccounts: mockBankAccounts,
    notificationSettings: mockNotificationSettings,
    languages,
    contactInfo,
    faqs,
    privacyPolicySections,
    termsOfServiceSections,
    contactMethodsData,
  };
}

/**
 * Update user profile information
 */
export function updateUserInfo(updates: Partial<UserInfo>): Promise<UserInfo> {
  return new Promise((resolve) => {
    // Simulate API call
    setTimeout(() => {
      const updated = { ...mockUserInfo, ...updates };
      resolve(updated);
    }, 500);
  });
}

/**
 * Update security settings
 */
export function updateSecuritySettings(
  updates: Partial<SecuritySettings>
): Promise<SecuritySettings> {
  return new Promise((resolve) => {
    // Simulate API call
    setTimeout(() => {
      const updated = { ...mockSecuritySettings, ...updates };
      resolve(updated);
    }, 500);
  });
}

/**
 * Update notification settings
 */
export function updateNotificationSettings(
  updates: Partial<NotificationSettings>
): Promise<NotificationSettings> {
  return new Promise((resolve) => {
    // Simulate API call
    setTimeout(() => {
      const updated = { ...mockNotificationSettings, ...updates };
      resolve(updated);
    }, 500);
  });
}

/**
 * Add a bank account
 */
export function addBankAccount(account: Omit<BankAccount, "id">): Promise<BankAccount> {
  return new Promise((resolve) => {
    // Simulate API call
    setTimeout(() => {
      const newAccount: BankAccount = {
        ...account,
        id: String(Date.now()),
      };
      resolve(newAccount);
    }, 500);
  });
}

/**
 * Remove a bank account
 */
export function removeBankAccount(accountId: string): Promise<boolean> {
  return new Promise((resolve) => {
    // Simulate API call
    setTimeout(() => {
      resolve(true);
    }, 500);
  });
}

/**
 * Set primary bank account
 */
export function setPrimaryBankAccount(accountId: string): Promise<boolean> {
  return new Promise((resolve) => {
    // Simulate API call
    setTimeout(() => {
      resolve(true);
    }, 500);
  });
}

/**
 * Get contact information
 */
export function getContactInfo(): ContactInfo {
  return contactInfo;
}

/**
 * Get available languages
 */
export function getLanguages(): Language[] {
  return languages;
}

