import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';

interface HeartIconProps {
  isActive?: boolean;
  size?: number;
}

export default function HeartIcon({ isActive = false, size = 20 }: HeartIconProps) {
  const scaleValue = useRef(new Animated.Value(1)).current;
  const opacityValue = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isActive) {
      // Анимация при активации сердца
      Animated.sequence([
        Animated.timing(scaleValue, {
          toValue: 1.3,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(scaleValue, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Анимация при деактивации
      Animated.timing(opacityValue, {
        toValue: 0.7,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        Animated.timing(opacityValue, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }).start();
      });
    }
  }, [isActive]);

  return (
    <Animated.View 
      style={[
        styles.container, 
        { 
          width: size, 
          height: size,
          transform: [{ scale: scaleValue }],
          opacity: opacityValue,
        }
      ]}
    >
      <View style={[
        styles.heart,
        { width: size, height: size }
      ]}>
        {/* Основной квадрат сердца */}
        <View style={[
          styles.heartSquare,
          { backgroundColor: isActive ? '#FF6B35' : '#CCCCCC' }
        ]} />
        {/* Левая лопасть */}
        <View style={[
          styles.heartLobe,
          styles.leftLobe,
          { backgroundColor: isActive ? '#FF6B35' : '#CCCCCC' }
        ]} />
        {/* Правая лопасть */}
        <View style={[
          styles.heartLobe,
          styles.rightLobe,
          { backgroundColor: isActive ? '#FF6B35' : '#CCCCCC' }
        ]} />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  heart: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heartSquare: {
    position: 'absolute',
    width: 12,
    height: 12,
    left: 10,
    top: 10,
    transform: [{ rotate: '45deg' }],
  },
  heartLobe: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  leftLobe: {
    left: 4,
    top: 4,
  },
  rightLobe: {
    right: 4,
    top: 4,
  },
}); 