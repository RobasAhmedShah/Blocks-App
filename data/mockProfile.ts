import {
  FAQItem,
  QuickAction,
  ContactInfo,
  ContactMethodData,
  SocialMediaLink,
  PolicySection,
  TermsSection,
  UserInfo,
  SecuritySettings,
  BankAccount,
  NotificationSettings,
  Language,
  ProfileSection,
  NotificationSection,
} from "@/types/profilesettings";

// Quick Actions
export const quickActions: QuickAction[] = [
    { icon: "chatbubbles", label: "Live Chat", action: "chat" },
    { icon: "mail", label: "Email Us", action: "email" },
    { icon: "call", label: "Call Support", action: "call" },
    { icon: "book", label: "Guide", action: "guide" },
  ];

// Contact Information (Intelik)
export const contactInfo: ContactInfo = {
  email: "contact@intelik.net",
  businessEmail: "business@intelik.net",
  phone: "+1 (800) 123-4567",
  address: "123 Investment Street, Suite 500\nSan Francisco, CA 94105\nUnited States",
  businessHours: "Monday - Friday: 9:00 AM - 6:00 PM EST\nSaturday: 10:00 AM - 4:00 PM EST\nSunday: Closed",
  supportHours: "24/7 Support Available",
  socialMedia: [
    { icon: "logo-twitter", name: "Twitter", url: "https://twitter.com/intelik" },
    { icon: "logo-facebook", name: "Facebook", url: "https://facebook.com/intelik" },
    { icon: "logo-instagram", name: "Instagram", url: "https://instagram.com/intelik" },
    { icon: "logo-linkedin", name: "LinkedIn", url: "https://linkedin.com/company/intelik" },
  ],
  
};
  
// Contact Methods Data (without action handlers)
export const contactMethodsData: ContactMethodData[] = [
  {
    id: "chat",
    icon: "chatbubbles",
    title: "Live Chat",
    subtitle: "Average response: 2 minutes",
    color: "#0da5a5",
  },
  {
    id: "email",
    icon: "mail",
    title: "Email Support",
    subtitle: contactInfo.email,
    color: "#0da5a5",
  },
  {
    id: "phone",
    icon: "call",
    title: "Phone Support",
    subtitle: contactInfo.phone,
    color: "#0da5a5",
  },
  {
    id: "whatsapp",
    icon: "logo-whatsapp",
    title: "WhatsApp",
    subtitle: "Chat on WhatsApp",
    color: "#25D366",
  },
];
  


// User Information
export const mockUserInfo: UserInfo = {
  fullName: "Jordan Smith",
  email: "jordan.smith@email.com",
  phone: "+1 (555) 123-4567",
  dob: "1990-05-15",
  address: "123 Market St, Suite 200\nSan Francisco, CA 94103",
  profileImage: "https://lh3.googleusercontent.com/aida-public/AB6AXuDUQTVI4GmmZSNqHVKlBtkECE8EXneO5APGyiwiS0A_9vhIejSw4VReGzra1bZlvfYIfD_b8wr7Ci-vAC-Ev-65NOCLRTL7_rVR3TtaZm4Ui6ZzuQpnFA9RKIPi8YnHv_gdqVguPj1KR4V-bFX0mWsXbRSofAgRo-ZLbkZHbsOYzDJt_kEIzgNzZFrXFMNT1eGY0fe674o-rnTYvySJCqchFmZimxGzflbVkuHNrpZvoLhn9klHR6SfVjf_WOm9t1V1ZwimD5GBJLI",
};

// Security Settings
export const mockSecuritySettings: SecuritySettings = {
  twoFactorAuth: true,
  biometricLogin: false,
};

// Bank Accounts
// export const mockBankAccounts: BankAccount[] = [
//   {
//     id: "1",
//     bankName: "Chase Bank",
//     accountNumber: "****4829",
//     accountType: "Checking",
//     isPrimary: true,
//     logo: "💳",
//     backgroundColor: ["#1E40AF", "#1E3A8A"],
//   },
//   {
//     id: "2",
//     bankName: "Bank of America",
//     accountNumber: "****7156",
//     accountType: "Savings",
//     isPrimary: false,
//     logo: "💳",
//     backgroundColor: ["#DC2626", "#B91C1C"],
//   },
//   {
//     id: "3",
//     bankName: "Wells Fargo",
//     accountNumber: "****3492",
//     accountType: "Checking",
//     isPrimary: false,
//     logo: "💳",
//     backgroundColor: ["#CA8A04", "#A16207"],
//   },
// ];

// In your types file or where you define initial bank accounts
export const professionalBankAccounts: BankAccount[] = [
  {
    id: "1",
    bankName: "Chase Bank",
    accountNumber: "****4829",
    accountType: "Checking",
    isPrimary: true,
    logo: "💳",
    // Chase Blue - Professional navy blue gradient
    backgroundColor: ["#0F4C81", "#1565C0"],
  },
  {
    id: "2",
    bankName: "Bank of America",
    accountNumber: "****7156",
    accountType: "Savings",
    isPrimary: false,
    logo: "💳",
    // Bank of America Red - Elegant deep red gradient
    backgroundColor: ["#C41E3A", "#8B0000"],
  },
  {
    id: "3",
    bankName: "Wells Fargo",
    accountNumber: "****3492",
    accountType: "Checking",
    isPrimary: false,
    logo: "💳",
    // Wells Fargo Red/Gold - Professional burgundy gradient
    backgroundColor: ["#D71920", "#A50F15"],
  },
  {
    id: "4",
    bankName: "Citibank",
    accountNumber: "****8521",
    accountType: "Savings",
    isPrimary: false,
    logo: "💳",
    // Citibank Blue - Corporate blue gradient
    backgroundColor: ["#003DA5", "#002D72"],
  },
  {
    id: "5",
    bankName: "Capital One",
    accountNumber: "****2946",
    accountType: "Checking",
    isPrimary: false,
    logo: "💳",
    // Capital One - Modern slate gradient
    backgroundColor: ["#004977", "#003557"],
  },
];

// Notification Settings
export const mockNotificationSettings: NotificationSettings = {
  pushNotifications: true,
  emailNotifications: true,
  smsNotifications: false,
  investmentUpdates: true,
  propertyAlerts: true,
  monthlyReports: true,
  marketingOffers: false,
  securityAlerts: true,
  paymentReminders: true,
  portfolioMilestones: true,
};

// Languages
export const languages: Language[] = [
  { code: "en", name: "English", nativeName: "English", flag: "🇺🇸" },
  { code: "es", name: "Spanish", nativeName: "Español", flag: "🇪🇸" },
  { code: "fr", name: "French", nativeName: "Français", flag: "🇫🇷" },
  { code: "de", name: "German", nativeName: "Deutsch", flag: "🇩🇪" },
  { code: "ur", name: "Urdu", nativeName: "اردو", flag: "🇵🇰" },
  { code: "it", name: "Italian", nativeName: "Italiano", flag: "🇮🇹" },
  { code: "pt", name: "Portuguese", nativeName: "Português", flag: "🇵🇹" },
  { code: "ru", name: "Russian", nativeName: "Русский", flag: "🇷🇺" },
  { code: "zh", name: "Chinese", nativeName: "中文", flag: "🇨🇳" },
  { code: "ja", name: "Japanese", nativeName: "日本語", flag: "🇯🇵" },
  { code: "ko", name: "Korean", nativeName: "한국어", flag: "🇰🇷" },
  { code: "ar", name: "Arabic", nativeName: "العربية", flag: "🇸🇦" },
  { code: "hi", name: "Hindi", nativeName: "हिन्दी", flag: "🇮🇳" },
  { code: "bn", name: "Bengali", nativeName: "বাংলা", flag: "🇧🇩" },
  { code: "tr", name: "Turkish", nativeName: "Türkçe", flag: "🇹🇷" },
  { code: "vi", name: "Vietnamese", nativeName: "Tiếng Việt", flag: "🇻🇳" },
  { code: "th", name: "Thai", nativeName: "ไทย", flag: "🇹🇭" },
  { code: "id", name: "Indonesian", nativeName: "Bahasa Indonesia", flag: "🇮🇩" },
  { code: "nl", name: "Dutch", nativeName: "Nederlands", flag: "🇳🇱" },
  { code: "pl", name: "Polish", nativeName: "Polski", flag: "🇵🇱" },
  { code: "sv", name: "Swedish", nativeName: "Svenska", flag: "🇸🇪" },
  ];

  export const faqs: FAQItem[] = [
    // Getting Started
    {
      id: "1",
      category: "Getting Started",
      question: "How does tokenized real estate investment work?",
      answer: "Tokenized real estate allows you to invest in properties by purchasing digital tokens. Each token represents a fractional ownership share of the property. You can buy tokens starting from the minimum investment amount, and you'll receive proportional rental income and potential capital appreciation based on your token ownership."
    },
    {
      id: "2",
      category: "Getting Started",
      question: "What is the minimum investment amount?",
      answer: "The minimum investment varies by property, typically ranging from $500 to $1,200. Each property listing shows its specific minimum investment requirement. You can invest any amount above the minimum, and it will be converted into tokens based on the property's token price."
    },
    {
      id: "3",
      category: "Getting Started",
      question: "How do I get started with investing?",
      answer: "Getting started is easy! Navigate to the Portfolio section and click the 'Guide' button. Our investment guidance tool will help you set your investment goals, select suitable properties, and create a personalized investment plan. You can also browse available properties directly from the Properties tab."
    },
    {
      id: "4",
      category: "Getting Started",
      question: "Do I need to be an accredited investor?",
      answer: "No, our platform is designed to make real estate investment accessible to everyone. You don't need to be an accredited investor to start investing. However, please ensure you understand the risks involved and invest only what you can afford to lose."
    },
    
    // Investments
    {
      id: "5",
      category: "Investments",
      question: "How do I receive rental income from my investments?",
      answer: "Rental income is distributed monthly to your wallet based on your token ownership percentage. The income is automatically calculated and credited to your USDC balance. You can track all rental payments in your Portfolio section under the Income Timeline."
    },
    {
      id: "6",
      category: "Investments",
      question: "What is ROI and how is it calculated?",
      answer: "ROI (Return on Investment) represents your annual return percentage. It's calculated based on rental yield and potential property appreciation. The displayed ROI is an estimate based on current market conditions and property performance. Actual returns may vary."
    },
    {
      id: "7",
      category: "Investments",
      question: "Can I invest in multiple properties?",
      answer: "Yes! You can diversify your portfolio by investing in multiple properties. Each investment is tracked separately in your Portfolio, and you'll receive rental income from all properties you own tokens in. Diversification helps spread risk across different property types and locations."
    },
    {
      id: "8",
      category: "Investments",
      question: "What happens if a property doesn't perform well?",
      answer: "Property performance can vary based on market conditions. While we carefully vet all properties, returns are not guaranteed. If a property underperforms, your rental income may be lower than expected. However, you still own your tokens and can benefit from potential property appreciation or sell your tokens on the secondary market."
    },
    {
      id: "9",
      category: "Investments",
      question: "How are properties selected for the platform?",
      answer: "All properties undergo rigorous due diligence including financial analysis, market research, and builder verification. We only list properties from verified builders with strong track records. Each property must meet our standards for location, potential returns, and market demand."
    },
    
    // Payments & Withdrawals
    {
      id: "10",
      category: "Payments & Withdrawals",
      question: "How do I deposit funds into my wallet?",
      answer: "You can deposit funds using multiple methods: Debit/Credit Card for instant deposits, Binance Pay for fast payments, or On-Chain Transfer for crypto deposits. Navigate to Wallet > Deposit to see all available options. Deposits are typically processed instantly or within a few minutes depending on the method."
    },
    {
      id: "11",
      category: "Payments & Withdrawals",
      question: "How do I withdraw my investment or earnings?",
      answer: "You can withdraw funds from your wallet at any time. Go to Wallet > Withdraw and select your preferred withdrawal method. Note that withdrawing your investment requires selling your tokens first, which can be done through the Portfolio section. Rental income can be withdrawn directly from your wallet balance."
    },
    {
      id: "12",
      category: "Payments & Withdrawals",
      question: "Are there any fees for deposits or withdrawals?",
      answer: "Deposit fees vary by method: Card deposits have a 2.9% processing fee, Binance Pay has no fees, and On-Chain transfers may have network fees. Withdrawal fees depend on the method and amount. All fees are clearly displayed before you confirm any transaction."
    },
    {
      id: "13",
      category: "Payments & Withdrawals",
      question: "How long do withdrawals take?",
      answer: "Withdrawal processing times vary: Bank transfers typically take 1-3 business days, while crypto withdrawals are usually processed within 24 hours. Card withdrawals may take 3-5 business days. You'll receive a notification once your withdrawal is processed."
    },
    
    // Tokens & Ownership
    {
      id: "14",
      category: "Tokens & Ownership",
      question: "What are tokens and how do they work?",
      answer: "Tokens represent fractional ownership shares in a property. Each property is divided into a fixed number of tokens. When you invest, you receive tokens proportional to your investment amount. Token ownership entitles you to a share of rental income and potential property appreciation."
    },
    {
      id: "15",
      category: "Tokens & Ownership",
      question: "Can I sell my tokens?",
      answer: "Yes, you can sell your tokens on our secondary market. Token prices are determined by market demand and property performance. You can list your tokens for sale or purchase tokens from other investors. The platform facilitates secure token transfers between users."
    },
    {
      id: "16",
      category: "Tokens & Ownership",
      question: "Do I own the actual property?",
      answer: "You own tokens that represent fractional ownership of the property. While you don't own a physical portion of the property, you have legal rights to your proportional share of rental income and property value. All property ownership is held in a legal entity, and token holders are beneficiaries."
    },
    {
      id: "17",
      category: "Tokens & Ownership",
      question: "What happens when a property is sold?",
      answer: "If a property is sold, token holders receive their proportional share of the sale proceeds based on their token ownership. The distribution is automatic and will be credited to your wallet. You'll be notified in advance if a property sale is planned."
    },
    
    // Returns & ROI
    {
      id: "18",
      category: "Returns & ROI",
      question: "How often do I receive rental income?",
      answer: "Rental income is distributed monthly to all token holders. Payments are typically made by the 5th of each month for the previous month's rental income. You can view your income history and upcoming payments in the Portfolio section."
    },
    {
      id: "19",
      category: "Returns & ROI",
      question: "What is the expected return on investment?",
      answer: "Expected returns vary by property, typically ranging from 5% to 12% annually. Returns are based on rental yield and potential property appreciation. Each property listing shows its estimated ROI. Remember that these are estimates and actual returns may vary based on market conditions."
    },
    {
      id: "20",
      category: "Returns & ROI",
      question: "Are returns guaranteed?",
      answer: "No, returns are not guaranteed. Real estate investments carry risks, and actual returns may differ from estimates. Property values can fluctuate, rental income may vary, and market conditions can impact performance. Always invest responsibly and only what you can afford to lose."
    },
    {
      id: "21",
      category: "Returns & ROI",
      question: "How is rental income calculated?",
      answer: "Rental income is calculated based on your token ownership percentage. If a property generates $10,000 in monthly rent and you own 5% of the tokens, you'll receive $500. The calculation is: (Your Tokens / Total Tokens) × Monthly Rental Income = Your Monthly Payment."
    },
    
    // Security & Safety
    {
      id: "22",
      category: "Security & Safety",
      question: "Is my investment secure?",
      answer: "We use industry-standard security measures including encryption, secure wallets, and blockchain technology for token transactions. All properties are legally structured, and your ownership is recorded on the blockchain. However, all investments carry risk, and you should only invest what you can afford to lose."
    },
    {
      id: "23",
      category: "Security & Safety",
      question: "What happens if the platform shuts down?",
      answer: "Your token ownership is recorded on the blockchain, which means your investment is not dependent on our platform. Even if the platform were to shut down, you would still own your tokens and could transfer them to another compatible platform or wallet. Property ownership is held in separate legal entities."
    },
    {
      id: "24",
      category: "Security & Safety",
      question: "How do I protect my account?",
      answer: "Enable two-factor authentication (2FA) in Security settings, use a strong unique password, and never share your credentials. Be cautious of phishing attempts and always verify you're on the official app. Enable biometric authentication if available on your device for added security."
    },
    {
      id: "25",
      category: "Security & Safety",
      question: "Are my personal details safe?",
      answer: "Yes, we take data privacy seriously. Your personal information is encrypted and stored securely. We comply with data protection regulations and never share your information with third parties without your consent. You can review our Privacy Policy in the app settings."
    },
    
    // Account & Settings
    {
      id: "26",
      category: "Account & Settings",
      question: "How do I update my profile information?",
      answer: "Go to Profile > Edit Profile to update your name, email, phone number, and profile picture. Changes are saved automatically. Some information may require verification before it's updated."
    },
    {
      id: "27",
      category: "Account & Settings",
      question: "Can I change my investment plan?",
      answer: "Yes, you can modify your investment plan at any time. Go to Portfolio > Guidance to edit your plan, adjust your investment amount, or select different properties. Changes will apply to future investments, while existing investments remain unchanged."
    },
    {
      id: "28",
      category: "Account & Settings",
      question: "How do I change my notification preferences?",
      answer: "Navigate to Profile > Notifications to customize which notifications you receive. You can enable or disable notifications for rental income, property updates, investment opportunities, and account security alerts."
    },
    {
      id: "29",
      category: "Account & Settings",
      question: "What payment methods are supported?",
      answer: "We support multiple payment methods: Debit/Credit Cards (Visa, Mastercard), Binance Pay, and On-Chain crypto transfers (USDC, MATIC, BNB, ETH). Supported networks include Polygon, BNB Chain, and Ethereum. Check the Deposit section for all available options."
    },
    
    // Technical Support
    {
      id: "30",
      category: "Technical Support",
      question: "The app is not loading properly. What should I do?",
      answer: "Try these steps: 1) Close and restart the app, 2) Check your internet connection, 3) Clear the app cache (Settings > Clear Cache), 4) Update to the latest app version, 5) Restart your device. If issues persist, contact support through Live Chat or Email."
    },
    {
      id: "31",
      category: "Technical Support",
      question: "I'm having trouble with a transaction. Who can help?",
      answer: "If you're experiencing issues with deposits, withdrawals, or investments, contact our support team immediately. Use Live Chat for instant help, Email for detailed inquiries, or Call Support for urgent matters. Have your transaction ID ready for faster assistance."
    },
    {
      id: "32",
      category: "Technical Support",
      question: "How do I report a bug or issue?",
      answer: "Report bugs through the app's feedback feature in Profile > Help & Support, or contact us via Email with details about the issue, your device model, app version, and steps to reproduce the problem. We'll investigate and get back to you promptly."
    }
  ];

// Privacy Policy Sections
export const privacyPolicySections: PolicySection[] = [
  {
    id: "1",
    title: "Introduction",
    content: [
      "Welcome to Blocks by Intelik. We respect your privacy and are committed to protecting your personal data. This privacy policy will inform you about how we look after your personal data when you visit our platform and tell you about your privacy rights.",
      "Blocks operates a real estate investment platform that allows users to invest in tokenized real estate properties. This policy applies to all users of our services.",
      "It is important that you read this privacy policy together with any other privacy notice we may provide on specific occasions when we are collecting or processing personal data about you.",
    ],
  },
  {
    id: "2",
    title: "Information We Collect",
    content: [
      "We collect and process the following types of personal information:",
      "• Identity Data: First name, last name, username, date of birth, and government-issued ID information for verification purposes.",
      "• Contact Data: Email address, telephone number, and physical address.",
      "• Financial Data: Bank account details, payment card details, transaction history, and investment information.",
      "• Technical Data: IP address, browser type and version, device information, time zone setting, browser plug-in types and versions, operating system and platform.",
      "• Usage Data: Information about how you use our platform, products, and services.",
      "• Marketing Data: Your preferences in receiving marketing from us and your communication preferences.",
    ],
  },
  {
    id: "3",
    title: "How We Use Your Information",
    content: [
      "We use your personal information for the following purposes:",
      "• To register you as a new customer and verify your identity in compliance with KYC (Know Your Customer) and AML (Anti-Money Laundering) regulations.",
      "• To process and deliver your investments, including managing payments, fees, and charges.",
      "• To manage our relationship with you, including notifying you about changes to our terms or privacy policy and asking you to review or provide feedback.",
      "• To enable you to participate in contests or surveys.",
      "• To administer and protect our business and platform, including troubleshooting, data analysis, testing, system maintenance, support, reporting, and hosting.",
      "• To deliver relevant content and advertisements to you and measure the effectiveness of our marketing campaigns.",
      "• To use data analytics to improve our platform, products, services, marketing, customer relationships, and user experience.",
    ],
  },
  {
    id: "4",
    title: "Data Security",
    content: [
      "We have implemented appropriate security measures to prevent your personal data from being accidentally lost, used, accessed, altered, or disclosed in an unauthorized way.",
      "Our security measures include:",
      "• Encryption of sensitive data both in transit and at rest using industry-standard protocols.",
      "• Regular security assessments and penetration testing.",
      "• Multi-factor authentication for account access.",
      "• Strict access controls limiting who can access your personal data.",
      "• Regular staff training on data protection and security best practices.",
      "We have procedures in place to deal with any suspected personal data breach and will notify you and any applicable regulator of a breach where we are legally required to do so.",
    ],
  },
  {
    id: "5",
    title: "Data Retention",
    content: [
      "We will only retain your personal data for as long as necessary to fulfill the purposes we collected it for, including for the purposes of satisfying any legal, accounting, or reporting requirements.",
      "To determine the appropriate retention period, we consider the amount, nature, and sensitivity of the personal data, the potential risk of harm from unauthorized use or disclosure, the purposes for which we process your personal data, and applicable legal requirements.",
      "In some circumstances, we may anonymize your personal data so that it can no longer be associated with you, in which case we may use such information without further notice to you.",
    ],
  },
  {
    id: "6",
    title: "Your Legal Rights",
    content: [
      "Under certain circumstances, you have rights under data protection laws in relation to your personal data:",
      "• Request access to your personal data (data subject access request).",
      "• Request correction of your personal data.",
      "• Request erasure of your personal data.",
      "• Object to processing of your personal data.",
      "• Request restriction of processing your personal data.",
      "• Request transfer of your personal data.",
      "• Right to withdraw consent.",
      "If you wish to exercise any of these rights, please contact us at privacy@intelik.net or business@intelik.net.",
    ],
  },
  {
    id: "7",
    title: "Third-Party Links",
    content: [
      "Our platform may include links to third-party websites, plug-ins, and applications. Clicking on those links or enabling those connections may allow third parties to collect or share data about you.",
      "We do not control these third-party websites and are not responsible for their privacy statements. When you leave our platform, we encourage you to read the privacy policy of every website you visit.",
    ],
  },
  {
    id: "8",
    title: "Cookies",
    content: [
      "Our platform uses cookies to distinguish you from other users. This helps us provide you with a good experience when you use our platform and allows us to improve our services.",
      "You can set your browser to refuse all or some browser cookies or to alert you when websites set or access cookies. If you disable or refuse cookies, please note that some parts of our platform may become inaccessible or not function properly.",
    ],
  },
  {
    id: "9",
    title: "International Transfers",
    content: [
      "We may transfer your personal data outside your country of residence. Whenever we transfer your personal data out of your country, we ensure a similar degree of protection is afforded to it by implementing appropriate safeguards.",
    ],
  },
  {
    id: "10",
    title: "Changes to This Policy",
    content: [
      "We may update this privacy policy from time to time. We will notify you of any changes by posting the new privacy policy on this page and updating the 'Last Updated' date.",
      "You are advised to review this privacy policy periodically for any changes. Changes to this privacy policy are effective when they are posted on this page.",
    ],
  },
  {
    id: "11",
    title: "Contact Us",
    content: [
      "If you have any questions about this privacy policy or our privacy practices, please contact us:",
      "• Email: privacy@intelik.net",
      "• Business Email: business@intelik.net",
      "• Phone: +1 (800) 123-4567",
      "• Address: 123 Investment Street, Suite 500, San Francisco, CA 94105",
      "You also have the right to make a complaint to a data protection authority about our collection and use of your personal information.",
    ],
  },
];

// Terms of Service Sections
export const profileSections: ProfileSection[] = [
  {
    title: "Account Settings",
    items: [
      { icon: "person-outline", label: "Personal Information", action: 'personalinfo' },
      { icon: "shield-outline", label: "Security", action: 'security' },
      { icon: "card-outline", label: "Linked Bank Accounts", action: 'linkedbankaccounts' },
    ],
  },
  {
    title: "App Preferences",
    items: [
      { icon: "notifications-outline", label: "Notifications", action: 'notifications' },
      { icon: "contrast-outline", label: "Theme", action: 'theme' },
      { icon: "language-outline", label: "Language", action: 'language' },
    ],
  },
  {
    title: "Support & Legal",
    items: [
      { icon: "help-circle-outline", label: "Help & FAQ", action: 'helpfaq' },
      { icon: "headset-outline", label: "Contact Support", action: 'contactsupport' },
      { icon: "lock-closed-outline", label: "Privacy Policy", action: 'privacypolicy' },
      { icon: "document-text-outline", label: "Terms of Service", action: 'termsofservice' },
    ],
  },
];

export const notificationSections: NotificationSection[] = [
  {
    title: "Notification Channels",
    description: "Choose how you want to receive notifications",
    items: [
      {
        key: "pushNotifications",
        icon: "notifications",
        label: "Push Notifications",
        description: "Receive alerts on your device",
      },
      {
        key: "emailNotifications",
        icon: "mail",
        label: "Email Notifications",
        description: "Get updates via email",
      },
      {
        key: "smsNotifications",
        icon: "chatbox",
        label: "SMS Notifications",
        description: "Receive text messages",
      },
    ],
  },
  {
    title: "Investment Notifications",
    description: "Stay updated on your investments",
    items: [
      {
        key: "investmentUpdates",
        icon: "trending-up",
        label: "Investment Updates",
        description: "New investment opportunities",
      },
      {
        key: "propertyAlerts",
        icon: "home",
        label: "Property Alerts",
        description: "Updates on your properties",
      },
      {
        key: "monthlyReports",
        icon: "document-text",
        label: "Monthly Reports",
        description: "Performance summaries",
      },
      {
        key: "portfolioMilestones",
        icon: "trophy",
        label: "Portfolio Milestones",
        description: "Achievement notifications",
      },
    ],
  },
  {
    title: "Account & Security",
    description: "Important account notifications",
    items: [
      {
        key: "securityAlerts",
        icon: "shield-checkmark",
        label: "Security Alerts",
        description: "Login and security updates",
        recommended: true,
      },
      {
        key: "paymentReminders",
        icon: "card",
        label: "Payment Reminders",
        description: "Upcoming payment notifications",
      },
    ],
  },
  {
    title: "Marketing & Promotions",
    description: "Offers and news from Blocks",
    items: [
      {
        key: "marketingOffers",
        icon: "pricetag",
        label: "Marketing & Offers",
        description: "Promotional content and deals",
      },
    ],
  },
];

export const termsOfServiceSections: TermsSection[] = [
  {
    id: "1",
    title: "Agreement to Terms",
    content: [
      "By accessing or using the Blocks platform, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using or accessing this platform.",
      "These Terms constitute a legally binding agreement between you and Blocks by Intelik. We reserve the right to change or modify these Terms at any time and in our sole discretion. If we make changes, we will provide notice through our platform or by other means to provide you the opportunity to review the changes.",
      "Your continued use of the platform after such notice will constitute your acceptance of the revised Terms.",
    ],
  },
  {
    id: "2",
    title: "Eligibility and Account Registration",
    content: [
      "To use our services, you must be at least 18 years old and have the legal capacity to enter into binding contracts. By creating an account, you represent and warrant that:",
      "• You are at least 18 years of age or the age of majority in your jurisdiction.",
      "• All information you provide is accurate, current, and complete.",
      "• You will maintain the accuracy of such information.",
      "• You have not been previously suspended or removed from our platform.",
      "• Your use of the services does not violate any applicable law or regulation.",
      "You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to notify us immediately of any unauthorized access or use of your account.",
    ],
  },
  {
    id: "3",
    title: "Investment Risks",
    content: [
      "IMPORTANT: Real estate investment involves significant risks, and you may lose some or all of your invested capital. Before investing, you should carefully consider your investment objectives, level of experience, and risk appetite.",
      "Key risks include but are not limited to:",
      "• Property value may decrease, resulting in capital loss.",
      "• Rental income is not guaranteed and may fluctuate.",
      "• Properties may experience vacancy periods with no income generation.",
      "• Real estate markets can be illiquid, and you may not be able to sell your tokens when desired.",
      "• Economic downturns may affect property values and rental demand.",
      "• Natural disasters, property damage, or other unforeseen events may impact returns.",
      "Past performance is not indicative of future results. All investments carry risk, and you should only invest what you can afford to lose.",
    ],
  },
  {
    id: "4",
    title: "Platform Services",
    content: [
      "Blocks provides a platform for fractional real estate investment through tokenization. Our services include:",
      "• Access to investment opportunities in tokenized real estate properties.",
      "• A marketplace for buying and selling property tokens.",
      "• Portfolio management and tracking tools.",
      "• Distribution of rental income and investment returns.",
      "• Property information, analytics, and reporting.",
      "We reserve the right to modify, suspend, or discontinue any aspect of our services at any time, with or without notice. We are not liable for any modification, suspension, or discontinuance of services.",
    ],
  },
  {
    id: "5",
    title: "Token Ownership and Rights",
    content: [
      "When you purchase tokens through our platform, you acquire a fractional ownership interest in the underlying real estate property. Token ownership grants you:",
      "• A proportional share of rental income generated by the property.",
      "• A proportional share of any appreciation in property value.",
      "• The right to trade your tokens on our marketplace, subject to any lock-up periods.",
      "• Voting rights on certain property-related decisions, where applicable.",
      "Token ownership does NOT grant you:",
      "• Direct ownership of the physical property.",
      "• The right to occupy or use the property.",
      "• Control over property management decisions.",
      "• The ability to mortgage or encumber the underlying property.",
    ],
  },
  {
    id: "6",
    title: "Fees and Payments",
    content: [
      "By using our platform, you agree to pay all applicable fees. Our fee structure includes:",
      "• Platform Fee: A percentage charged on each investment (typically 1-2%).",
      "• Management Fee: An annual fee on property management (typically 1-2% of property value).",
      "• Transaction Fee: Charged on secondary market token sales.",
      "• Withdrawal Fee: May apply to certain withdrawal methods.",
      "All fees are clearly disclosed before you complete any transaction. Fees are subject to change with 30 days' notice.",
      "You are responsible for all taxes associated with your investments and any income received through our platform. We recommend consulting with a tax professional regarding your specific situation.",
    ],
  },
  {
    id: "7",
    title: "KYC and Compliance",
    content: [
      "To comply with applicable laws and regulations, including Anti-Money Laundering (AML) and Know Your Customer (KYC) requirements, we require all users to:",
      "• Provide accurate identification information.",
      "• Submit government-issued identification documents.",
      "• Verify your identity through our verification process.",
      "• Update your information if there are any changes.",
      "We reserve the right to request additional information or documentation at any time. Failure to comply with verification requirements may result in account suspension or termination.",
      "We may report suspicious activities to relevant authorities as required by law.",
    ],
  },
  {
    id: "8",
    title: "Prohibited Activities",
    content: [
      "You agree not to engage in any of the following prohibited activities:",
      "• Using the platform for any illegal purpose or in violation of any laws.",
      "• Attempting to gain unauthorized access to our systems or other user accounts.",
      "• Interfering with or disrupting the platform's operation or servers.",
      "• Transmitting viruses, malware, or other malicious code.",
      "• Engaging in fraudulent activities or misrepresenting your identity.",
      "• Manipulating prices or engaging in market manipulation.",
      "• Using automated systems or bots to access the platform.",
      "• Sharing your account credentials with others.",
      "• Violating intellectual property rights of Blocks or third parties.",
      "Violation of these terms may result in immediate account termination and legal action.",
    ],
  },
  {
    id: "9",
    title: "Intellectual Property",
    content: [
      "The Blocks platform, including all content, features, functionality, designs, logos, and trademarks, is owned by Blocks by Intelik and is protected by copyright, trademark, and other intellectual property laws.",
      "You are granted a limited, non-exclusive, non-transferable license to access and use the platform for its intended purpose. You may not:",
      "• Copy, modify, or create derivative works of our platform or content.",
      "• Reverse engineer or attempt to extract source code.",
      "• Remove or alter any copyright, trademark, or proprietary notices.",
      "• Use our intellectual property for commercial purposes without permission.",
      "• Frame or mirror any part of the platform without written authorization.",
    ],
  },
  {
    id: "10",
    title: "Disclaimers and Limitation of Liability",
    content: [
      "THE PLATFORM IS PROVIDED 'AS IS' AND 'AS AVAILABLE' WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED.",
      "We disclaim all warranties, including but not limited to:",
      "• Warranties of merchantability or fitness for a particular purpose.",
      "• Warranties regarding accuracy, reliability, or availability of content.",
      "• Warranties that the platform will be uninterrupted or error-free.",
      "TO THE MAXIMUM EXTENT PERMITTED BY LAW, BLOCKS BY INTELIK SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING LOSS OF PROFITS, DATA, OR OTHER INTANGIBLE LOSSES.",
      "Our total liability for any claims arising from your use of the platform shall not exceed the amount you paid to us in the twelve months preceding the claim.",
    ],
  },
  {
    id: "11",
    title: "Indemnification",
    content: [
      "You agree to indemnify, defend, and hold harmless Blocks by Intelik, its affiliates, officers, directors, employees, and agents from any claims, liabilities, damages, losses, costs, or expenses arising from:",
      "• Your use or misuse of the platform.",
      "• Your violation of these Terms of Service.",
      "• Your violation of any rights of third parties.",
      "• Your violation of any applicable laws or regulations.",
      "This indemnification obligation will survive termination of your account and these Terms.",
    ],
  },
  {
    id: "12",
    title: "Dispute Resolution",
    content: [
      "Any dispute arising from these Terms or your use of the platform shall be resolved through binding arbitration, except that either party may seek injunctive relief in court.",
      "Arbitration shall be conducted by a single arbitrator in accordance with the rules of the American Arbitration Association. The arbitration shall take place in San Francisco, California.",
      "You waive any right to participate in a class action lawsuit or class-wide arbitration.",
      "If any provision of this arbitration agreement is found to be unenforceable, the remainder shall remain in full force and effect.",
    ],
  },
  {
    id: "13",
    title: "Termination",
    content: [
      "We reserve the right to suspend or terminate your account at any time, with or without cause, and with or without notice. Reasons for termination may include:",
      "• Violation of these Terms of Service.",
      "• Fraudulent or illegal activity.",
      "• Non-compliance with KYC/AML requirements.",
      "• Extended period of inactivity.",
      "• At our sole discretion for any reason.",
      "Upon termination, your right to use the platform will immediately cease. However, your obligations under these Terms, including payment obligations and liability provisions, will survive termination.",
      "You may terminate your account at any time by contacting our support team. Upon termination, you will still have access to your investment holdings and can withdraw available funds subject to platform policies.",
    ],
  },
  {
    id: "14",
    title: "Governing Law",
    content: [
      "These Terms shall be governed by and construed in accordance with the laws of the State of California, United States, without regard to its conflict of law provisions.",
      "You agree to submit to the personal jurisdiction of the state and federal courts located in San Francisco County, California, for any actions not subject to arbitration.",
    ],
  },
  {
    id: "15",
    title: "Severability and Waiver",
    content: [
      "If any provision of these Terms is found to be invalid or unenforceable, the remaining provisions will continue in full force and effect.",
      "Our failure to enforce any right or provision of these Terms will not constitute a waiver of such right or provision.",
    ],
  },
  {
    id: "16",
    title: "Contact Information",
    content: [
      "If you have any questions about these Terms of Service, please contact us:",
      "• Email: legal@intelik.net",
      "• Business Email: business@intelik.net",
      "• Phone: +1 (800) 123-4567",
      "• Address: 123 Investment Street, Suite 500, San Francisco, CA 94105, United States",
      "For general support inquiries, please visit our Help Center or contact contact@intelik.net.",
    ],
  },
  ];

