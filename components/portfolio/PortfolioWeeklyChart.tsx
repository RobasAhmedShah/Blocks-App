import React, { useState, useMemo, useRef } from 'react';
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
  const [interpolatedX, setInterpolatedX] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragActiveRef = useRef(false);
  const chartWidth = Dimensions.get('window').width - 64;
  const chartHeight = 200;
  const padding = { top: 40, right: 16, bottom: 40, left: 16 };
  const graphWidth = chartWidth - padding.left - padding.right;
  const graphHeight = chartHeight - padding.top - padding.bottom;

  // ========== RENTAL INCOME CHART DATA (from transactions) ==========
  const rentalIncomeData = useMemo(() => {
    const rentalTransactions = transactions.filter(tx => 
      (tx.type === 'rental_income' || tx.type === 'rental') && 
      tx.status === 'completed'
    );

    if (rentalTransactions.length === 0) {
      return [];
    }

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

    const months = Array.from(monthlyIncomeMap.values())
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    const now = new Date();
    const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);
    
    return months.filter(month => month.date >= twelveMonthsAgo);
  }, [transactions]);

  const maxRentalIncome = rentalIncomeData.length > 0
    ? Math.max(...rentalIncomeData.map(m => m.income || 0), monthlyIncome, 1)
    : monthlyIncome || 1;

  // ========== INVESTMENT TIMELINE CHART DATA (from transactions) ==========
  const investmentTimelineData = useMemo(() => {
    const investmentTransactions = transactions.filter(tx => 
      tx.type === 'investment' && 
      tx.status === 'completed'
    );

    if (investmentTransactions.length === 0) {
      return [];
    }

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

  // Calculate investment chart points at top level (for hooks compliance)
  const investmentChartPoints = useMemo(() => {
    if (investmentTimelineData.length === 0) return [];
    
    return investmentTimelineData.map((item, index) => {
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
  }, [investmentTimelineData, maxInvestmentAmount, graphWidth, graphHeight, padding.left, padding.top]);

  const validInvestmentPoints = useMemo(() => {
    return investmentChartPoints.filter(p => !isNaN(p.x) && !isNaN(p.y) && isFinite(p.x) && isFinite(p.y));
  }, [investmentChartPoints]);

  // Calculate interpolated point at top level (for hooks compliance)
  const interpolatedPoint = useMemo(() => {
    if (interpolatedX !== null && validInvestmentPoints.length > 0) {
      // Find the point at interpolatedX position
      const adjustedX = interpolatedX;
      let leftIndex = 0;
      let rightIndex = validInvestmentPoints.length - 1;
      
      for (let i = 0; i < validInvestmentPoints.length - 1; i++) {
        if (validInvestmentPoints[i].x <= adjustedX && validInvestmentPoints[i + 1].x >= adjustedX) {
          leftIndex = i;
          rightIndex = i + 1;
          break;
        }
      }
      
      if (adjustedX <= validInvestmentPoints[0].x) {
        return {
          x: adjustedX,
          y: validInvestmentPoints[0].y,
          cumulativeAmount: validInvestmentPoints[0].cumulativeAmount,
          date: validInvestmentPoints[0].date,
          propertyTitle: validInvestmentPoints[0].propertyTitle,
          label: validInvestmentPoints[0].label,
        };
      } else if (adjustedX >= validInvestmentPoints[validInvestmentPoints.length - 1].x) {
        return {
          x: adjustedX,
          y: validInvestmentPoints[validInvestmentPoints.length - 1].y,
          cumulativeAmount: validInvestmentPoints[validInvestmentPoints.length - 1].cumulativeAmount,
          date: validInvestmentPoints[validInvestmentPoints.length - 1].date,
          propertyTitle: validInvestmentPoints[validInvestmentPoints.length - 1].propertyTitle,
          label: validInvestmentPoints[validInvestmentPoints.length - 1].label,
        };
      }
      
      const leftPoint = validInvestmentPoints[leftIndex];
      const rightPoint = validInvestmentPoints[rightIndex];
      const distance = rightPoint.x - leftPoint.x;
      const t = distance > 0 ? (adjustedX - leftPoint.x) / distance : 0;
      
      return {
        x: adjustedX,
        y: leftPoint.y + (rightPoint.y - leftPoint.y) * t,
        cumulativeAmount: leftPoint.cumulativeAmount + (rightPoint.cumulativeAmount - leftPoint.cumulativeAmount) * t,
        date: leftPoint.date,
        propertyTitle: leftPoint.propertyTitle || rightPoint.propertyTitle,
        label: leftPoint.label,
      };
    }
    return null;
  }, [interpolatedX, validInvestmentPoints]);

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

    // Use pre-calculated validPoints from top level
    const validPoints = validInvestmentPoints;
    
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

    // Use pre-calculated interpolatedPoint from top level
    const selectedPoint = interpolatedPoint || 
      (selectedIndex !== null && validPoints[selectedIndex] && selectedIndex < validPoints.length
        ? validPoints[selectedIndex] 
        : null);

    // Calculate dynamic area path up to the selected/interpolated point
    let dynamicAreaPath = '';
    if (validPoints.length > 0) {
      if (!selectedPoint) {
        dynamicAreaPath = `${path} L ${validPoints[validPoints.length - 1].x} ${padding.top + graphHeight} L ${validPoints[0].x} ${padding.top + graphHeight} Z`;
      } else {
        const selectedX = selectedPoint.x;
        const selectedY = selectedPoint.y;
        
        // Find which segment this point is on
        let segmentEndIndex = 0;
        for (let i = 0; i < validPoints.length - 1; i++) {
          if (validPoints[i].x <= selectedX && validPoints[i + 1].x >= selectedX) {
            segmentEndIndex = i + 1;
            break;
          }
        }
        if (selectedX >= validPoints[validPoints.length - 1].x) {
          segmentEndIndex = validPoints.length - 1;
        }
        
        if (segmentEndIndex === 0) {
          dynamicAreaPath = `M ${validPoints[0].x} ${validPoints[0].y} L ${selectedX} ${selectedY} L ${selectedX} ${padding.top + graphHeight} L ${validPoints[0].x} ${padding.top + graphHeight} Z`;
        } else {
          let partialPath = `M ${validPoints[0].x} ${validPoints[0].y}`;
          for (let i = 1; i < segmentEndIndex; i++) {
            const prev = validPoints[i - 1];
            const curr = validPoints[i];
            const next = validPoints[i + 1];
            
            if (next) {
              const cp1x = prev.x + (curr.x - prev.x) / 2;
              const cp1y = prev.y;
              const cp2x = curr.x - (next.x - curr.x) / 2;
              const cp2y = curr.y;
              partialPath += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${curr.x} ${curr.y}`;
            } else {
              partialPath += ` L ${curr.x} ${curr.y}`;
            }
          }
          // Add line to interpolated point
          const lastPoint = validPoints[segmentEndIndex - 1];
          partialPath += ` L ${selectedX} ${selectedY}`;
          dynamicAreaPath = `${partialPath} L ${selectedX} ${padding.top + graphHeight} L ${validPoints[0].x} ${padding.top + graphHeight} Z`;
        }
      }
    }

    // Calculate interpolated point and value based on X position
    const getInterpolatedPoint = (x: number) => {
      const adjustedX = x - padding.left;
      
      // Allow dragging slightly outside the graph area for easier interaction
      const extendedLeft = -20;
      const extendedRight = graphWidth + 20;
      
      if (adjustedX < extendedLeft || adjustedX > extendedRight || validPoints.length === 0) {
        return null;
      }
      
      // Clamp to valid range
      const clampedX = Math.max(0, Math.min(adjustedX, graphWidth));
      
      // Find the two nearest points for interpolation
      let leftIndex = 0;
      let rightIndex = validPoints.length - 1;
      
      for (let i = 0; i < validPoints.length - 1; i++) {
        if (validPoints[i].x <= clampedX && validPoints[i + 1].x >= clampedX) {
          leftIndex = i;
          rightIndex = i + 1;
          break;
        }
      }
      
      // Handle edge cases
      if (clampedX <= validPoints[0].x) {
        leftIndex = 0;
        rightIndex = 0;
      } else if (clampedX >= validPoints[validPoints.length - 1].x) {
        leftIndex = validPoints.length - 1;
        rightIndex = validPoints.length - 1;
      }
      
      const leftPoint = validPoints[leftIndex];
      const rightPoint = validPoints[rightIndex];
      
      // If same point, return it directly
      if (leftIndex === rightIndex) {
        return {
          x: clampedX,
          y: leftPoint.y,
          cumulativeAmount: leftPoint.cumulativeAmount,
          date: leftPoint.date,
          propertyTitle: leftPoint.propertyTitle,
          label: leftPoint.label,
          index: leftIndex,
          isInterpolated: false,
        };
      }
      
      // Interpolate between the two points
      const distance = rightPoint.x - leftPoint.x;
      const t = distance > 0 ? (clampedX - leftPoint.x) / distance : 0;
      
      // Linear interpolation for Y position
      const interpolatedY = leftPoint.y + (rightPoint.y - leftPoint.y) * t;
      
      // Linear interpolation for cumulative amount
      const interpolatedAmount = leftPoint.cumulativeAmount + 
        (rightPoint.cumulativeAmount - leftPoint.cumulativeAmount) * t;
      
      // Use the left point's metadata (date, property title, etc.)
      return {
        x: clampedX,
        y: interpolatedY,
        cumulativeAmount: interpolatedAmount,
        date: leftPoint.date,
        propertyTitle: leftPoint.propertyTitle || rightPoint.propertyTitle,
        label: leftPoint.label,
        index: leftIndex,
        isInterpolated: true,
      };
    };

    const updateSelectedPosition = (x: number) => {
      const interpolated = getInterpolatedPoint(x);
      
      if (interpolated) {
        setInterpolatedX(interpolated.x);
        setSelectedIndex(interpolated.index);
      }
    };

    // Enhanced PanResponder with smooth interpolation
    const panResponder = PanResponder.create({
      onStartShouldSetPanResponder: () => {
        dragActiveRef.current = true;
        setIsDragging(true);
        return true;
      },
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        // Very sensitive for smooth dragging
        return Math.abs(gestureState.dx) > 0.1 || Math.abs(gestureState.dy) > 0.1;
      },
      onPanResponderGrant: (evt) => {
        dragActiveRef.current = true;
        setIsDragging(true);
        const { locationX } = evt.nativeEvent;
        updateSelectedPosition(locationX);
      },
      onPanResponderMove: (evt) => {
        if (dragActiveRef.current) {
          // Use locationX for smooth position tracking during drag
          const { locationX } = evt.nativeEvent;
          updateSelectedPosition(locationX);
        }
      },
      onPanResponderRelease: () => {
        dragActiveRef.current = false;
        setIsDragging(false);
        // Keep interpolated position visible after release
      },
      onPanResponderTerminate: () => {
        dragActiveRef.current = false;
        setIsDragging(false);
        // Keep selection if gesture is terminated
      },
    });

    const totalInvested = investmentTimelineData.length > 0
      ? investmentTimelineData[investmentTimelineData.length - 1].cumulativeAmount
      : 0;

    // Calculate tooltip position - ALWAYS ABOVE THE POINT
    const getTooltipPosition = () => {
      if (!selectedPoint) return { top: 0, left: 0 };
      
      const tooltipWidth = 140;
      const tooltipHeight = 80;
      const margin = 16;
      
      // Always position above the point
      const top = selectedPoint.y - tooltipHeight - margin;
      let left = selectedPoint.x - tooltipWidth / 2;
      
      // Adjust if tooltip goes off screen (left side)
      if (left < 0) {
        left = 8;
      }
      
      // Adjust if tooltip goes off screen (right side)
      if (left + tooltipWidth > chartWidth) {
        left = chartWidth - tooltipWidth - 8;
      }
      
      return { top, left };
    };

    const tooltipPosition = selectedPoint ? getTooltipPosition() : { top: 0, left: 0 };

    return (
      <>
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

        <View
          style={{ 
            position: 'relative', 
            minHeight: chartHeight + 20,
            // Increase touchable area for easier dragging
            paddingVertical: 20,
            marginVertical: -20,
          }}
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

            {dynamicAreaPath && <Path d={dynamicAreaPath} fill="rgba(213, 246, 92, 0.16)" />}

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

            {selectedPoint && (
              <>
                <Circle cx={selectedPoint.x} cy={selectedPoint.y} r="12" fill="rgba(205, 246, 92, 0.2)" />
                <Circle cx={selectedPoint.x} cy={selectedPoint.y} r="6" fill="rgb(244, 246, 92)" />
              </>
            )}

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

          {/* Tooltip positioned ALWAYS above the point */}
          {selectedPoint && (
            <View
              style={{
                position: 'absolute',
                top: tooltipPosition.top,
                left: tooltipPosition.left,
                backgroundColor: isDarkColorScheme
                  ? 'rgba(0, 0, 0, 0.53)'
                  : 'rgba(92, 230, 74, 0.67)',
                paddingHorizontal: 12,
                paddingVertical: 10,
                borderRadius: 12,
                minWidth: 140,
                shadowColor: isDarkColorScheme ? colors.border : colors.border,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 8,
                borderWidth: 1,
                marginBottom: 10,
                borderColor: isDarkColorScheme 
                  ? 'rgba(218, 246, 92, 0.3)' 
                  : 'rgba(255, 255, 255, 0.1)',
              }}
            >
              <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '700', marginBottom: 4 }}>
                ${selectedPoint.cumulativeAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Text>
              <Text style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: 12, marginBottom: 2 }}>
                {selectedPoint.label}
              </Text>
              <Text 
                style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: 11 }}
                numberOfLines={2}
              >
                {selectedPoint.propertyTitle}
              </Text>
              
              {/* Tooltip Arrow - Always pointing down */}
              <View
                style={{
                  position: 'absolute',
                  bottom: -8,
                  left: selectedPoint.x - tooltipPosition.left - 6,
                  width: 0,
                  height: 0,
                  borderLeftWidth: 6,
                  borderRightWidth: 6,
                  borderTopWidth: 8,
                  borderLeftColor: 'transparent',
                  borderRightColor: 'transparent',
                  borderTopColor: isDarkColorScheme 
                    ? 'rgba(0, 0, 0, 0.53)' 
                    : 'rgba(92, 230, 74, 0.67)',
                }}
              />
            </View>
          )}
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 16, flexWrap: 'wrap' }}>
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
        backgroundColor: isDarkColorScheme ? 'rgba(8, 105, 92, 0.36)' : '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: isDarkColorScheme ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
      }}
    >
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 20 }}>
        <TouchableOpacity
          onPress={() => {
            setView('income');
            setSelectedIndex(null);
            setInterpolatedX(null);
            setIsDragging(false);
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
            setInterpolatedX(null);
            setIsDragging(false);
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

      {view === 'income' ? renderRentalIncomeChart() : renderInvestmentTimelineChart()}
    </View>
  );
}