import { Property, UserInvestment, WalletBalance, Transaction } from '../types/property';

export const mockProperties: Property[] = [
  {
    id: '1',
    title: 'Skyline Residences Islamabad',
    location: 'F-11 Markaz, Islamabad',
    city: 'Islamabad',
    valuation: 1500000000, // 1.5B PKR
    tokenPrice: 50, // USDC
    minInvestment: 500,
    totalTokens: 1000,
    soldTokens: 720,
    estimatedROI: 8.5,
    estimatedYield: 9.2,
    completionDate: 'Q4 2025',
    status: 'funding',
    images: [
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAYn8TUffLryR79waozp-EFr9tZIcpnF3ZenXafkw4h9Lry5mLGDDUBAtUsGx4p9zGdJxNKV-pXniHiizlXYUwueG85ASUIincPQPK0Pnt02-YbHtSJtIjrOSh0IZCXYxXRonWgQ2guwNeOYPyXsOeOiMuj4Ly3PmBg3glhtvvcQJN_86yOjgtdfHo6r3i5etQk7D8X0PqMd6o9PvbKYBqRjRxldKTzRgnaqthhgfSvmcR2TWMFYqdA98QuXei63-jzxs3C-p_i044',
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800',
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800',
    ],
    description: 'A stunning modern residence offering panoramic city views. This property combines luxury living with cutting-edge smart home technology, making it a prime investment opportunity in a rapidly growing district.',
    amenities: ['Swimming Pool', 'Gym', 'Parking', 'Security', 'Garden', 'Community Center'],
    builder: {
      name: 'HMR Builders Group',
      rating: 4.8,
      projectsCompleted: 25,
    },
    features: {
      units: 120,
      floors: 18,
      area: 250000,
    },
    documents: [
      { name: 'Property Deed', type: 'PDF', verified: true },
      { name: 'Appraisal Report', type: 'PDF', verified: true },
      { name: 'Legal Opinion', type: 'PDF', verified: true },
    ],
    updates: [
      {
        title: 'Phase 2 construction commenced',
        description: 'We are excited to be ahead of schedule.',
        date: '2025-10-28',
        type: 'project',
      },
      {
        title: 'Community AMA with lead architect',
        description: 'Join us this Friday to discuss final design choices.',
        date: '2025-10-26',
        type: 'community',
      },
    ],
  },
  {
    id: '2',
    title: 'Pearl Towers Karachi',
    location: 'Clifton Block 8, Karachi',
    city: 'Karachi',
    valuation: 2500000000, // 2.5B PKR
    tokenPrice: 100, // USDC
    minInvestment: 1000,
    totalTokens: 800,
    soldTokens: 640,
    estimatedROI: 7.8,
    estimatedYield: 8.5,
    completionDate: 'Q2 2026',
    status: 'funding',
    images: [
      'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=800',
      'https://images.unsplash.com/photo-1613977257363-707ba9348227?w=800',
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800',
    ],
    description: 'Luxury beachfront apartments with stunning Arabian Sea views. Premium amenities and world-class architecture.',
    amenities: ['Beach Access', 'Infinity Pool', 'Spa', 'Restaurant', 'Concierge', 'Marina'],
    builder: {
      name: 'Oceanview Developers',
      rating: 4.6,
      projectsCompleted: 18,
    },
    features: {
      units: 85,
      floors: 32,
      area: 320000,
    },
    documents: [
      { name: 'Property Deed', type: 'PDF', verified: true },
      { name: 'Environmental Impact', type: 'PDF', verified: true },
    ],
    updates: [
      {
        title: 'Foundation work completed',
        description: 'Successfully completed foundation for both towers.',
        date: '2025-10-25',
        type: 'project',
      },
    ],
  },
  {
    id: '3',
    title: 'Green Valley Apartments Lahore',
    location: 'DHA Phase 6, Lahore',
    city: 'Lahore',
    valuation: 850000000, // 850M PKR
    tokenPrice: 75, // USDC
    minInvestment: 750,
    totalTokens: 600,
    soldTokens: 420,
    estimatedROI: 9.1,
    estimatedYield: 10.2,
    completionDate: 'Q1 2026',
    status: 'construction',
    images: [
      'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800',
      'https://images.unsplash.com/photo-1494145904049-0dca59b4bbad?w=800',
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800',
    ],
    description: 'Eco-friendly residential complex with modern amenities in the heart of Lahore. Sustainable living meets luxury.',
    amenities: ['Solar Panels', 'Gym', 'Kids Play Area', 'Jogging Track', 'Clubhouse'],
    builder: {
      name: 'EcoBuild Pakistan',
      rating: 4.7,
      projectsCompleted: 12,
    },
    features: {
      units: 96,
      floors: 12,
      area: 180000,
    },
    documents: [
      { name: 'Property Deed', type: 'PDF', verified: true },
      { name: 'NOC Document', type: 'PDF', verified: true },
    ],
    updates: [
      {
        title: '60% construction completed',
        description: 'We have reached a major milestone.',
        date: '2025-10-20',
        type: 'project',
      },
    ],
  },
  {
    id: '4',
    title: 'Bay View Heights Islamabad',
    location: 'Bahria Town Phase 7, Islamabad',
    city: 'Islamabad',
    valuation: 3100000000, // 3.1B PKR
    tokenPrice: 120, // USDC
    minInvestment: 1200,
    totalTokens: 1200,
    soldTokens: 980,
    estimatedROI: 10.5,
    estimatedYield: 11.8,
    completionDate: 'Completed',
    status: 'generating-income',
    images: [
      'https://images.unsplash.com/photo-1558036117-15d82a90b9b1?w=800',
      'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800',
      'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800',
    ],
    description: 'Premium completed property generating consistent rental income. High-occupancy rate with established tenant base.',
    amenities: ['24/7 Security', 'Gym', 'Swimming Pool', 'Shopping Mall', 'Cinema'],
    builder: {
      name: 'Bahria Developers',
      rating: 4.9,
      projectsCompleted: 42,
    },
    features: {
      units: 150,
      floors: 25,
      area: 420000,
    },
    documents: [
      { name: 'Property Deed', type: 'PDF', verified: true },
      { name: 'Completion Certificate', type: 'PDF', verified: true },
      { name: 'Rental Agreements', type: 'PDF', verified: true },
    ],
    updates: [
      {
        title: 'Rental distribution completed',
        description: 'Q3 2025 rental income distributed to all token holders.',
        date: '2025-10-15',
        type: 'financial',
      },
    ],
    rentalIncome: {
      monthly: 15500000, // PKR
      lastDistribution: '2025-10-15',
      nextDistribution: '2025-11-15',
    },
  },
];

export const mockUserInvestments: UserInvestment[] = [
  {
    id: 'inv1',
    propertyId: '4',
    property: mockProperties[3],
    tokensOwned: 25,
    investmentAmount: 3000,
    currentValue: 3540,
    roi: 18.0,
    rentalEarned: 540,
    purchaseDate: '2024-08-15',
    rentalHistory: [
      { amount: 180, date: '2025-10-15', status: 'distributed' },
      { amount: 180, date: '2025-09-15', status: 'distributed' },
      { amount: 180, date: '2025-08-15', status: 'distributed' },
    ],
  },
  {
    id: 'inv2',
    propertyId: '1',
    property: mockProperties[0],
    tokensOwned: 15,
    investmentAmount: 750,
    currentValue: 915,
    roi: 22.0,
    rentalEarned: 165,
    purchaseDate: '2025-05-20',
    rentalHistory: [
      { amount: 85, date: '2025-10-20', status: 'distributed' },
      { amount: 80, date: '2025-09-20', status: 'distributed' },
    ],
  },
  {
    id: 'inv3',
    propertyId: '3',
    property: mockProperties[2],
    tokensOwned: 10,
    investmentAmount: 750,
    currentValue: 862,
    roi: 14.9,
    rentalEarned: 112,
    purchaseDate: '2025-07-01',
    rentalHistory: [
      { amount: 56, date: '2025-10-01', status: 'distributed' },
      { amount: 56, date: '2025-09-01', status: 'distributed' },
    ],
  },
];

export const mockWalletBalance: WalletBalance = {
  usdc: 540.25,
  totalInvested: 4500,
  totalEarnings: 817,
  pendingDeposits: 0,
};

export const mockTransactions: Transaction[] = [
  {
    id: 'tx1',
    type: 'rental',
    amount: 180,
    currency: 'USDC',
    status: 'completed',
    date: '2025-10-15',
    description: 'Rental income distribution',
    propertyId: '4',
    propertyTitle: 'Bay View Heights Islamabad',
  },
  {
    id: 'tx2',
    type: 'investment',
    amount: 750,
    currency: 'USDC',
    status: 'completed',
    date: '2025-10-10',
    description: 'Token purchase',
    propertyId: '3',
    propertyTitle: 'Green Valley Apartments Lahore',
  },
  {
    id: 'tx3',
    type: 'deposit',
    amount: 1000,
    currency: 'USDC',
    status: 'completed',
    date: '2025-10-08',
    description: 'Debit card deposit',
  },
  {
    id: 'tx4',
    type: 'rental',
    amount: 85,
    currency: 'USDC',
    status: 'completed',
    date: '2025-10-20',
    description: 'Rental income distribution',
    propertyId: '1',
    propertyTitle: 'Skyline Residences Islamabad',
  },
  {
    id: 'tx5',
    type: 'withdraw',
    amount: 500,
    currency: 'USDC',
    status: 'pending',
    date: '2025-10-28',
    description: 'Bank transfer withdrawal',
  },
];

