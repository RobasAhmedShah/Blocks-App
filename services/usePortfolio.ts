import { useState, useEffect } from 'react';
import { Property } from './useProperties';

export interface Investment {
  id: string;
  property: Property;
  tokens: number;
  investedAmount: number;
  currentValue: number;
  roi: number;
  rentalYield: number;
  monthlyRentalIncome: number;
}

const mockInvestments: Investment[] = [
  {
    id: '1',
    property: {
      id: '1',
      title: 'Modern Downtown Loft',
      location: 'Karachi, Pakistan',
      price: '$1,200,000',
      valuation: '$1,200,000',
      image: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800',
      tokenPrice: 50,
      minInvestment: 500,
      estReturn: 7.5,
      fundingProgress: 72,
      totalTokens: 24000,
      soldTokens: 17280,
      builder: 'Apex Global Properties',
      completionDate: 'Q4 2025',
      amenities: ['Pool', 'Gym', 'Security', 'Parking'],
      description: 'A stunning modern residence offering panoramic city views.',
      images: [],
      tokenSymbol: 'MDL',
    },
    tokens: 100,
    investedAmount: 5000,
    currentValue: 5625,
    roi: 18.2,
    rentalYield: 7.5,
    monthlyRentalIncome: 31.25,
  },
  {
    id: '2',
    property: {
      id: '3',
      title: 'The Grand Plaza',
      location: 'Islamabad, Pakistan',
      price: '$3,100,000',
      valuation: '$3,100,000',
      image: 'https://images.unsplash.com/photo-1600585154084-4e5fe7c39198?w=800',
      tokenPrice: 120,
      minInvestment: 1200,
      estReturn: 9.1,
      fundingProgress: 68,
      totalTokens: 25833,
      soldTokens: 17566,
      builder: 'Capital Builders',
      completionDate: 'Q3 2025',
      amenities: ['Commercial Space', 'Residential', 'Parking', 'Security'],
      description: 'Urban apartment complex with modern architecture.',
      images: [],
      tokenSymbol: 'SHRD',
    },
    tokens: 250,
    investedAmount: 30000,
    currentValue: 36750,
    roi: 22.5,
    rentalYield: 9.1,
    monthlyRentalIncome: 227.5,
  },
];

export function usePortfolio() {
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPortfolio = async () => {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 500));
      setInvestments(mockInvestments);
      setLoading(false);
    };
    fetchPortfolio();
  }, []);

  const totalValue = investments.reduce((sum, inv) => sum + inv.currentValue, 0);
  const totalInvested = investments.reduce((sum, inv) => sum + inv.investedAmount, 0);
  const totalROI = totalInvested > 0 ? ((totalValue - totalInvested) / totalInvested) * 100 : 0;
  const monthlyRentalIncome = investments.reduce((sum, inv) => sum + inv.monthlyRentalIncome, 0);

  return {
    investments,
    loading,
    totalValue,
    totalInvested,
    totalROI,
    monthlyRentalIncome,
  };
}

