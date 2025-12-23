import React, { useState } from 'react';
import { View, Text, Dimensions, PanResponder } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path, Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
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
  const chartWidth = screenWidth - 80; // Account for padding
  const chartHeight = height;
  const padding = { top: 20, right: 16, bottom: 40, left: 16 };
  const graphWidth = chartWidth - padding.left - padding.right;
  const graphHeight = chartHeight - padding.top - padding.bottom;

  const maxValue = Math.max(...data.map(d => d.value), 1);
  const minValue = Math.min(...data.map(d => d.value), 0);

  // Convert to SVG path coordinates
  const points = data.map((item, index) => {
    const divisor = data.length > 1 ? (data.length - 1) : 1;
    const x = padding.left + (index / divisor) * graphWidth;
    const normalizedValue = (item.value - minValue) / (maxValue - minValue || 1);
    const y = padding.top + graphHeight - (normalizedValue * graphHeight);
    
    return { 
      x: isNaN(x) ? padding.left : x, 
      y: isNaN(y) ? (padding.top + graphHeight) : y, 
      value: item.value,
      date: item.date
    };
  });

  // Validate all points
  const validPoints = points.filter(p => !isNaN(p.x) && !isNaN(p.y) && isFinite(p.x) && isFinite(p.y));
  
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

  // Create dynamic area path that goes from start to selected point (or end if no selection)
  let dynamicAreaPath = '';
  if (validPoints.length > 0) {
    // If no point is selected, show full area
    if (selectedIndex === null) {
      dynamicAreaPath = `${path} L ${validPoints[validPoints.length - 1].x} ${padding.top + graphHeight} L ${validPoints[0].x} ${padding.top + graphHeight} Z`;
    } else {
      // Create path from start to selected point
      const selectedPoint = validPoints[selectedIndex];
      if (selectedIndex === 0) {
        // If first point is selected, just draw a line
        dynamicAreaPath = `M ${validPoints[0].x} ${validPoints[0].y} L ${validPoints[0].x} ${padding.top + graphHeight} L ${validPoints[0].x} ${padding.top + graphHeight} Z`;
      } else if (selectedIndex > 0) {
        // Build path up to selected point
        let partialPath = `M ${validPoints[0].x} ${validPoints[0].y}`;
        for (let i = 1; i <= selectedIndex; i++) {
          const prev = validPoints[i - 1];
          const curr = validPoints[i];
          const next = validPoints[i + 1];
          
          if (next && i < selectedIndex) {
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

  // Calculate selected point
  const selectedPoint = selectedIndex !== null && validPoints[selectedIndex] && selectedIndex < validPoints.length
    ? validPoints[selectedIndex] 
    : null;

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
      
      if (selectedIndex !== closestIndex) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      setSelectedIndex(closestIndex);
    }
  };

  // PanResponder for drag gestures
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

  // Generate unique gradient ID to avoid conflicts
  const gradientId = `lineGraphGradient-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <View style={{ alignItems: 'center' }}>
      {/* Chart Container with PanResponder */}
      <View
        style={{ position: 'relative' }}
        {...panResponder.panHandlers}
      >
        <Svg width={chartWidth} height={chartHeight}>
          <Defs>
            <LinearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
              <Stop offset="0%" stopColor={gradientColor} stopOpacity="0.3" />
              <Stop offset="100%" stopColor={gradientColor} stopOpacity="0.05" />
            </LinearGradient>
          </Defs>

          {/* Dynamic Area fill - updates with drag */}
          {dynamicAreaPath && <Path d={dynamicAreaPath} fill={`url(#${gradientId})`} />}

          {/* Main line */}
          {path && (
            <Path
              d={path}
              stroke={lineColor}
              strokeWidth="2.5"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Selected point indicator */}
          {selectedPoint && (
            <>
              <Circle cx={selectedPoint.x} cy={selectedPoint.y} r="12" fill={gradientColor} opacity="0.2" />
              <Circle cx={selectedPoint.x} cy={selectedPoint.y} r="6" fill={lineColor} />
            </>
          )}

          {/* Data points */}
          {validPoints.map((point, index) => (
            <Circle
              key={index}
              cx={point.x}
              cy={point.y}
              r="4"
              fill={lineColor}
              opacity={selectedIndex === index ? 1 : 0.6}
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
            <View
              style={{
                backgroundColor: isDarkColorScheme
                  ? 'rgba(0, 0, 0, 0.9)'
                  : 'rgba(0, 0, 0, 0.85)',
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: 8,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.3,
                shadowRadius: 4,
                elevation: 5,
              }}
            >
              <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '700' }}>
                ${selectedPoint.value.toFixed(2)}
              </Text>
              <Text style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: 11, marginTop: 2 }}>
                {selectedPoint.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </Text>
            </View>
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
      </View>

      {/* X-axis labels */}
      {showLabels && (
        <View style={{ 
          flexDirection: 'row', 
          justifyContent: 'space-between', 
          width: chartWidth, 
          marginTop: selectedPoint ? 60 : 8 
        }}>
          {data.map((item, index) => {
            const pointIndex = validPoints.findIndex(p => p.date.getTime() === item.date.getTime());
            return (
              <Text
                key={index}
                style={{
                  fontSize: 10,
                  color: selectedIndex === pointIndex && pointIndex >= 0 ? lineColor : colors.textMuted,
                  textAlign: 'center',
                  flex: 1,
                  fontWeight: selectedIndex === pointIndex && pointIndex >= 0 ? '600' : '400',
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

