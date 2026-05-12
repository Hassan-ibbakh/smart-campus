import React, { useEffect, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Circle, Line, Text as SvgText, Defs, Pattern, Path, Rect } from 'react-native-svg';
import Animated, { useSharedValue, useAnimatedProps, withRepeat, withTiming, Easing, withSpring } from 'react-native-reanimated';
import { NavigationStep } from '../services/api';

import graphData from '../data/campus_graph.json';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface CampusMapProps {
  steps: NavigationStep[];
  currentStepIndex: number;
}

export default function CampusMap({ steps, currentStepIndex }: CampusMapProps) {
  const markerX = useSharedValue(50);
  const markerY = useSharedValue(300);
  const markerScale = useSharedValue(1);

  const currentStep = steps[currentStepIndex];
  
  const nodesMap = useMemo(() => {
    const map: Record<string, {x: number, y: number}> = {};
    graphData.nodes.forEach((n: any) => {
      map[n.id] = { x: n.x, y: n.y };
    });
    return map;
  }, []);
  
  useEffect(() => {
    if (currentStep) {
      markerX.value = withSpring(currentStep.x, { damping: 12, stiffness: 90 });
      markerY.value = withSpring(currentStep.y, { damping: 12, stiffness: 90 });
    }
  }, [currentStepIndex, currentStep]);

  useEffect(() => {
    markerScale.value = withRepeat(
      withTiming(1.6, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);

  const animatedProps = useAnimatedProps(() => {
    return {
      cx: markerX.value,
      cy: markerY.value,
      r: 8 * markerScale.value,
    };
  });

  return (
    <View style={styles.container}>
      <Svg height="100%" width="100%" viewBox="0 0 500 800">
        <Defs>
          <Pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <Path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1"/>
          </Pattern>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#grid)" />

        {graphData.edges.map((edge: any, idx: number) => {
          const fromNode = nodesMap[edge.from];
          const toNode = nodesMap[edge.to];
          if (!fromNode || !toNode) return null;
          return (
            <Line 
              key={`bg-edge-${idx}`} 
              x1={fromNode.x} y1={fromNode.y} 
              x2={toNode.x} y2={toNode.y} 
              stroke="#2C3E50" strokeWidth="12" strokeLinecap="round"
            />
          );
        })}
        
        {steps.map((step, idx) => {
          if (idx === 0) return null;
          const prev = steps[idx - 1];
          return (
            <Line 
              key={`path-${idx}`} 
              x1={prev.x} y1={prev.y} x2={step.x} y2={step.y} 
              stroke="#00E676" strokeWidth="4" strokeDasharray="8, 4"
            />
          );
        })}

        {steps.map((step, idx) => {
          const isDestination = idx === steps.length - 1;
          const nodeData = nodesMap[step.id] || step;
          
          return (
            <React.Fragment key={`node-group-${idx}`}>
              <Circle 
                cx={nodeData.x} cy={nodeData.y} 
                r={isDestination ? "10" : "5"} 
                fill={isDestination ? "#FF4757" : "#00E676"} 
              />
              <SvgText
                x={nodeData.x}
                y={nodeData.y - 15 - (step.floor * 15)}
                fontSize="14"
                fill="#FFFFFF"
                textAnchor="middle"
                fontWeight={isDestination ? "bold" : "500"}
              >
                {step.label || step.id}
              </SvgText>
            </React.Fragment>
          );
        })}

        {currentStep && (
          <AnimatedCircle 
            animatedProps={animatedProps} 
            fill="#00E676" 
            opacity={0.6} 
          />
        )}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1A2530', borderRadius: 16, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 5 }
});
