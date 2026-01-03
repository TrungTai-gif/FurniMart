import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { shadows, borderRadius, colors } from '../theme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'default' | 'elevated' | 'outlined';
  padding?: number;
}

export default function Card({ 
  children, 
  style, 
  variant = 'default',
  padding = 16 
}: CardProps) {
  const cardStyle = [
    styles.card,
    variant === 'elevated' && styles.elevated,
    variant === 'outlined' && styles.outlined,
    { padding },
    style,
  ];

  return <View style={cardStyle}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
  },
  elevated: {
    ...shadows.lg,
    elevation: 4,
    borderWidth: 1,
    borderColor: colors.gray[100],
  },
  outlined: {
    borderWidth: 2,
    borderColor: colors.gray[200],
  },
});

