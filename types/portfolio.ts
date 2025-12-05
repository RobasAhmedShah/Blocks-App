import { Property } from "./property";

export interface Investment {
  id: string;
  property: Property;
  tokens: number;
  investedAmount: number;
  currentValue: number;
  roi: number;
  rentalYield: number;
  monthlyRentalIncome: number;
  certificates?: string[]; // Array of certificate URLs from all investments for this property
}

