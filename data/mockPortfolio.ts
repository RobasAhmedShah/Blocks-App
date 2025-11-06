import { Investment } from "@/types/portfolio";
import { mockProperties } from "./mockProperties";

export const mockInvestments: Investment[] = [
  {
    id: '1',
    property: mockProperties[0], // Skyline Residences Islamabad
    tokens: 100,
    investedAmount: 5000,
    currentValue: 5625,
    roi: 18.2,
    rentalYield: 7.5,
    monthlyRentalIncome: 31.25,
  },
  {
    id: '2',
    property: mockProperties[2], // Green Valley Apartments Lahore
    tokens: 250,
    investedAmount: 30000,
    currentValue: 36750,
    roi: 22.5,
    rentalYield: 9.1,
    monthlyRentalIncome: 227.5,
  },
  {
    id: '3',
    property: mockProperties[3], // Bay View Heights Islamabad
    tokens: 250,
    investedAmount: 30000,
    currentValue: 36750,
    roi: 22.5,
    rentalYield: 9.1,
    monthlyRentalIncome: 227.5,
  },
];

