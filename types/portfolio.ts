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
  certificatePath?: string | null; // Single certificate path shared by all investments for this property
}

