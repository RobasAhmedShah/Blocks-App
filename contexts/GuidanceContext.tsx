import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Property } from '@/types/property';

interface InvestmentPlan {
  monthlyIncomeGoal?: number;
  estimatedInvestmentNeeded?: number;
  investmentAmount: number;
  selectedProperty?: Property;
  expectedMonthlyReturn?: number;
  estimatedROI?: number;
  recurringDeposit?: {
    amount: number;
    frequency: 'weekly' | 'monthly' | 'quarterly';
  };
  firstDepositDate?: string;
}

interface GuidanceContextType {
  investmentPlan: InvestmentPlan;
  updateInvestmentPlan: (updates: Partial<InvestmentPlan>) => void;
  resetPlan: () => void;
}

const GuidanceContext = createContext<GuidanceContextType | undefined>(undefined);

const defaultPlan: InvestmentPlan = {
  investmentAmount: 1000,
};

export function GuidanceProvider({ children }: { children: ReactNode }) {
  const [investmentPlan, setInvestmentPlan] = useState<InvestmentPlan>(defaultPlan);

  const updateInvestmentPlan = (updates: Partial<InvestmentPlan>) => {
    setInvestmentPlan(prev => ({ ...prev, ...updates }));
  };

  const resetPlan = () => {
    setInvestmentPlan(defaultPlan);
  };
  

  return (
    <GuidanceContext.Provider value={{ investmentPlan, updateInvestmentPlan, resetPlan }}>
      {children}
    </GuidanceContext.Provider>
  );
}

export function useGuidance() {
  const context = useContext(GuidanceContext);
  if (!context) {
    throw new Error('useGuidance must be used within GuidanceProvider');
  }
  return context;
}

