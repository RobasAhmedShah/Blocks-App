// Utility functions for assets components

/**
 * Smart currency formatter that adapts to value size
 * - Shows exact values with 2 decimals for amounts < $1,000 (e.g., "$50.00", "$99.50")
 * - Shows "k" format for amounts >= $1,000 and < $1,000,000 (e.g., "$1.2k", "$5.5k")
 * - Shows "M" format for amounts >= $1,000,000 (e.g., "$1.5M")
 */
export const formatCurrency = (value: number): string => {
  if (value < 1000) {
    // Show exact value with 2 decimals for small amounts
    return `$${value.toFixed(2)}`;
  } else if (value < 1000000) {
    // Show in thousands with 1 decimal
    const thousands = value / 1000;
    // If it's a whole number, show without decimal
    if (thousands % 1 === 0) {
      return `$${thousands.toFixed(0)}k`;
    }
    return `$${thousands.toFixed(1)}k`;
  } else {
    // Show in millions with 1-2 decimals
    const millions = value / 1000000;
    if (millions % 1 === 0) {
      return `$${millions.toFixed(0)}M`;
    }
    // Show 1 decimal if less than 10M, 2 decimals if more
    const decimals = millions < 10 ? 1 : 2;
    return `$${millions.toFixed(decimals)}M`;
  }
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

