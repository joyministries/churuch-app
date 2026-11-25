import React from 'react';
import { View, Text, StyleSheet, TextInput } from 'react-native';
import { theme } from '../lib/theme';

const { palette, spacing, radius, typeScale, fonts } = theme;

interface FieldProps {
  label?: string;
  placeholder?: string;
  value?: string;
  onChangeText?: (t: string) => void;
  multiline?: boolean;
  secure?: boolean;
  error?: string;
  style?: any;
  inputRef?: React.RefObject<React.ComponentRef<typeof TextInput>>;
}

export function Field({ label, placeholder, value, onChangeText, multiline, secure, error, style, inputRef }: FieldProps) {
  return (
    <View style={[styles.wrap, style]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        style={[styles.input, multiline && styles.multiline, error && styles.inputError]}
        ref={inputRef}
        placeholder={placeholder}
        placeholderTextColor={palette.muted}
        value={value}
        onChangeText={onChangeText}
        multiline={multiline}
        secureTextEntry={secure}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.md },
  label: { fontSize: typeScale.md, fontFamily: fonts.semi, color: palette.muted, marginBottom: 4 },
  input: {
    backgroundColor: palette.surface,
    borderRadius: radius.control,
    paddingHorizontal: spacing.md,
    height: spacing.controlHeight,
    fontSize: typeScale.fsBody,
    fontFamily: fonts.regular,
    color: palette.ink,
    borderWidth: 1,
    borderColor: palette.control,
  },
  multiline: { minHeight: 96, paddingVertical: spacing.md, textAlignVertical: 'top' },
  inputError: { borderColor: palette.negative },
  error: { color: palette.negative, fontSize: typeScale.fsSmall, marginTop: 2 },
});

export default Field;