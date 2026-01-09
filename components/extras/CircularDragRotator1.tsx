import React, { useMemo, useRef, useState } from "react";
import { View, StyleSheet, LayoutChangeEvent, PanResponder, Text, Pressable, TouchableOpacity } from "react-native";
import Svg, { Path, Circle, Text as SvgText } from "react-native-svg";
import { useRouter } from "expo-router";
import { Investment } from "@/types/portfolio";
import { useColorScheme } from '@/lib/useColorScheme';

type CircularDragRotatorProps = {
  size?: number;
  ringWidth?: number;
  knobSize?: number;
  inset?: number;
  totalInvested: number;
  totalValue: number;
  investments: Investment[];
};

const polarToCartesian = (
  cx: number,
  cy: number,
  r: number,
  angle: number
) => ({
  x: cx + r * Math.cos(angle),
  y: cy + r * Math.sin(angle),
});

const describeArc = (
  cx: number,
  cy: number,
  r: number,
  startAngle: number,
  endAngle: number
) => {
  const start = polarToCartesian(cx, cy, r, startAngle);
  const end = polarToCartesian(cx, cy, r, endAngle);
  const largeArcFlag = endAngle - startAngle <= Math.PI ? "0" : "1";

  return `M ${start.x} ${start.y}
          A ${r} ${r} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`;
};

const normalizeAngle = (angle: number) => {
  const normalized = angle % (2 * Math.PI);
  return normalized < 0 ? normalized + 2 * Math.PI : normalized;
};

const isAngleInVisibleArc = (angle: number, gapStart: number, gapEnd: number) => {
  const norm = normalizeAngle(angle);
  const normStart = normalizeAngle(gapStart);
  const normEnd = normalizeAngle(gapEnd);
  
  if (normStart < normEnd) {
    return norm < normStart || norm > normEnd;
  } else {
    return norm < normStart && norm > normEnd;
  }
};

// Color palette for property knobs (greenish/emerald theme)
const PROPERTY_COLORS = [
  '#10b981', // emerald-500
  '#34d399', // emerald-400
  '#6ee7b7', // emerald-300
  '#059669', // emerald-600
  '#047857', // emerald-700
  '#14b8a6', // teal-500
  '#2dd4bf', // teal-400
  '#5eead4', // teal-300
  '#0d9488', // teal-600
  '#0f766e', // teal-700
  '#22c55e', // green-500
  '#4ade80', // green-400
  '#86efac', // green-300
];

export function CircularDragRotator({
  size = 200,
  ringWidth = 50,
  knobSize = 40,
  inset = 20,
  totalInvested,
  totalValue,
  investments,
}: CircularDragRotatorProps) {
  const router = useRouter();
  const containerRef = useRef<View>(null);
  const [layout, setLayout] = useState<{
    x: number;
    y: number;
    w: number;
    h: number;
  } | null>(null);
  const { colors } = useColorScheme();

  // Offset angle for scrolling the knobs around the ring
  const offsetAngleRef = useRef(0);
  const lastAngleRef = useRef(0);
  const velocityRef = useRef(0);
  const lastTimeRef = useRef(Date.now());
  const animationFrameRef = useRef<number | null>(null);
  
  // Track touch start position for tap detection
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const hasDraggedRef = useRef(false);

  const [, force] = useState(0);

  const radius = size / 2 - inset - ringWidth / 2;
  
  // Map investments to knobs
  const actualKnobs = useMemo(() => {
    return investments.map((investment, index) => {
      const propertyName = investment.property?.title || investment.property?.displayCode || 'P';
      const firstLetter = propertyName.charAt(0).toUpperCase();
      
      return {
        id: investment.id,
        propertyId: investment.property?.id || investment.id,
        // color: PROPERTY_COLORS[index % PROPERTY_COLORS.length],
        color: PROPERTY_COLORS[9],
        firstLetter,
        investment,
      };
    });
  }, [investments]);
  
  const angleStep = actualKnobs.length > 0 ? (2 * Math.PI) / actualKnobs.length : 0;
  
  // Format number with commas
  const formatNumber = (num: number): string => {
    return Math.round(num).toLocaleString('en-US');
  };
  
  // Handle knob press - navigate to myassets
  const handleKnobPress = (propertyId: string, investmentId: string) => {
    router.push({
      pathname: '/portfolio/myassets/assets-first',
      params: { 
        id: investmentId,
        propertyId: propertyId,
      },
    } as any);
  };
  
  // 75% visible arc = 270 degrees = 1.5π radians
  // Gap is 25% = 90 degrees = 0.5π radians
  // Place gap at the bottom (270° to 360°/0°)
  const visibleArcLength = Math.PI * 1.5; // 270 degrees
  const gapSize = Math.PI * 0.5; // 90 degrees
  const gapStart = Math.PI * 1.5; // Start of gap (bottom right)
  const gapEnd = 0; // End of gap (top)

  // Check if a touch position is within a knob
  const getKnobAtPosition = (touchX: number, touchY: number) => {
    if (!layout) return null;
    
    const cx = layout.x + layout.w / 2;
    const cy = layout.y + layout.h / 2;
    const relX = touchX - cx;
    const relY = touchY - cy;
    
    for (let index = 0; index < actualKnobs.length; index++) {
      const knob = actualKnobs[index];
      const baseAngle = index * angleStep;
      const knobAngle = normalizeAngle(baseAngle + offsetAngleRef.current);
      
      // Only check knobs in visible arc
      if (!isAngleInVisibleArc(knobAngle, gapStart, gapEnd)) {
        continue;
      }
      
      const pos = polarToCartesian(size / 2, size / 2, radius, knobAngle);
      const knobX = pos.x - size / 2;
      const knobY = pos.y - size / 2;
      
      const distance = Math.sqrt(
        Math.pow(relX - knobX, 2) + Math.pow(relY - knobY, 2)
      );
      
      // Check if touch is within knob radius (with some tolerance)
      if (distance <= knobSize / 2 + 5) {
        return knob;
      }
    }
    
    return null;
  };

  const applyMomentum = () => {
    if (Math.abs(velocityRef.current) > 0.001) {
      offsetAngleRef.current += velocityRef.current;
      velocityRef.current *= 0.95; // Friction
      force((v) => v + 1);
      animationFrameRef.current = requestAnimationFrame(applyMomentum);
    }
  };

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (e) => {
          // Stop momentum
          if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
          }
          velocityRef.current = 0;

          // Track touch start for tap detection
          const { pageX, pageY } = e.nativeEvent;
          touchStartRef.current = {
            x: pageX,
            y: pageY,
            time: Date.now(),
          };
          hasDraggedRef.current = false;

          if (!layout) return;
          const cx = layout.x + layout.w / 2;
          const cy = layout.y + layout.h / 2;
          lastAngleRef.current = Math.atan2(pageY - cy, pageX - cx);
          lastTimeRef.current = Date.now();
        },
        onPanResponderMove: (e) => {
          if (!layout) return;
          const { pageX, pageY } = e.nativeEvent;
          
          // Check if user has moved enough to be considered a drag
          if (touchStartRef.current) {
            const dx = pageX - touchStartRef.current.x;
            const dy = pageY - touchStartRef.current.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > 10) {
              hasDraggedRef.current = true;
            }
          }
          
          const cx = layout.x + layout.w / 2;
          const cy = layout.y + layout.h / 2;
          const currentAngle = Math.atan2(pageY - cy, pageX - cx);
          
          const now = Date.now();
          const dt = Math.max(now - lastTimeRef.current, 1);
          
          let deltaAngle = currentAngle - lastAngleRef.current;
          
          // Handle wrap-around
          if (deltaAngle > Math.PI) deltaAngle -= 2 * Math.PI;
          if (deltaAngle < -Math.PI) deltaAngle += 2 * Math.PI;
          
          offsetAngleRef.current += deltaAngle;
          velocityRef.current = deltaAngle / dt * 16; // Normalize to 60fps
          
          lastAngleRef.current = currentAngle;
          lastTimeRef.current = now;
          force((v) => v + 1);
        },
        onPanResponderRelease: (e) => {
          const { pageX, pageY } = e.nativeEvent;
          
          // Check if this was a tap (not a drag)
          if (!hasDraggedRef.current && touchStartRef.current) {
            const timeDiff = Date.now() - touchStartRef.current.time;
            
            // If released quickly and didn't drag, treat as tap
            if (timeDiff < 300) {
              const tappedKnob = getKnobAtPosition(pageX, pageY);
              if (tappedKnob) {
                handleKnobPress(tappedKnob.propertyId, tappedKnob.id);
                return;
              }
            }
          }
          
          // Start momentum animation if dragged
          if (Math.abs(velocityRef.current) > 0.001) {
            animationFrameRef.current = requestAnimationFrame(applyMomentum);
          }
        },
      }),
    [layout, actualKnobs, angleStep, size, radius, knobSize]
  );

  const onLayout = (_: LayoutChangeEvent) => {
    containerRef.current?.measureInWindow((x, y, w, h) =>
      setLayout({ x, y, w, h })
    );
  };

  // Render only the 75% visible arc
  const arcPath = describeArc(
    size / 2, 
    size / 2, 
    radius, 
    0, // Start at top
    Math.PI * 1.5 // End at 270 degrees (75% of circle)
  );
  // Render only the 75% visible arc
  const arcPath2 = describeArc(
    size / 2, 
    size / 2, 
    radius, 
    0, // Start at top
    Math.PI * 1.99999 // End at 270 degrees (75% of circle)
  );

  return (
    <View 
    className="flex-1 items-center justify-center"
      ref={containerRef}
      onLayout={onLayout}
      style={[styles.container, { width: size, height: size }]}
      {...panResponder.panHandlers}
    >
      <Svg width={size} height={size}>
        {/* Background ring - 75% arc, drawn first (behind knobs) */}
        <Path
          d={arcPath2}
          strokeWidth={ringWidth}
          fill={colors.grey5}
        />
        <Path
          d={arcPath}
          stroke={colors.primary}
          strokeWidth={ringWidth}
          fill={colors.grey5}
          strokeLinecap="round"
        />

        {/* Render knobs - only those in visible arc */}
        {actualKnobs.map((knob, index) => {
          const baseAngle = index * angleStep;
          const knobAngle = normalizeAngle(baseAngle + offsetAngleRef.current);
          
          // Only render knobs that are in the visible 75% arc
          if (!isAngleInVisibleArc(knobAngle, gapStart, gapEnd)) {
            return null;
          }
          
          const pos = polarToCartesian(size / 2, size / 2, radius, knobAngle);

          return (
            
            <React.Fragment key={knob.id}>
                {/* Main bubble */}
                <Circle
                  cx={pos.x}
                  cy={pos.y}
                  r={knobSize / 2}
                  fill={knob.color}
                  stroke="rgba(255, 255, 255, 0.8)"
                  strokeWidth={2}
                  opacity={0.9}
                />
                {/* Inner highlight */}
                {/* <Circle
                  cx={pos.x - knobSize / 6}
                  cy={pos.y - knobSize / 6}
                  r={knobSize / 4}
                  fill="rgba(255, 255, 255, 0.4)"
                /> */}
                {/* Property name first letter */}
                <SvgText
                  x={pos.x}
                  y={pos.y + 4}
                  fontSize={knobSize / 2.5}
                  fill="rgba(255, 255, 255, 0.95)"
                  textAnchor="middle"
                  fontWeight="bold"
                >
                  {knob.firstLetter}
                </SvgText>
            </React.Fragment>
          );
        })}
        
        {/* Center text - Total Holdings */}
        <SvgText
          x={size / 2}
          y={size / 2 - 12}
          fontSize={21}
          fill="rgba(255, 255, 255, 0.6)"
          textAnchor="middle"
          fontWeight="500"
        
        >
          Total Holdings
        </SvgText>
        {(() => {
          const roundedValue = Math.round(totalValue * 100) / 100;
          return (
            <>
              {/* Integer part - larger, centered */}   
              <SvgText
                x={size / 2}
                y={size / 2 + 20}
                fontSize={28}
                fill="#10b981"
                textAnchor="middle"
                fontWeight="300"
              >
                {'$' + roundedValue}
              </SvgText>
             
            </>
          );
        })()}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    alignItems: "center",
  },
});