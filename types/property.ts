export interface Property {
  id: string;
  title: string;
  location: string;
  city: string;
  valuation: number;
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

export interface WalletBalance {
  usdc: number;
  totalInvested: number;
  totalEarnings: number;
  pendingDeposits: number;
}

export interface Transaction {
  id: string;
  type: 'deposit' | 'withdraw' | 'investment' | 'rental' | 'transfer';
  amount: number;
  currency: 'USDC' | 'PKR';
  status: 'pending' | 'completed' | 'failed';
  date: string;
  description: string;
  propertyId?: string;
  propertyTitle?: string;
}

