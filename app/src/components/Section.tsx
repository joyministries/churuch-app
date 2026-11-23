import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { theme } from '../lib/theme';

const { palette, spacing, fonts } = theme;

interface SectionProps {
  title?: string;
  children: React.ReactNode;
  style?: ViewStyle;
  action?: React.ReactNode;
  /** Optional index shown before the label, e.g. "02". */
  index?: string;
}

/**
 * Editorial section header: a small caps label, then a hairline that runs to the
 * action. The rule is what makes the page read as laid out rather than stacked.
 */
export function Section({ title, children, style, action, index }: SectionProps) {
  return (
    <View style={[styles.section, style]}>
      {(title || action) && (
        <View style={styles.head}>
          {index ? <Text style={styles.index}>{index}</Text> : null}
          {title ? (
            <Text style={styles.label} numberOfLines={1}>
              {title.toUpperCase()}
            </Text>
          ) : null}
          <View style={styles.rule} />
          {action ?? null}
        </View>
      )}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginBottom: spacing.gap },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  index: {
    fontFamily: fonts.mono,
    fontSize: 9,
    lineHeight: 14,
    color: palette.muted,
    letterSpacing: 0.6,
  },
  label: {
    fontFamily: fonts.semi,
    fontSize: 10,
    lineHeight: 14,
    letterSpacing: 1.7,
    color: palette.muted,
  },
  rule: {
    flex: 1,
    height: StyleSheet.hairlineWidth * 2,
    backgroundColor: palette.border,
    marginTop: 1,
  },
});

export default Section;
