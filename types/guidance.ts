import { Property } from "./property";

export interface InvestmentPlan {
  monthlyIncomeGoal?: number;
  estimatedInvestmentNeeded?: number;
  investmentAmount: number;
  selectedProperty?: Property;
  expectedMonthlyReturn?: number;
  estimatedROI?: number;
  isGoalBased?: boolean; // Flag to indicate if calculations are based on monthly goal
  recurringDeposit?: {
    amount: number;
    frequency: 'weekly' | 'monthly' | 'quarterly';
  };
  firstDepositDate?: string;
}

