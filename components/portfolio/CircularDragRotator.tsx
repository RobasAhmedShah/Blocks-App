import React, { useMemo, useRef, useState } from "react";
import { View, StyleSheet, LayoutChangeEvent, PanResponder, TouchableOpacity } from "react-native";
import Svg, { Path, Text as SvgText } from "react-native-svg";
import { useColorScheme } from '@/lib/useColorScheme';
import { router } from "expo-router";

type Investment = {
  id: string;
  currentValue: number;
  property?: {
    id: string;
    title: string;
    displayCode?: string;
  };
};

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
  let normalizedStart = normalizeAngle(startAngle);
  let normalizedEnd = normalizeAngle(endAngle);
  
  let angularSpan = normalizedEnd - normalizedStart;
  if (angularSpan < 0) {
    angularSpan += 2 * Math.PI;
  }
  
  if (angularSpan < 0.001) {
    angularSpan = 0.001;
    normalizedEnd = normalizeAngle(normalizedStart + angularSpan);
  }
  
  const start = polarToCartesian(cx, cy, r, normalizedStart);
  const end = polarToCartesian(cx, cy, r, normalizedEnd);
  
  const largeArcFlag = angularSpan <= Math.PI ? "0" : "1";

  return `M ${start.x} ${start.y}
          A ${r} ${r} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`;
};

const normalizeAngle = (angle: number) => {
  const normalized = angle % (2 * Math.PI);
  return normalized < 0 ? normalized + 2 * Math.PI : normalized;
};

export function CircularDragRotator({
  size = 300,
  ringWidth = 50,
  knobSize = 40,
  inset = 20,
  totalInvested,
  totalValue,
  investments,
}: CircularDragRotatorProps) {
  const containerRef = useRef<View>(null);
  const [layout, setLayout] = useState<{
    x: number;
    y: number;
    w: number;
    h: number;
  } | null>(null);

  const { colors } = useColorScheme();
  const offsetAngleRef = useRef(0);
  const lastAngleRef = useRef(0);
  const velocityRef = useRef(0);
  const lastTimeRef = useRef(Date.now());
  const animationFrameRef = useRef<number | null>(null);
  
  const touchStartRef = useRef<{ x: number; y: number; time: number; angle?: number } | null>(null);
  const hasDraggedRef = useRef(false);

  const [, forceUpdate] = useState(0);

  const radius = size / 2 - inset - ringWidth / 2;
  
  // FIXED: Proper knob calculation
  const actualKnobs = useMemo(() => {
    const FULL = Math.PI * 2;
    const GAP = 0.4;
    const MIN_ARC = 0.1;
  
    const n = investments.length;
    if (n === 0) return [];
  
    const totalGapSpace = n * GAP;
    const arcBudget = FULL - totalGapSpace;
  
    const values = investments.map(i => Math.max(i.currentValue || 0, 0));
    const totalValueSafe = Math.max(
      values.reduce((a, b) => a + b, 0),
      1
    );
  
    // Step 1: initial proportional arcs
    let arcs = values.map(v => (v / totalValueSafe) * arcBudget);
  
    // Step 2: enforce minimums
    let deficit = 0;
    arcs = arcs.map(a => {
      if (a < MIN_ARC) {
        deficit += (MIN_ARC - a);
        return MIN_ARC;
      }
      return a;
    });
  
    // Step 3: redistribute deficit from larger arcs
    if (deficit > 0) {
      const adjustable = arcs
        .map((a, i) => ({ a, i }))
        .filter(x => x.a > MIN_ARC);
  
      const adjustableSum =
        adjustable.reduce((s, x) => s + (x.a - MIN_ARC), 0);
  
      if (adjustableSum > 0) {
        adjustable.forEach(({ a, i }) => {
          const reducible = a - MIN_ARC;
          const reduction = (reducible / adjustableSum) * deficit;
          arcs[i] = a - reduction;
        });
      }
    }
  
    // Step 4: layout
    let angle = 0;
    return investments.map((inv, i) => {
      const start = angle;
      const end = angle + arcs[i];
      const center = (start + end) / 2;
  
      angle = end + GAP;
  
      const name = inv.property?.title || "Property";
      const spaceIndex = name.indexOf(" ");

      return {
        id: inv.id,
        propertyId: inv.property?.id || inv.id,
        color: colors.card,
        firstLetter: spaceIndex > 0 && spaceIndex < name.length - 1
          ? name.charAt(0).toUpperCase() + name.charAt(spaceIndex + 1).toUpperCase()
          : name.charAt(0).toUpperCase(),
        investment: inv,
        arcAngle: arcs[i],
        startAngle: start,
        endAngle: end,
        centerAngle: center,
        percent:(arcs[i]/FULL)*100
      };
    });
  }, [investments, totalValue, colors.card]);
  

  const applyMomentum = () => {
    if (Math.abs(velocityRef.current) > 0.001) {
      offsetAngleRef.current += velocityRef.current;
      velocityRef.current *= 0.95;
      forceUpdate(v => v + 1);
      animationFrameRef.current = requestAnimationFrame(applyMomentum);
    }
  };

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (e) => {
          if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
          }
          velocityRef.current = 0;

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
          const initialAngle = Math.atan2(pageY - cy, pageX - cx);
          lastAngleRef.current = initialAngle;
          lastTimeRef.current = Date.now();
          
          // Store initial angle for tap detection
          if (touchStartRef.current) {
            touchStartRef.current.angle = normalizeAngle(initialAngle - offsetAngleRef.current);
          }
        },
        onPanResponderMove: (e) => {
          if (!layout) return;
          const { pageX, pageY } = e.nativeEvent;
          
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
          
          if (deltaAngle > Math.PI) deltaAngle -= 2 * Math.PI;
          if (deltaAngle < -Math.PI) deltaAngle += 2 * Math.PI;
          
          offsetAngleRef.current += deltaAngle;
          velocityRef.current = deltaAngle / dt * 16;
          
          lastAngleRef.current = currentAngle;
          lastTimeRef.current = now;
          forceUpdate(v => v + 1);
        },
        onPanResponderRelease: () => {
          if (!hasDraggedRef.current && touchStartRef.current) {
            const timeDiff = Date.now() - touchStartRef.current.time;
            if (timeDiff < 300 && touchStartRef.current.angle !== undefined) {
              // Handle tap - find which knob was tapped
              const tappedAngle = touchStartRef.current.angle;
              const tappedKnob = actualKnobs.find(knob => {
                const start = normalizeAngle(knob.startAngle);
                const end = normalizeAngle(knob.endAngle);
                // Handle wrap-around case
                if (end < start) {
                  return tappedAngle >= start || tappedAngle <= end;
                }
                return tappedAngle >= start && tappedAngle <= end;
              });
              
              if (tappedKnob) {
                router.push(`/property/${tappedKnob.propertyId}`);
              }
            }
          }
          
          if (Math.abs(velocityRef.current) > 0.001) {
            animationFrameRef.current = requestAnimationFrame(applyMomentum);
          }
          
          touchStartRef.current = null;
        },
      }),
    [layout, actualKnobs]
  );

  const onLayout = (_: LayoutChangeEvent) => {
    containerRef.current?.measureInWindow((x, y, w, h) =>
      setLayout({ x, y, w, h })
    );
  };

  const fullRingPath = describeArc(size / 2, size / 2, radius, 0, Math.PI * 1.99999);

  return (
    <View 
      ref={containerRef}
      onLayout={onLayout}
      style={[styles.container, { width: size, height: size }]}
      {...panResponder.panHandlers}
    >
      <Svg width={size} height={size}>
        {/* Background ring - rendered first so it's behind knobs */}
        <Path
          d={fullRingPath}
          stroke={colors.card}
          strokeWidth={ringWidth + 8}
          fill="none"
          strokeLinecap="round"
          opacity={1}
        />

        {/* Property knobs - rendered on top with brighter colors */}
        {actualKnobs.map((knob,i) => {
          const scrolledStartAngle = normalizeAngle(knob.startAngle + offsetAngleRef.current);
          const scrolledEndAngle = normalizeAngle(knob.endAngle + offsetAngleRef.current);
          const scrolledCenterAngle = normalizeAngle(knob.centerAngle + offsetAngleRef.current);
          
          const knobArcPath = describeArc(size / 2, size / 2, radius, scrolledStartAngle, scrolledEndAngle);
          const labelPos = polarToCartesian(size / 2, size / 2, radius, scrolledCenterAngle);

          return (
            <React.Fragment key={i}>
              <Path
                d={knobArcPath}
                stroke={colors.primary}
                strokeWidth={ringWidth + 2}
                fill="none"
                strokeLinecap="round"
                opacity={1}
              />
              {/* First letter on top line */}
              <SvgText
                x={labelPos.x}
                y={labelPos.y - 2}
                fontSize={knobSize / 2.5}
                fill="rgba(255, 255, 255, 0.95)"
                textAnchor="middle"
                fontWeight="bold"
              >
                {knob.firstLetter}
              </SvgText>
              {/* Percentage on bottom line */}
              <SvgText
                x={labelPos.x}
                y={labelPos.y + knobSize / 2.5 + 2}
                fontSize={knobSize / 3}
                fill="rgba(255, 255, 255, 0.85)"
                textAnchor="middle"
                fontWeight="500"
              >
                {`${knob.percent.toFixed(1)}%`}
              </SvgText>
            </React.Fragment>
          );
        })}
        
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
        
        <SvgText
          x={size / 2}
          y={size / 2 + 20}
          fontSize={28}
          fill="#10b981"
          textAnchor="middle"
          fontWeight="300"
        >
          {`$ ${Math.round(totalValue * 100) / 100}`}
        </SvgText>
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