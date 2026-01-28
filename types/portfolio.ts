import { Property, PropertyToken } from "./property";

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
  propertyToken?: PropertyToken | null; // Token type for this investment
  propertyTokenId?: string | null; // Token ID for this investment

}

