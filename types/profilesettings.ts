// FAQ and Quick Actions
interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

interface QuickAction {
  icon: string;
  label: string;
  action: string;
}

// Contact Support
interface ContactMethod {
  id: string;
  icon: string;
  title: string;
  subtitle: string;
  action: () => void;
  color: string;
}

interface ContactMethodData {
  id: string;
  icon: string;
  title: string;
  subtitle: string;
  color: string;
}

interface ContactInfo {
  email: string;
  businessEmail: string;
  phone: string;
  address: string;
  businessHours: string;
  supportHours: string;
  socialMedia: SocialMediaLink[];
}

interface SocialMediaLink {
  icon: string;
  name: string;
  url?: string;
}

// Privacy Policy and Terms
interface PolicySection {
  id: string;
  title: string;
  content: string[];
}

interface TermsSection {
  id: string;
  title: string;
  content: string[];
}

// Personal Information
interface UserInfo {
  id: string;
  displayCode: string;
  fullName: string;
  email: string;
  phone?: string | null;
  dob?: string | null;
  address?: string | null;
  profileImage?: string | null;
  role?: string;
  isActive?: boolean;
  customerTypeEnum?: 'kyc' | 'nonkyc'; // User type: kyc = traditional KYC users, nonkyc = wallet-only users
  walletAddress?: string | null; // Wallet address for non-KYC users
  createdAt?: string;
  updatedAt?: string;
}

// Security Settings
interface SecuritySettings {
  twoFactorAuth: boolean;
  biometricLogin: boolean;
}

// Bank Account
interface BankAccount {
  id: string;
  bankName: string;
  accountNumber: string;
  accountType: string;
  isPrimary: boolean;
  logo: string;
  backgroundColor: string[];
}

// Notification Settings
interface NotificationSettings {
  pushNotifications: boolean;
  emailNotifications: boolean;
  smsNotifications: boolean;
  investmentUpdates: boolean;
  propertyAlerts: boolean;
  monthlyReports: boolean;
  marketingOffers: boolean;
  securityAlerts: boolean;
  paymentReminders: boolean;
  portfolioMilestones: boolean;
}

// Language
interface Language {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
}

// Profile Menu
interface ProfileMenuItem {
  icon: string;
  label: string;
  action: string;
}

interface ProfileSection {
  title: string;
  items: ProfileMenuItem[];
}

// Notification Settings UI
interface NotificationSettingItem {
  key: keyof NotificationSettings;
  icon: string;
  label: string;
  description: string;
  recommended?: boolean;
}

interface NotificationSection {
  title: string;
  description: string;
  items: NotificationSettingItem[];
}

export type {
  FAQItem,
  QuickAction,
  ContactMethod,
  ContactMethodData,
  ContactInfo,
  SocialMediaLink,
  PolicySection,
  TermsSection,
  UserInfo,
  SecuritySettings,
  BankAccount,
  NotificationSettings,
  Language,
  ProfileMenuItem,
  ProfileSection,
  NotificationSettingItem,
  NotificationSection,
};