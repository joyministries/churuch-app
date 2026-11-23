import React from 'react';
import { Text, StyleSheet, Pressable, ViewStyle } from 'react-native';
import { theme } from '../lib/theme';

const { palette, fonts } = theme;

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  size?: Size;
  disabled?: boolean;
  style?: ViewStyle;
  icon?: React.ReactNode;
}

/**
 * Squared control, caps label, one filled action colour. Petrol carries the
 * action; bright blue is reserved for small marks so it keeps meaning.
 */
export function Button({ label, onPress, variant = 'primary', size = 'md', disabled, style, icon }: ButtonProps) {
  const v = variants[variant];
  const s = sizes[size];
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={[
        styles.base,
        { paddingVertical: s.py, paddingHorizontal: s.px, borderRadius: 3, minHeight: s.h },
        v.container,
        disabled && styles.disabled,
        style,
      ]}
    >
      <Text style={[styles.label, v.label, { fontSize: s.fs }, disabled && v.labelDisabled]}>
        {icon ? `${icon} ` : ''}
        {label}
      </Text>
    </Pressable>
  );
}

const variants = {
  primary: {
    container: { backgroundColor: palette.deep },
    label: { color: palette.white, fontFamily: fonts.bold },
    labelDisabled: { color: 'rgba(255,255,255,0.7)' },
  },
  secondary: {
    container: { backgroundColor: 'transparent', borderWidth: 1, borderColor: palette.ink },
    label: { color: palette.ink, fontFamily: fonts.bold },
    labelDisabled: { color: palette.muted },
  },
  ghost: {
    container: { backgroundColor: 'transparent', borderWidth: 1, borderColor: palette.border },
    label: { color: palette.ink, fontFamily: fonts.semi },
    labelDisabled: { color: palette.muted },
  },
  danger: {
    container: { backgroundColor: palette.negative },
    label: { color: palette.white, fontFamily: fonts.bold },
    labelDisabled: { color: 'rgba(255,255,255,0.6)' },
  },
};

const sizes = {
  sm: { py: 7, px: 13, h: 32, fs: 10 },
  md: { py: 10, px: 18, h: 40, fs: 11 },
  lg: { py: 13, px: 22, h: 48, fs: 12 },
};

const styles = StyleSheet.create({
  base: { alignItems: 'center', justifyContent: 'center', flexDirection: 'row' },
  label: {
    lineHeight: 15,
    letterSpacing: 1.3,
    textTransform: 'uppercase',
    textAlign: 'center',
    includeFontPadding: false,
  },
  disabled: { opacity: 0.45 },
});

export default Button;
