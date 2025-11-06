import React from 'react';
import { View, Text } from 'react-native';
import Svg, { Circle, Path, Text as SvgText } from 'react-native-svg';

interface InvestmentDistributionChartProps {
  data: { label: string; value: number; color: string }[];
  width?: number;
  height?: number;
  textColor?: string;
}

export function InvestmentDistributionChart({
  data,
  width = 280,
  height = 96,
  textColor = '#9CA3AF',
}: InvestmentDistributionChartProps) {
  // Optimized for landscape layout - chart on left, legend on right
  const chartSize = Math.min(height - 4, width * 0.30); // Chart size fits in height
  const centerX = width * 0.20; // Position chart on the left side
  const centerY = height / 2;
  const radius = chartSize / 2;
  const innerRadius = radius * 0.60; // Thicker donut for better visibility

  const total = data.reduce((sum, item) => sum + item.value, 0);

  let currentAngle = -90; // Start from top

  const createArc = (
    startAngle: number,
    endAngle: number,
    outerRadius: number,
    innerRadius: number
  ) => {
    const startAngleRad = (startAngle * Math.PI) / 180;
    const endAngleRad = (endAngle * Math.PI) / 180;

    const x1 = centerX + outerRadius * Math.cos(startAngleRad);
    const y1 = centerY + outerRadius * Math.sin(startAngleRad);
    const x2 = centerX + outerRadius * Math.cos(endAngleRad);
    const y2 = centerY + outerRadius * Math.sin(endAngleRad);

    const x3 = centerX + innerRadius * Math.cos(endAngleRad);
    const y3 = centerY + innerRadius * Math.sin(endAngleRad);
    const x4 = centerX + innerRadius * Math.cos(startAngleRad);
    const y4 = centerY + innerRadius * Math.sin(startAngleRad);

    const largeArc = endAngle - startAngle > 180 ? 1 : 0;

    return [
      `M ${x1} ${y1}`,
      `A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${x2} ${y2}`,
      `L ${x3} ${y3}`,
      `A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${x4} ${y4}`,
      'Z',
    ].join(' ');
  };

  const segments = data.map((item, index) => {
    const percentage = (item.value / total) * 100;
    const angle = (percentage / 100) * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;

    const segment = {
      path: createArc(startAngle, endAngle, radius, innerRadius),
      color: item.color,
      label: item.label,
      percentage,
      midAngle: startAngle + angle / 2,
    };

    currentAngle = endAngle;
    return segment;
  });

  return (
    <View style={{ width, height, position: 'relative' }}>
      {/* Donut Chart - Left side */}
      <Svg width={width} height={height} style={{ position: 'absolute', left: 0, top: 0 }}>
        {segments.map((segment, index) => (
          <Path
            key={`segment-${index}`}
            d={segment.path}
            fill={segment.color}
            stroke="transparent"
            strokeWidth="1"
          />
        ))}

        {/* Center text */}
        <SvgText
          x={centerX}
          y={centerY - 5}
          fontSize="11"
          fontWeight="bold"
          fill={textColor}
          textAnchor="middle"
        >
          {total.toLocaleString('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          })}
        </SvgText>
        <SvgText
          x={centerX}
          y={centerY + 8}
          fontSize="8"
          fill={textColor}
          textAnchor="middle"
        >
          Total
        </SvgText>
      </Svg>

      {/* Legend - Right side, vertically centered */}
      <View style={{ 
        position: 'absolute',
        right: 12,
        top: 0,
        bottom: 0,
        justifyContent: 'center',
        left: 150,
      }}>
        <View style={{ gap: 10 }}>
          {data.map((item, index) => (
            <View key={`legend-${index}`} style={{ flexDirection: 'row', alignItems: 'center', gap: 20 }}>
              <View
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: 6,
                  backgroundColor: item.color,
                  flexShrink: 0,
                }}
              />
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text 
                  style={{ 
                    fontSize: 10, 
                    color: textColor, 
                    fontWeight: '600',
                  }}
                  numberOfLines={1}
                >
                  {item.label}
                </Text>
                <Text style={{ fontSize: 9, color: textColor, opacity: 0.75, marginTop: 1 }}>
                  {(item.value / total * 100).toFixed(0)}%
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

