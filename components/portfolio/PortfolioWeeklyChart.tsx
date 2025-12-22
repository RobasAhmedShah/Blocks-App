import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useColorScheme } from '@/lib/useColorScheme';
import { Investment } from '@/types/portfolio';

interface PortfolioWeeklyChartProps {
  monthlyIncome: number;
  monthlyExpenses?: number;
  investments?: Investment[];
  totalValue?: number;
}

export function PortfolioWeeklyChart({
  monthlyIncome,
  monthlyExpenses = 0,
  investments = [],
  totalValue = 0,
}: PortfolioWeeklyChartProps) {
  const { colors, isDarkColorScheme } = useColorScheme();
  const [view, setView] = useState<'income' | 'performance'>('income');
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  // Generate last 6 months data
  const months = useMemo(() => {
    const monthLabels: string[] = [];
    const monthDates: Date[] = [];
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      monthLabels.push(date.toLocaleDateString('en-US', { month: 'short' }));
      monthDates.push(date);
    }
    
    return { labels: monthLabels, dates: monthDates };
  }, []);

  // Calculate monthly rental income based on investments
  const monthlyData = useMemo(() => {
    if (view === 'income') {
      // Generate monthly rental income for last 6 months
      // Base income from current monthly income, with realistic variations
      return months.labels.map((_, index) => {
        // Simulate monthly variations: some months higher, some lower
        // Add growth trend over time (slight increase)
        const growthFactor = 1 + (index * 0.02); // 2% growth per month
        const variationFactor = 0.85 + (Math.random() * 0.3); // 85% to 115% variation
        return monthlyIncome * growthFactor * variationFactor;
      });
    } else {
      // Performance View: Show portfolio value over last 6 months
      if (investments.length === 0 || totalValue === 0) {
        return months.labels.map(() => totalValue);
      }

      // Calculate average ROI for growth simulation
      const avgROI = investments.reduce((sum, inv) => sum + (inv.roi || 0), 0) / investments.length;
      const monthlyGrowthFactor = 1 + (avgROI / 100 / 12); // Convert annual ROI to monthly
      
      // Simulate portfolio value progression backwards (current to 6 months ago)
      return months.labels.map((_, index) => {
        const monthsAgo = 5 - index;
        const growthMultiplier = Math.pow(monthlyGrowthFactor, -monthsAgo);
        return totalValue * growthMultiplier;
      });
    }
  }, [view, monthlyIncome, investments, totalValue, months]);

  const maxValue = Math.max(...monthlyData, 1); // Prevent division by zero

  return (
    <View
      style={{
        backgroundColor: isDarkColorScheme ? 'rgba(8, 105, 92, 0.35)' : '#F5F5F5',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: isDarkColorScheme
          ? 'rgba(255,255,255,0.06)'
          : 'rgba(0,0,0,0.06)',
      }}
    >
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          marginBottom: 16,
        }}
      >
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity
            onPress={() => setView('income')}
            style={{
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 8,
              backgroundColor:
                view === 'income'
                  ? 'rgba(22,163,74,0.15)'
                  : 'transparent',
            }}
          >
            <Text
              style={{
                color:
                  view === 'income'
                    ? colors.primary
                    : colors.textMuted,
                fontWeight: '600',
                fontSize: 13,
              }}
            >
              Income
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setView('performance')}
            style={{
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 8,
              backgroundColor:
                view === 'performance'
                  ? 'rgba(22,163,74,0.15)'
                  : 'transparent',
            }}
          >
            <Text
              style={{
                color:
                  view === 'performance'
                    ? colors.primary
                    : colors.textMuted,
                fontWeight: '600',
                fontSize: 13,
              }}
            >
              Investments
            </Text>
          </TouchableOpacity>
        </View>

        <Text
          style={{
            color: colors.textSecondary,
            fontSize: 13,
            fontWeight: '600',
          }}
        >
          {view === 'income' ? (
            <>${monthlyIncome.toFixed(2)}/mo</>
          ) : (
            <>${totalValue.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</>
          )}
        </Text>
      </View>

      {/* Chart */}
      <View
        style={{
          height: 160,
          flexDirection: 'row',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          position: 'relative',
          paddingBottom: 8,
        }}
      >
        {monthlyData.map((value, index) => {
          const height = (value / maxValue) * 140;
          const isSelected = selectedIndex === index;

          return (
            <View
              key={index}
              style={{
                flex: 1,
                alignItems: 'center',
                position: 'relative',
              }}
            >
              {/* Value Tooltip */}
              {isSelected && (
                <View
                  style={{
                    position: 'absolute',
                    bottom: height + 8,
                    backgroundColor: isDarkColorScheme
                      ? 'rgba(0, 0, 0, 0.9)'
                      : 'rgba(0, 0, 0, 0.85)',
                    paddingHorizontal: 10,
                    paddingVertical: 6,
                    borderRadius: 8,
                    zIndex: 10,
                    minWidth: 70,
                    alignItems: 'center',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.3,
                    shadowRadius: 4,
                    elevation: 5,
                  }}
                >
                  <Text
                    style={{
                      color: '#FFFFFF',
                      fontSize: 12,
                      fontWeight: '700',
                    }}
                  >
                    {view === 'income' ? '$' : '$'}
                    {view === 'income'
                      ? value.toFixed(2)
                      : value.toLocaleString('en-US', {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0,
                        })}
                  </Text>
                  {/* Tooltip Arrow */}
                  <View
                    style={{
                      position: 'absolute',
                      bottom: -6,
                      width: 0,
                      height: 0,
                      borderLeftWidth: 6,
                      borderRightWidth: 6,
                      borderTopWidth: 6,
                      borderLeftColor: 'transparent',
                      borderRightColor: 'transparent',
                      borderTopColor: isDarkColorScheme
                        ? 'rgba(0, 0, 0, 0.9)'
                        : 'rgba(0, 0, 0, 0.85)',
                    }}
                  />
                </View>
              )}

              {/* Bar */}
              <TouchableOpacity
                onPress={() => {
                  setSelectedIndex(isSelected ? null : index);
                }}
                activeOpacity={0.7}
                style={{
                  width: '100%',
                  maxWidth: 28,
                  alignItems: 'center',
                }}
              >
                <View
                  style={{
                    width: '100%',
                    maxWidth: 28,
                    height: Math.max(height, 4), // Minimum height for visibility
                    borderRadius: 14,
                    backgroundColor:
                      isSelected
                        ? colors.primary
                        : view === 'income'
                        ? colors.primary
                        : isDarkColorScheme
                        ? '#22c55e'
                        : '#16a34a',
                    opacity: isSelected ? 1 : 0.8,
                    // Add subtle shadow for depth
                    shadowColor: colors.primary,
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: isSelected ? 0.4 : 0.2,
                    shadowRadius: isSelected ? 5 : 3,
                    elevation: isSelected ? 5 : 3,
                    borderWidth: isSelected ? 2 : 0,
                    borderColor: isDarkColorScheme
                      ? 'rgba(255, 255, 255, 0.3)'
                      : 'rgba(255, 255, 255, 0.5)',
                  }}
                />
              </TouchableOpacity>
            </View>
          );
        })}
      </View>

      {/* Month Labels */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          marginTop: 8,
        }}
      >
        {months.labels.map((month, index) => (
          <Text
            key={index}
            style={{
              flex: 1,
              textAlign: 'center',
              fontSize: 11,
              color: selectedIndex === index ? colors.primary : colors.textMuted,
              fontWeight: selectedIndex === index ? '600' : '500',
            }}
          >
            {month}
          </Text>
        ))}
      </View>
    </View>
  );
}
