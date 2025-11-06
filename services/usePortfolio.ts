import { useState, useEffect } from 'react';
import { Investment } from '@/types/portfolio';
import { useApp } from '@/contexts/AppContext';

export function usePortfolio() {
  const { 
    getInvestments, 
    getTotalValue, 
    getTotalInvested, 
    getTotalROI, 
    getMonthlyRentalIncome 
  } = useApp();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPortfolio = async () => {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 500));
      setLoading(false);
    };
    fetchPortfolio();
  }, []);

  const investments = getInvestments();
  const totalValue = getTotalValue();
  const totalInvested = getTotalInvested();
  const totalROI = getTotalROI();
  const monthlyRentalIncome = getMonthlyRentalIncome();

  return {
    investments,
    loading,
    totalValue,
    totalInvested,
    totalROI,
    monthlyRentalIncome,
  };
}

