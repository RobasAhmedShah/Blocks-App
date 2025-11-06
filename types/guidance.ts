import { Property } from "./property";

export interface InvestmentPlan {
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

