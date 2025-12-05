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
  // Responsive layout - chart on left, legend on right
  // Chart takes up 35% of width, legend takes 60%, with 5% gap
  const chartWidthPercent = 0.35;
  const chartSize = Math.min(height - 8, width * chartWidthPercent);
  const centerX = (width * chartWidthPercent) / 2; // Center of chart area
  const centerY = height / 2;
  const radius = chartSize / 2 - 4; // Add padding
  const innerRadius = radius * 0.60; // Thicker donut for better visibility
  const legendStartX = width * chartWidthPercent + 16; // Start legend after chart + gap

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
          y={centerY - 6}
          fontSize={Math.max(10, Math.min(12, width / 30))}
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
          fontSize={Math.max(7, Math.min(9, width / 40))}
          fill={textColor}
          textAnchor="middle"
        >
          Total
        </SvgText>
      </Svg>

      {/* Legend - Right side, vertically centered */}
      <View style={{ 
        position: 'absolute',
        left: legendStartX,
        right: 12,
        top: 0,
        bottom: 0,
        justifyContent: 'center',
      }}>
        <View style={{ gap: Math.max(6, Math.min(10, height / 15)) }}>
          {data.map((item, index) => {
            const percentage = (item.value / total * 100);
            return (
              <View key={`legend-${index}`} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View
                  style={{
                    width: Math.max(10, Math.min(14, width / 25)),
                    height: Math.max(10, Math.min(14, width / 25)),
                    borderRadius: Math.max(5, Math.min(7, width / 50)),
                    backgroundColor: item.color,
                    flexShrink: 0,
                  }}
                />
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text 
                    style={{ 
                      fontSize: Math.max(9, Math.min(12, width / 30)), 
                      color: textColor, 
                      fontWeight: '600',
                    }}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {item.label}
                  </Text>
                  <Text style={{ 
                    fontSize: Math.max(8, Math.min(10, width / 35)), 
                    color: textColor, 
                    opacity: 0.75, 
                    marginTop: 2 
                  }}>
                    {percentage.toFixed(1)}% • ${item.value.toLocaleString('en-US', {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0,
                    })}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
}

