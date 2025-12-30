import React, { useState, useMemo, useRef } from 'react';
import { View, Text, Dimensions, PanResponder } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path, Circle, Defs, LinearGradient, Stop, Line } from 'react-native-svg';
import { useColorScheme } from '@/lib/useColorScheme';
import * as Haptics from 'expo-haptics';

export interface LineGraphDataPoint {
  date: Date;
  value: number;
}

interface SimpleLineGraphProps {
  data: LineGraphDataPoint[];
  lineColor?: string;
  gradientColor?: string;
  height?: number;
  showLabels?: boolean;
}

const { width: screenWidth } = Dimensions.get('window');

export function SimpleLineGraph({
  data,
  lineColor = '#4484B2',
  gradientColor = '#4484B2',
  height = 200,
  showLabels = true,
}: SimpleLineGraphProps) {
  const { colors, isDarkColorScheme } = useColorScheme();
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [interpolatedX, setInterpolatedX] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragActiveRef = useRef(false);
  const lastHapticIndexRef = useRef<number | null>(null);
  
  const chartWidth = screenWidth - 80;
  const chartHeight = height;
  const padding = { top: 30, right: 16, bottom: 50, left: 16 };
  const graphWidth = chartWidth - padding.left - padding.right;
  const graphHeight = chartHeight - padding.top - padding.bottom;

  const maxValue = Math.max(...data.map(d => d.value), 1);
  const minValue = Math.min(...data.map(d => d.value), 0);
  const valueRange = maxValue - minValue || 1;

  // Convert to SVG path coordinates
  const points = useMemo(() => {
    return data.map((item, index) => {
      const divisor = data.length > 1 ? (data.length - 1) : 1;
      const x = padding.left + (index / divisor) * graphWidth;
      const normalizedValue = (item.value - minValue) / valueRange;
      const y = padding.top + graphHeight - (normalizedValue * graphHeight);
      
      return { 
        x: isNaN(x) ? padding.left : x, 
        y: isNaN(y) ? (padding.top + graphHeight) : y, 
        value: item.value,
        date: item.date
      };
    });
  }, [data, maxValue, minValue, graphWidth, graphHeight, padding.left, padding.top, valueRange]);

  const validPoints = useMemo(() => {
    return points.filter(p => !isNaN(p.x) && !isNaN(p.y) && isFinite(p.x) && isFinite(p.y));
  }, [points]);

  // Calculate interpolated point
  const interpolatedPoint = useMemo(() => {
    if (interpolatedX !== null && validPoints.length > 0) {
      const adjustedX = interpolatedX;
      let leftIndex = 0;
      let rightIndex = validPoints.length - 1;
      
      for (let i = 0; i < validPoints.length - 1; i++) {
        if (validPoints[i].x <= adjustedX && validPoints[i + 1].x >= adjustedX) {
          leftIndex = i;
          rightIndex = i + 1;
          break;
        }
      }
      
      if (adjustedX <= validPoints[0].x) {
        return {
          x: adjustedX,
          y: validPoints[0].y,
          value: validPoints[0].value,
          date: validPoints[0].date,
        };
      } else if (adjustedX >= validPoints[validPoints.length - 1].x) {
        return {
          x: adjustedX,
          y: validPoints[validPoints.length - 1].y,
          value: validPoints[validPoints.length - 1].value,
          date: validPoints[validPoints.length - 1].date,
        };
      }
      
      const leftPoint = validPoints[leftIndex];
      const rightPoint = validPoints[rightIndex];
      const distance = rightPoint.x - leftPoint.x;
      const t = distance > 0 ? (adjustedX - leftPoint.x) / distance : 0;
      
      const leftDateMs = leftPoint.date.getTime();
      const rightDateMs = rightPoint.date.getTime();
      const interpolatedDateMs = leftDateMs + (rightDateMs - leftDateMs) * t;
      
      return {
        x: adjustedX,
        y: leftPoint.y + (rightPoint.y - leftPoint.y) * t,
        value: leftPoint.value + (rightPoint.value - leftPoint.value) * t,
        date: new Date(interpolatedDateMs),
      };
    }
    return null;
  }, [interpolatedX, validPoints]);
  
  const selectedPoint = interpolatedPoint || 
    (selectedIndex !== null && validPoints[selectedIndex] && selectedIndex < validPoints.length
      ? validPoints[selectedIndex] 
      : null);

  if (validPoints.length === 0) {
    return (
      <View style={{ height: chartHeight, justifyContent: 'center', alignItems: 'center' }}>
        <Ionicons name="trending-up-outline" size={32} color={colors.textMuted} />
        <Text style={{ color: colors.textMuted, marginTop: 8, fontSize: 12 }}>
          No data available
        </Text>
      </View>
    );
  }

  // Create smooth curved path using Catmull-Rom spline
  const path = useMemo(() => {
    if (validPoints.length === 0) return '';
    if (validPoints.length === 1) {
      return `M ${validPoints[0].x} ${validPoints[0].y} L ${validPoints[0].x + graphWidth} ${validPoints[0].y}`;
    }
    
    let pathStr = `M ${validPoints[0].x} ${validPoints[0].y}`;
    
    for (let i = 0; i < validPoints.length - 1; i++) {
      const p0 = validPoints[Math.max(i - 1, 0)];
      const p1 = validPoints[i];
      const p2 = validPoints[i + 1];
      const p3 = validPoints[Math.min(i + 2, validPoints.length - 1)];
      
      const tension = 0.3;
      const cp1x = p1.x + (p2.x - p0.x) * tension;
      const cp1y = p1.y + (p2.y - p0.y) * tension;
      const cp2x = p2.x - (p3.x - p1.x) * tension;
      const cp2y = p2.y - (p3.y - p1.y) * tension;
      
      pathStr += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }
    
    return pathStr;
  }, [validPoints, graphWidth]);

  // Dynamic area path
  const dynamicAreaPath = useMemo(() => {
    if (validPoints.length === 0 || !path) return '';
    
    if (!selectedPoint) {
      return `${path} L ${validPoints[validPoints.length - 1].x} ${padding.top + graphHeight} L ${validPoints[0].x} ${padding.top + graphHeight} Z`;
    }
    
    const selectedX = selectedPoint.x;
    const selectedY = selectedPoint.y;
    
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
      return `M ${validPoints[0].x} ${validPoints[0].y} L ${selectedX} ${selectedY} L ${selectedX} ${padding.top + graphHeight} L ${validPoints[0].x} ${padding.top + graphHeight} Z`;
    } else {
      let partialPath = `M ${validPoints[0].x} ${validPoints[0].y}`;
      
      for (let i = 0; i < segmentEndIndex; i++) {
        const p0 = validPoints[Math.max(i - 1, 0)];
        const p1 = validPoints[i];
        const p2 = validPoints[i + 1];
        const p3 = validPoints[Math.min(i + 2, validPoints.length - 1)];
        
        const tension = 0.3;
        const cp1x = p1.x + (p2.x - p0.x) * tension;
        const cp1y = p1.y + (p2.y - p0.y) * tension;
        const cp2x = p2.x - (p3.x - p1.x) * tension;
        const cp2y = p2.y - (p3.y - p1.y) * tension;
        
        partialPath += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
      }
      
      partialPath += ` L ${selectedX} ${selectedY}`;
      return `${partialPath} L ${selectedX} ${padding.top + graphHeight} L ${validPoints[0].x} ${padding.top + graphHeight} Z`;
    }
  }, [validPoints, selectedPoint, path, padding.top, graphHeight]);

  const updateSelectedPosition = (x: number) => {
    const adjustedX = x;
    const extendedLeft = padding.left - 20;
    const extendedRight = padding.left + graphWidth + 20;
    
    if (adjustedX >= extendedLeft && adjustedX <= extendedRight && validPoints.length > 0) {
      const clampedX = Math.max(padding.left, Math.min(adjustedX, padding.left + graphWidth));
      
      let closestIndex = 0;
      let minDistance = Math.abs(validPoints[0].x - clampedX);
      
      for (let i = 1; i < validPoints.length; i++) {
        const distance = Math.abs(validPoints[i].x - clampedX);
        if (distance < minDistance) {
          minDistance = distance;
          closestIndex = i;
        }
      }
      
      // Haptic feedback when crossing data points
      if (closestIndex !== lastHapticIndexRef.current) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        lastHapticIndexRef.current = closestIndex;
      }
      
      setInterpolatedX(clampedX);
      setSelectedIndex(closestIndex);
    }
  };

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => {
      dragActiveRef.current = true;
      setIsDragging(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      return true;
    },
    onMoveShouldSetPanResponder: (evt, gestureState) => {
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
        const { locationX } = evt.nativeEvent;
        updateSelectedPosition(locationX);
      }
    },
    onPanResponderRelease: () => {
      dragActiveRef.current = false;
      setIsDragging(false);
      lastHapticIndexRef.current = null;
    },
    onPanResponderTerminate: () => {
      dragActiveRef.current = false;
      setIsDragging(false);
      lastHapticIndexRef.current = null;
    },
  });

  const gradientId = `lineGraphGradient-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <View style={{ alignItems: 'center', margin:50}}>
      <View
        style={{ 
          position: 'relative',
          paddingVertical: 20,
          marginVertical: -20,
        }}
        {...panResponder.panHandlers}
      >
        <Svg width={chartWidth} height={chartHeight}>
          <Defs>
            <LinearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
              <Stop offset="0%" stopColor={gradientColor} stopOpacity="0.35" />
              <Stop offset="50%" stopColor={gradientColor} stopOpacity="0.15" />
              <Stop offset="100%" stopColor={gradientColor} stopOpacity="0.02" />
            </LinearGradient>
          </Defs>

          {/* Subtle grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
            const y = padding.top + graphHeight * (1 - ratio);
            return (
              <Line
                key={i}
                x1={padding.left}
                y1={y}
                x2={padding.left + graphWidth}
                y2={y}
                stroke={isDarkColorScheme ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}
                strokeWidth="1"
                strokeDasharray="4,4"
              />
            );
          })}

          {/* Dynamic Area fill */}
          {dynamicAreaPath && <Path d={dynamicAreaPath} fill={`url(#${gradientId})`} />}

          {/* Main line with shadow effect */}
          {path && (
            <>
              <Path
                d={path}
                stroke={lineColor}
                strokeWidth="3"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.15"
                strokeDashoffset="2"
              />
              <Path
                d={path}
                stroke={lineColor}
                strokeWidth="2.5"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </>
          )}

          {/* Vertical indicator line */}
          {selectedPoint && (
            <Line
              x1={selectedPoint.x}
              y1={padding.top}
              x2={selectedPoint.x}
              y2={padding.top + graphHeight}
              stroke={lineColor}
              strokeWidth="1.5"
              strokeDasharray="4,4"
              opacity="0.3"
            />
          )}

          {/* Selected point with glow effect */}
          {selectedPoint && (
            <>
              <Circle cx={selectedPoint.x} cy={selectedPoint.y} r="16" fill={gradientColor} opacity="0.15" />
              <Circle cx={selectedPoint.x} cy={selectedPoint.y} r="10" fill={gradientColor} opacity="0.25" />
              <Circle cx={selectedPoint.x} cy={selectedPoint.y} r="7" fill={lineColor} />
              <Circle cx={selectedPoint.x} cy={selectedPoint.y} r="3" fill="white" />
            </>
          )}

          {/* Data points with subtle styling */}
          {!isDragging && validPoints.map((point, index) => (
            <Circle
              key={index}
              cx={point.x}
              cy={point.y}
              r="3.5"
              fill={selectedIndex === index ? lineColor : isDarkColorScheme ? '#1a1a1a' : '#ffffff'}
              stroke={lineColor}
              strokeWidth="2"
              opacity={selectedIndex === index ? 1 : 0.4}
            />
          ))}
        </Svg>

        {/* Enhanced tooltip */}
        {selectedPoint && (() => {
          const tooltipWidth = 150;
          const tooltipHeight = 68;
          const margin = 20;
          
          const top = selectedPoint.y - tooltipHeight - margin;
          let left = selectedPoint.x - tooltipWidth / 2;
          
          if (left < 0) left = 8;
          if (left + tooltipWidth > chartWidth) left = chartWidth - tooltipWidth - 8;
          
          return (
            <View
              style={{
                position: 'absolute',
                top: top,
                left: left,
                backgroundColor: isDarkColorScheme
                  ? 'rgba(20, 20, 20, 0.95)'
                  : 'rgba(0, 0, 0, 0.9)',
                paddingHorizontal: 16,
                paddingVertical: 12,
                borderRadius: 12,
                minWidth: tooltipWidth,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.4,
                shadowRadius: 8,
                elevation: 8,
                borderWidth: 1,
                borderColor: isDarkColorScheme 
                  ? 'rgba(255, 255, 255, 0.1)' 
                  : 'rgba(255, 255, 255, 0.05)',
              }}
            >
              <Text style={{ 
                color: '#FFFFFF', 
                fontSize: 18, 
                fontWeight: '700',
                letterSpacing: 0.3,
              }}>
                ${selectedPoint.value.toFixed(2)}
              </Text>
              <Text style={{ 
                color: 'rgba(255, 255, 255, 0.7)', 
                fontSize: 12, 
                marginTop: 4,
                fontWeight: '500',
              }}>
                {selectedPoint.date.toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric', 
                  year: 'numeric' 
                })}
              </Text>
              <View
                style={{
                  position: 'absolute',
                  bottom: -7,
                  left: selectedPoint.x - left - 7,
                  width: 0,
                  height: 0,
                  borderLeftWidth: 7,
                  borderRightWidth: 7,
                  borderTopWidth: 7,
                  borderLeftColor: 'transparent',
                  borderRightColor: 'transparent',
                  borderTopColor: isDarkColorScheme
                    ? 'rgba(20, 20, 20, 0.95)'
                    : 'rgba(0, 0, 0, 0.9)',
                }}
              />
            </View>
          );
        })()}
      </View>

      {/* Enhanced X-axis labels */}
      {showLabels && (
        <View style={{ 
          flexDirection: 'row', 
          justifyContent: 'space-between', 
          width: chartWidth, 
          // marginTop: selectedPoint ? 65 : 12,
          paddingHorizontal: 4,
        }}>
          {data.map((item, index) => {
            const pointIndex = validPoints.findIndex(p => p.date.getTime() === item.date.getTime());
            const isSelected = selectedIndex === pointIndex && pointIndex >= 0;
            
            return (
              <Text
                key={index}
                style={{
                  fontSize: 11,
                  color: isSelected ? lineColor : colors.textMuted,
                  textAlign: 'center',
                  flex: 1,
                  fontWeight: isSelected ? '700' : '500',
                  opacity: isSelected ? 1 : 0.7,
                  letterSpacing: 0.2,
                }}
                numberOfLines={1}
              >
                {item.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </Text>
            );
          })}
        </View>
      )}
    </View>
  );
}