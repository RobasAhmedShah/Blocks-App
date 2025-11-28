export interface Property {
  id: string;
  displayCode?: string; // Database display code like "PROP-000018"
  title: string;
  location: string;
  city: string;
  country?: string; // Optional country field
  slug?: string; // Optional slug field
  type?: string; // Property type: 'residential' | 'commercial' | 'mixed'
  valuation: number | string; // Can be number (PKR) or string (formatted)
  price?: string; // Optional, for backward compatibility
  image?: string; // Optional, for backward compatibility (use images array instead)
  estReturn?: number; // Optional, for backward compatibility (use estimatedROI instead)
  fundingProgress?: number; // Optional, calculated from soldTokens/totalTokens
  tokenSymbol?: string; // Optional
  
  tokenPrice: number;
  minInvestment: number;
  totalTokens: number;
  soldTokens: number;
  estimatedROI: number;
  estimatedYield: number;
  completionDate: string;
  
  status: 'funding' | 'construction' | 'completed' | 'generating-income';
  images: string[];
  description: string;
  amenities: string[];
  builder: {
    name: string;
    logo?: string;
    rating: number;
    projectsCompleted: number;
  };
  features: {
    bedrooms?: number;
    bathrooms?: number;
    area?: number;
    floors?: number;
    units?: number;
  };
  documents: {
    name: string;
    type: string;
    verified: boolean;
    url?: string;
  }[];
  updates: {
    title: string;
    description: string;
    date: string;
    type: 'project' | 'financial' | 'community';
  }[];
  rentalIncome?: {
    monthly: number;
    lastDistribution: string;
    nextDistribution: string;
  };
}

export interface UserInvestment {
  id: string;
  propertyId: string;
  property: Property;
  tokensOwned: number;
  investmentAmount: number;
  currentValue: number;
  roi: number;
  rentalEarned: number;
  purchaseDate: string;
  rentalHistory: {
    amount: number;
    date: string;
    status: 'pending' | 'distributed';
  }[];
}

// Wallet types moved to @types/wallet.ts
// Import from there: import { WalletBalance, Transaction } from "@/types/wallet";

