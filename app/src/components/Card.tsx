import React from 'react';
import { View, StyleSheet, Pressable, type StyleProp, type ViewStyle } from 'react-native';
import { theme } from '../lib/theme';

const { palette, spacing, radius } = theme;

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  padding?: number;
  selected?: boolean;
}

/**
 * Accent-ladder card: white surface on warm ground, hairline border,
 * no shadow on things at rest. Elevation by surface difference alone.
 */
export function Card({ children, style, onPress, padding = spacing.xl, selected }: CardProps) {
  const inner = (
    <View style={[styles.card, { padding }, selected ? styles.cardSelected : null, style]}>
      {children}
    </View>
  );
  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.pressable, pressed && styles.pressed]}
      >
        {inner}
      </Pressable>
    );
  }
  return inner;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: palette.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: palette.border,
  },
  cardSelected: { borderColor: palette.accent, borderWidth: 2 },
  pressable: { borderRadius: radius.card },
  pressed: { opacity: 0.85 },
});

export default Card;