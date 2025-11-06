import React from 'react';
import { View } from 'react-native';
import Svg, { Polyline, Circle, Line, Text as SvgText } from 'react-native-svg';

interface ROITrendChartProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  backgroundColor?: string;
  textColor?: string;
}

export function ROITrendChart({
  data,
  width = 280,
  height = 96,
  color = '#16A34A',
  backgroundColor = 'transparent',
  textColor = '#9CA3AF',
}: ROITrendChartProps) {
  const padding = { top: 8, right: 8, bottom: 20, left: 8 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const maxValue = Math.max(...data, 0) * 1.1 || 25;
  const minValue = Math.min(...data, 0) * 0.9 || 0;

  const points = data.map((value, index) => {
    const x = padding.left + (index / (data.length - 1 || 1)) * chartWidth;
    const y =
      padding.top +
      chartHeight -
      ((value - minValue) / (maxValue - minValue || 1)) * chartHeight;
    return `${x},${y}`;
  }).join(' ');

  const gridLines = 4;
  const months = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];

  return (
    <View style={{ width, height, backgroundColor }}>
      <Svg width={width} height={height}>
        {/* Grid lines */}
        {Array.from({ length: gridLines }).map((_, i) => {
          const y = padding.top + (i / (gridLines - 1)) * chartHeight;
          return (
            <Line
              key={`grid-${i}`}
              x1={padding.left}
              y1={y}
              x2={width - padding.right}
              y2={y}
              stroke={backgroundColor === 'transparent' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'}
              strokeWidth="1"
              strokeDasharray="2,2"
            />
          );
        })}

        {/* Chart line */}
        <Polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Data points */}
        {data.map((value, index) => {
          const x = padding.left + (index / (data.length - 1 || 1)) * chartWidth;
          const y =
            padding.top +
            chartHeight -
            ((value - minValue) / (maxValue - minValue || 1)) * chartHeight;
          return (
            <Circle
              key={`point-${index}`}
              cx={x}
              cy={y}
              r="3"
              fill={color}
            />
          );
        })}

        {/* Month labels */}
        {data.map((_, index) => {
          const x = padding.left + (index / (data.length - 1 || 1)) * chartWidth;
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

