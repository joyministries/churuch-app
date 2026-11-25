import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { theme } from '../lib/theme';

const { palette, spacing, fonts } = theme;

interface SectionProps {
  title?: string;
  children: React.ReactNode;
  style?: ViewStyle;
  action?: React.ReactNode;
  /** Retained for call sites that still pass one; no longer drawn. */
  index?: string;
}

/**
 * A section is a heading and its content. No rule, no caps, no numbering —
 * the heading is simply bolder than the body it introduces.
 */
export function Section({ title, children, style, action }: SectionProps) {
  return (
    <View style={[styles.section, style]}>
      {(title || action) && (
        <View style={styles.head}>
          {title ? (
            <Text style={styles.label} numberOfLines={1}>
              {title}
            </Text>
          ) : null}
          <View style={styles.spacer} />
          {action ?? null}
        </View>
      )}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginBottom: spacing.xxl },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  label: {
    fontFamily: fonts.bold,
    fontSize: 16,
    letterSpacing: -0.2,
    color: palette.ink,
  },
  spacer: { flex: 1 },
});

export default Section;
