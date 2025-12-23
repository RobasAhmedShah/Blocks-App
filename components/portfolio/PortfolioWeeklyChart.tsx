import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, Dimensions, PanResponder } from 'react-native';
import Svg, { Path, Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { useColorScheme } from '@/lib/useColorScheme';
import { Investment } from '@/types/portfolio';
import { Transaction } from '@/types/wallet';
import { Ionicons } from '@expo/vector-icons';

interface PortfolioWeeklyChartProps {
  monthlyIncome: number;
  investments?: Investment[];
  totalValue?: number;
  transactions?: Transaction[];
}

export function PortfolioWeeklyChart({
  monthlyIncome,
  investments = [],
  totalValue = 0,
  transactions = [],
}: PortfolioWeeklyChartProps) {
  const { colors, isDarkColorScheme } = useColorScheme();
  const [view, setView] = useState<'income' | 'investments'>('income');
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const chartWidth = Dimensions.get('window').width - 64;
  const chartHeight = 200;
  const padding = { top: 40, right: 16, bottom: 40, left: 16 };
  const graphWidth = chartWidth - padding.left - padding.right;
  const graphHeight = chartHeight - padding.top - padding.bottom;

  // ========== RENTAL INCOME CHART DATA (from transactions) ==========
  const rentalIncomeData = useMemo(() => {
    // Filter rental income transactions
    const rentalTransactions = transactions.filter(tx => 
      (tx.type === 'rental_income' || tx.type === 'rental') && 
      tx.status === 'completed'
    );

    if (rentalTransactions.length === 0) {
      return [];
    }

    // Group transactions by month
    const monthlyIncomeMap = new Map<string, { label: string; date: Date; income: number }>();
    
    rentalTransactions.forEach(tx => {
      try {
        const txDate = new Date(tx.date);
        if (isNaN(txDate.getTime())) return;
        
        const monthKey = `${txDate.getFullYear()}-${txDate.getMonth()}`;
        const monthLabel = `${txDate.toLocaleDateString('en-US', { month: 'short' })} ${txDate.getFullYear()}`;
        
        if (!monthlyIncomeMap.has(monthKey)) {
          monthlyIncomeMap.set(monthKey, {
            label: monthLabel,
            date: new Date(txDate.getFullYear(), txDate.getMonth(), 1),
            income: 0,
          });
        }
        
        const monthData = monthlyIncomeMap.get(monthKey)!;
        monthData.income += Math.abs(tx.amount || 0);
      } catch (error) {
        console.warn('Error processing rental transaction:', error);
      }
    });

    // Convert to array and sort by date (oldest first)
    const months = Array.from(monthlyIncomeMap.values())
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    // Show last 12 months of rental income
    const now = new Date();
    const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);
    
    return months.filter(month => month.date >= twelveMonthsAgo);
  }, [transactions]);

  const maxRentalIncome = rentalIncomeData.length > 0
    ? Math.max(...rentalIncomeData.map(m => m.income || 0), monthlyIncome, 1)
    : monthlyIncome || 1;

  // ========== INVESTMENT TIMELINE CHART DATA (from transactions) ==========
  const investmentTimelineData = useMemo(() => {
    // Filter investment transactions
    const investmentTransactions = transactions.filter(tx => 
      tx.type === 'investment' && 
      tx.status === 'completed'
    );

    if (investmentTransactions.length === 0) {
      return [];
    }

    // Sort by date (oldest first)
    const sortedTransactions = investmentTransactions
      .map(tx => {
        try {
          const txDate = new Date(tx.date);
          if (isNaN(txDate.getTime())) return null;
          
          return {
            date: txDate,
            amount: Math.abs(tx.amount || 0),
            propertyTitle: tx.propertyTitle || 'Property',
            propertyId: tx.propertyId,
            label: `${txDate.toLocaleDateString('en-US', { month: 'short' })} ${txDate.getFullYear()}`,
          };
        } catch (error) {
          console.warn('Error processing investment transaction:', error);
          return null;
        }
      })
      .filter((item): item is NonNullable<typeof item> => item !== null)
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    // Create cumulative investment data
    let cumulativeAmount = 0;
    return sortedTransactions.map(item => {
      cumulativeAmount += item.amount;
      return {
        ...item,
        cumulativeAmount,
      };
    });
  }, [transactions]);

  const maxInvestmentAmount = investmentTimelineData.length > 0
    ? Math.max(...investmentTimelineData.map(d => d.cumulativeAmount || 0), totalValue || 0, 1)
    : totalValue || 1;

  // Initialize selectedIndex to last point when switching to investments view
  React.useEffect(() => {
    if (view === 'investments' && selectedIndex === null && investmentTimelineData.length > 0) {
      setSelectedIndex(investmentTimelineData.length - 1);
    }
  }, [view, investmentTimelineData.length, selectedIndex]);

  // ========== RENDER RENTAL INCOME CHART (Bar Chart) ==========
  const renderRentalIncomeChart = () => {
    if (rentalIncomeData.length === 0) {
      return (
        <View style={{ height: 200, justifyContent: 'center', alignItems: 'center' }}>
          <Ionicons name="cash-outline" size={48} color={colors.textMuted} />
          <Text style={{ color: colors.textMuted, fontSize: 14, marginTop: 12, textAlign: 'center' }}>
            No rental income transactions yet
          </Text>
          <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 4, textAlign: 'center' }}>
            Rental income will appear here when received
          </Text>
        </View>
      );
    }

    return (
      <>
        {/* Header */}
        <View style={{ marginBottom: 16 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <Text style={{ color: colors.textPrimary, fontSize: 18, fontWeight: 'bold' }}>
              Rental Income History
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Ionicons name="trending-up" size={16} color={colors.primary} />
              <Text style={{ color: colors.textSecondary, fontSize: 13, fontWeight: '600' }}>
                ${monthlyIncome.toFixed(2)}/mo
              </Text>
            </View>
          </View>
        </View>

        {/* Bar Chart */}
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
          {rentalIncomeData.map((month, index) => {
            const height = (month.income / maxRentalIncome) * 140;
            const isSelected = selectedIndex === index;

            return (
              <View
                key={index}
                style={{
                  flex: rentalIncomeData.length <= 6 ? 1 : undefined,
                  minWidth: rentalIncomeData.length > 6 ? '16%' : undefined,
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
                    <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '700' }}>
                      ${month.income.toFixed(2)}
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
                  onPress={() => setSelectedIndex(isSelected ? null : index)}
                  activeOpacity={0.7}
                  style={{ width: '100%', maxWidth: 28, alignItems: 'center' }}
                >
                  <View
                    style={{
                      width: '100%',
                      maxWidth: 28,
                      height: Math.max(height, 4),
                      borderRadius: 14,
                      backgroundColor: colors.primary,
                      opacity: isSelected ? 1 : 0.8,
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
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, flexWrap: 'wrap' }}>
          {rentalIncomeData.map((month, index) => (
            <Text
              key={index}
              style={{
                flex: rentalIncomeData.length <= 6 ? 1 : undefined,
                minWidth: rentalIncomeData.length > 6 ? '16%' : undefined,
                textAlign: 'center',
                fontSize: 10,
                color: selectedIndex === index ? colors.primary : colors.textMuted,
                fontWeight: selectedIndex === index ? '600' : '500',
                marginBottom: rentalIncomeData.length > 6 ? 4 : 0,
              }}
              numberOfLines={1}
            >
              {month.label.split(' ')[0]}
            </Text>
          ))}
        </View>
      </>
    );
  };

  // ========== RENDER INVESTMENT TIMELINE CHART (Line Chart) ==========
  const renderInvestmentTimelineChart = () => {
    if (investmentTimelineData.length === 0) {
      return (
        <View style={{ height: 200, justifyContent: 'center', alignItems: 'center' }}>
          <Ionicons name="calendar-outline" size={48} color={colors.textMuted} />
          <Text style={{ color: colors.textMuted, fontSize: 14, marginTop: 12 }}>
            No investment history available
          </Text>
        </View>
      );
    }


    // Convert to SVG path coordinates
    const points = investmentTimelineData.map((item, index) => {
      const divisor = investmentTimelineData.length > 1 ? (investmentTimelineData.length - 1) : 1;
      const x = padding.left + (index / divisor) * graphWidth;
      const normalizedAmount = (item.cumulativeAmount || 0) / maxInvestmentAmount;
      const y = padding.top + graphHeight - (normalizedAmount * graphHeight);
      
      return { 
        x: isNaN(x) ? padding.left : x, 
        y: isNaN(y) ? (padding.top + graphHeight) : y, 
        ...item 
      };
    });

    // Validate all points
    const validPoints = points.filter(p => !isNaN(p.x) && !isNaN(p.y) && isFinite(p.x) && isFinite(p.y));
    
    if (validPoints.length === 0) {
      return (
        <View style={{ height: 200, justifyContent: 'center', alignItems: 'center' }}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.textMuted} />
          <Text style={{ color: colors.textMuted, fontSize: 14, marginTop: 12 }}>
            Unable to render chart data
          </Text>
        </View>
      );
    }

    // Create smooth path
    let path = '';
    if (validPoints.length === 1) {
      path = `M ${validPoints[0].x} ${validPoints[0].y} L ${validPoints[0].x + graphWidth} ${validPoints[0].y}`;
    } else {
      path = `M ${validPoints[0].x} ${validPoints[0].y}`;
      for (let i = 1; i < validPoints.length; i++) {
        const prev = validPoints[i - 1];
        const curr = validPoints[i];
        const next = validPoints[i + 1];
        
        if (next) {
          const cp1x = prev.x + (curr.x - prev.x) / 2;
          const cp1y = prev.y;
          const cp2x = curr.x - (next.x - curr.x) / 2;
          const cp2y = curr.y;
          path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${curr.x} ${curr.y}`;
        } else {
          path += ` L ${curr.x} ${curr.y}`;
        }
      }
    }

    // Calculate selected point
    const selectedPoint = selectedIndex !== null && validPoints[selectedIndex] && selectedIndex < validPoints.length
      ? validPoints[selectedIndex] 
      : null;

    // Create dynamic area path that goes from start to selected point (or end if no selection)
    // Note: Cannot use useMemo here as this is inside a render function
    let dynamicAreaPath = '';
    if (validPoints.length > 0) {
      // If no point is selected, show full area
      if (!selectedPoint) {
        dynamicAreaPath = `${path} L ${validPoints[validPoints.length - 1].x} ${padding.top + graphHeight} L ${validPoints[0].x} ${padding.top + graphHeight} Z`;
      } else {
        // Create path from start to selected point
        const selectedIdx = validPoints.findIndex(p => p.x === selectedPoint.x && p.y === selectedPoint.y);
        
        if (selectedIdx === 0) {
          // If first point is selected, just draw a line
          dynamicAreaPath = `M ${validPoints[0].x} ${validPoints[0].y} L ${validPoints[0].x} ${padding.top + graphHeight} L ${validPoints[0].x} ${padding.top + graphHeight} Z`;
        } else if (selectedIdx > 0) {
          // Build path up to selected point
          let partialPath = `M ${validPoints[0].x} ${validPoints[0].y}`;
          for (let i = 1; i <= selectedIdx; i++) {
            const prev = validPoints[i - 1];
            const curr = validPoints[i];
            const next = validPoints[i + 1];
            
            if (next && i < selectedIdx) {
              const cp1x = prev.x + (curr.x - prev.x) / 2;
              const cp1y = prev.y;
              const cp2x = curr.x - (next.x - curr.x) / 2;
              const cp2y = curr.y;
              partialPath += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${curr.x} ${curr.y}`;
            } else {
              partialPath += ` L ${curr.x} ${curr.y}`;
            }
          }
          // Close the area
          dynamicAreaPath = `${partialPath} L ${selectedPoint.x} ${padding.top + graphHeight} L ${validPoints[0].x} ${padding.top + graphHeight} Z`;
        }
      }
    }

    // Calculate Y position on the line for a given X (for smooth dragging)
    const getYOnLine = (x: number): number => {
      if (validPoints.length === 0) return padding.top + graphHeight;
      if (validPoints.length === 1) return validPoints[0].y;

      // Find the two points that bracket this X value
      for (let i = 0; i < validPoints.length - 1; i++) {
        const p1 = validPoints[i];
        const p2 = validPoints[i + 1];
        
        if (x >= p1.x && x <= p2.x) {
          // Linear interpolation between the two points
          const t = (x - p1.x) / (p2.x - p1.x);
          return p1.y + (p2.y - p1.y) * t;
        }
      }

      // If X is before first point or after last point
      if (x <= validPoints[0].x) return validPoints[0].y;
      if (x >= validPoints[validPoints.length - 1].x) return validPoints[validPoints.length - 1].y;

      return padding.top + graphHeight;
    };

    // Handle chart press and drag
    const updateSelectedIndex = (x: number) => {
      const adjustedX = x - padding.left;
      
      if (adjustedX >= 0 && adjustedX <= graphWidth && validPoints.length > 0) {
        // Find the closest point
        let closestIndex = 0;
        let minDistance = Math.abs(validPoints[0].x - adjustedX);
        
        for (let i = 1; i < validPoints.length; i++) {
          const distance = Math.abs(validPoints[i].x - adjustedX);
          if (distance < minDistance) {
            minDistance = distance;
            closestIndex = i;
          }
        }
        
        setSelectedIndex(closestIndex);
      }
    };

    // PanResponder for drag gestures (created directly, not using useRef to avoid hook violations)
    const panResponder = PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        const { locationX } = evt.nativeEvent;
        updateSelectedIndex(locationX);
      },
      onPanResponderMove: (evt) => {
        const { locationX } = evt.nativeEvent;
        updateSelectedIndex(locationX);
      },
      onPanResponderRelease: () => {
        // Keep the selection after release
      },
    });

    // Calculate total invested
    const totalInvested = investmentTimelineData.length > 0
      ? investmentTimelineData[investmentTimelineData.length - 1].cumulativeAmount
      : 0;

    // Calculate percentage change (from first to last)
    const firstAmount = investmentTimelineData.length > 0 ? investmentTimelineData[0].amount : 0;
    const lastAmount = investmentTimelineData.length > 1 
      ? investmentTimelineData[investmentTimelineData.length - 1].cumulativeAmount - investmentTimelineData[investmentTimelineData.length - 2].cumulativeAmount
      : firstAmount;
    const percentageChange = firstAmount > 0 
      ? ((lastAmount - firstAmount) / firstAmount) * 100 
      : 0;

    return (
      <>
        {/* Header: Total Invested and Percentage */}
        <View style={{ marginBottom: 20 }}>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', marginBottom: 4 }}>
            <Text style={{ color: colors.textPrimary, fontSize: 28, fontWeight: 'bold' }}>
              ${totalInvested.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Text>
          </View>
          <Text style={{ color: colors.textSecondary, fontSize: 14 }}>
            Total Invested Across {investments.length} {investments.length === 1 ? 'Property' : 'Properties'}
          </Text>
        </View>

        {/* Chart Container */}
        <View
          style={{ position: 'relative' }}
          {...panResponder.panHandlers}
        >
          <Svg width={chartWidth} height={chartHeight}>
            <Defs>
              <LinearGradient id="investmentLineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <Stop offset="0%" stopColor="#8B5CF6" stopOpacity="1" />
                <Stop offset="50%" stopColor="#A78BFA" stopOpacity="0.8" />
                <Stop offset="100%" stopColor="#C4B5FD" stopOpacity="0.6" />
              </LinearGradient>
              <LinearGradient id="investmentAreaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <Stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.3" />
                <Stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.05" />
              </LinearGradient>
            </Defs>

            {/* Dynamic Area fill - updates with drag */}
            {dynamicAreaPath && <Path d={dynamicAreaPath} fill="rgba(213, 246, 92, 0.16)" />}

            {/* Main line */}
            {path && (
              <Path
                d={path}
                stroke="rgb(218, 246, 92)"
                strokeWidth="2.5"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {/* Selected point indicator */}
            {selectedPoint && (
              <>
                <Circle cx={selectedPoint.x} cy={selectedPoint.y} r="12" fill="rgba(205, 246, 92, 0.2)" />
                <Circle cx={selectedPoint.x} cy={selectedPoint.y} r="6" fill="rgb(244, 246, 92)" />
              </>
            )}

            {/* Data points */}
            {validPoints.map((point, index) => (
              <Circle
                key={index}
                cx={point.x}
                cy={point.y}
                r="4"
                fill="rgb(218, 246, 92)"
                opacity={0.6}
              />
            ))}
          </Svg>

          {/* Selected value display */}
          {selectedPoint && (
            <View
              style={{
                position: 'absolute',
                bottom: -50,
                left: Math.max(0, Math.min(selectedPoint.x - 80, chartWidth - 160)),
                alignItems: 'center',
                minWidth: 160,
              }}
            >
              <Text style={{ color: colors.textPrimary, fontSize: 14, fontWeight: '700' }}>
                ${selectedPoint.cumulativeAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Text>
              <Text style={{ color: colors.textSecondary, fontSize: 11, marginTop: 2 }}>
                {selectedPoint.label}
              </Text>
              <Text style={{ color: colors.textMuted, fontSize: 10, marginTop: 2 }}>
                {selectedPoint.propertyTitle}
              </Text>
            </View>
          )}
        </View>

        {/* Timeline Labels */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: selectedPoint ? 60 : 16, flexWrap: 'wrap' }}>
          {investmentTimelineData.map((item, index) => {
            const pointIndex = validPoints.findIndex(p => p.label === item.label);
            return (
              <Text
                key={index}
                style={{
                  flex: investmentTimelineData.length <= 6 ? 1 : undefined,
                  minWidth: investmentTimelineData.length > 6 ? '16%' : undefined,
                  textAlign: 'center',
                  fontSize: 10,
                  color: selectedIndex === pointIndex && pointIndex >= 0 ? colors.primary : colors.textMuted,
                  fontWeight: selectedIndex === pointIndex && pointIndex >= 0 ? '600' : '400',
                  marginBottom: investmentTimelineData.length > 6 ? 4 : 0,
                }}
                numberOfLines={1}
              >
                {item.label.split(' ')[0]}
              </Text>
            );
          })}
        </View>
      </>
    );
  };

  return (
    <View
      style={{
        backgroundColor: isDarkColorScheme ? 'rgba(8, 105, 92, 0.35)' : '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: isDarkColorScheme ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
      }}
    >
      {/* View Toggle */}
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 20 }}>
        <TouchableOpacity
          onPress={() => {
            setView('income');
            setSelectedIndex(null);
          }}
          style={{
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 8,
            backgroundColor: view === 'income' ? 'rgba(22,163,74,0.15)' : 'transparent',
          }}
        >
          <Text
            style={{
              color: view === 'income' ? colors.primary : colors.textMuted,
              fontWeight: '600',
              fontSize: 13,
            }}
          >
            Rental Income / ROI
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            setView('investments');
            setSelectedIndex(null);
          }}
          style={{
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 8,
            backgroundColor: view === 'investments' ? 'rgba(22,163,74,0.15)' : 'transparent',
          }}
        >
          <Text
            style={{
              color: view === 'investments' ? colors.primary : colors.textMuted,
              fontWeight: '600',
              fontSize: 13,
            }}
          >
            Investment Timeline
          </Text>
        </TouchableOpacity>
      </View>

      {/* Render Selected Chart */}
      {view === 'income' ? renderRentalIncomeChart() : renderInvestmentTimelineChart()}
    </View>
  );
}
