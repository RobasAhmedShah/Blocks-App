// Utility functions for assets components

/**
 * Currency formatter that shows full values with 2 decimal places
 * - Always displays the complete value with 2 decimal points (e.g., "$1,234.56", "$50,000.00", "$1,234,567.89")
 * - No abbreviations (no "k" or "M")
 */
export const formatCurrency = (value: number): string => {
  return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export const getTierInfo = (roi: number) => {
  if (roi >= 15) {
    return {
      tier: 'Sapphire Tier',
      tierColor: '#66B2FC',
      glowColor: 'rgba(102, 178, 252, 0.3)',
    };
  } else if (roi >= 10) {
    return {
      tier: 'Emerald Tier',
      tierColor: '#66FCF1',
      glowColor: 'rgba(102, 252, 241, 0.3)',
    };
  } else {
    return {
      tier: 'Ruby Tier',
      tierColor: '#FC6666',
      glowColor: 'rgba(252, 102, 102, 0.3)',
    };
  }
};

export const getModalStats = (investment: any, colors: any) => {
  if (!investment || !investment.property) return [];
  const property = investment.property;
  
  return [
    {
      label: 'Current ROI',
      value: `${investment.roi.toFixed(1)}%`,
      change: `+${(investment.roi * 0.1).toFixed(1)}%`,
      changeType: 'up' as const,
      changeColor: colors.primary,
      icon: 'trending-up',
    },
    {
      label: 'Monthly Income',
      value: `$${investment.monthlyRentalIncome.toFixed(0)}`,
      change: `+${(investment.rentalYield * 0.05).toFixed(1)}%`,
      changeType: 'up' as const,
      changeColor: colors.primary,
      icon: 'calendar',
    },
    {
      label: 'Total Invested',
      value: formatCurrency(investment.investedAmount),
      change: 'Principal',
      changeType: 'neutral' as const,
      changeColor: colors.textMuted,
      icon: 'wallet',
    },
    {
      label: 'Current Value',
      value: formatCurrency(investment.currentValue),
      change: `+${((investment.currentValue - investment.investedAmount) / investment.investedAmount * 100).toFixed(1)}%`,
      changeType: 'up' as const,
      changeColor: colors.primary,
      icon: 'cash',
    },
    {
      label: 'Rental Yield',
      value: `${investment.rentalYield.toFixed(2)}%`,
      change: 'Annual',
      changeType: 'neutral' as const,
      changeColor: colors.textSecondary,
      icon: 'stats-chart',
    },
    {
      label: 'Ownership',
      value: `${((investment.tokens / property.totalTokens) * 100).toFixed(2)}%`,
      change: `${investment.tokens.toFixed(2)} tokens`,
      changeType: 'neutral' as const,
      changeColor: colors.textSecondary,
      icon: 'pie-chart',
    },
  ];
};

