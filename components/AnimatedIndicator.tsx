import React, { useEffect, useRef } from 'react';
import { Animated, ViewStyle } from 'react-native';

interface AnimatedIndicatorProps {
  isActive: boolean;
  position: number;
  width: number;
  style?: ViewStyle;
}

const AnimatedIndicator: React.FC<AnimatedIndicatorProps> = ({ 
  isActive, 
  position, 
  width, 
  style 
}) => {
  const widthAnim = useRef(new Animated.Value(4)).current;
  const translateXAnim = useRef(new Animated.Value(position)).current;

  useEffect(() => {
    const targetWidth = isActive ? 24 : 6;
    
    Animated.parallel([
      Animated.timing(widthAnim, {
        toValue: targetWidth,
        duration: 300,
        useNativeDriver: false,
      }),
      Animated.timing(translateXAnim, {
        toValue: position,
        duration: 300,
        useNativeDriver: false,
      }),
    ]).start();
  }, [isActive, position]);

  return (
    <Animated.View
      style={[
        {
          width: widthAnim,
          height: 6,
          backgroundColor: isActive ? '#FFFFFF' : 'rgba(255, 255, 255, 0.6)',
          borderRadius: 3,
          transform: [{ translateX: translateXAnim }],
        },
        style,
      ]}
    />
  );
};

export default AnimatedIndicator; 