import React from 'react';
import { View } from 'react-native';
import Svg, { Rect, Line, Text as SvgText } from 'react-native-svg';

interface MonthlyIncomeChartProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  backgroundColor?: string;
  textColor?: string;
}

export function MonthlyIncomeChart({
  data,
  width = 280,
  height = 96,
  color = '#16A34A',
  backgroundColor = 'transparent',
  textColor = '#9CA3AF',
}: MonthlyIncomeChartProps) {
  const padding = { top: 8, right: 8, bottom: 20, left: 8 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const maxValue = Math.max(...data, 0) * 1.2 || 300;
  const barWidth = chartWidth / data.length - 4;

  const months = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];

  return (
    <View style={{ width, height, backgroundColor }}>
      <Svg width={width} height={height}>
        {/* Grid line */}
        <Line
          x1={padding.left}
          y1={padding.top + chartHeight}
          x2={width - padding.right}
          y2={padding.top + chartHeight}
          stroke={backgroundColor === 'transparent' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}
          strokeWidth="1"
        />

        {/* Bars */}
        {data.map((value, index) => {
          const barHeight = (value / maxValue) * chartHeight;
          const x = padding.left + index * (chartWidth / data.length) + 2;
          const y = padding.top + chartHeight - barHeight;

          return (
            <Rect
              key={`bar-${index}`}
              x={x}
              y={y}
              width={barWidth}
              height={barHeight}
              fill={color}
              rx="2"
            />
          );
        })}

        {/* Month labels */}
        {data.map((_, index) => {
          const x = padding.left + index * (chartWidth / data.length) + chartWidth / (data.length * 2);
          if (index % 2 === 0) {
            return (
              <SvgText
                key={`label-${index}`}
                x={x}
                y={height - 4}
                fontSize="8"
                fill={textColor}
                textAnchor="middle"
              >
                {months[index] || ''}
              </SvgText>
            );
          }
          return null;
        })}
      </Svg>
    </View>
  );
}

