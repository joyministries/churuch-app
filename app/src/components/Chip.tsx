import React from 'react';
import { Text, StyleSheet, Pressable } from 'react-native';
import { theme } from '../lib/theme';

const { palette, spacing, fonts } = theme;

interface ChipProps {
  label: string;
  active?: boolean;
  onPress?: () => void;
}

/**
 * Filter chip. Squared, caps, no pill radius — a pill with a border is the
 * fastest way to look like a component library demo.
 */
export function Chip({ label, active, onPress }: ChipProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: !!active }}
      style={({ pressed }) => [styles.chip, active && styles.chipActive, pressed && styles.pressed]}
    >
      <Text style={[styles.label, active && styles.labelActive]} numberOfLines={1}>
        {label.toUpperCase()}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    minHeight: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    borderRadius: 3,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: palette.border,
  },
  chipActive: { backgroundColor: palette.ink, borderColor: palette.ink },
  pressed: { opacity: 0.7 },
  label: {
    fontSize: 10,
    fontFamily: fonts.semi,
    color: palette.ink,
    lineHeight: 14,
    letterSpacing: 1.2,
    textAlign: 'center',
    includeFontPadding: false,
  },
  labelActive: { color: palette.onDark },
});

export default Chip;
