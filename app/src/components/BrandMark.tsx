import React from 'react';
import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import { theme } from '../lib/theme';
import { brand } from '../lib/brand';

const { palette, spacing, fonts } = theme;

type Variant = 'navy' | 'paper';

// The church's own mark, taken from joyministries.co.za/logo.jpg.
const LOGO = require('../../assets/joy-logo.jpg');

interface BrandMarkProps {
  size?: number;
  variant?: Variant;
}

/**
 * Joy Ministries mark — the church's real logo, printed square. A rounded tile
 * would make it read as an app icon rather than a logo block.
 */
export function BrandMark({ size = 40, variant = 'navy' }: BrandMarkProps) {
  return (
    <View
      style={[
        styles.mark,
        {
          width: size,
          height: size,
          borderWidth: variant === 'paper' ? 1 : 0,
          borderColor: palette.line,
        },
      ]}
    >
      <Image
        source={LOGO}
        style={{ width: '100%', height: '100%' }}
        resizeMode="cover"
        accessibilityIgnoresInvertColors
      />
    </View>
  );
}

interface BrandLockupProps {
  size?: number;
  variant?: Variant;
  onPress?: () => void;
}

/** Mark + stacked wordmark, used in screen headers. */
export function BrandLockup({ size = 38, variant = 'navy', onPress }: BrandLockupProps) {
  const solid = variant === 'navy';
  const body = (
    <View style={styles.lockup}>
      <BrandMark size={size} variant={variant} />
      <View style={styles.wordmark}>
        <Text
          allowFontScaling={false}
          numberOfLines={1}
          style={[styles.wordName, { color: solid ? palette.ink : palette.white }]}
        >
          {brand.name.toUpperCase()}
        </Text>
        <Text
          allowFontScaling={false}
          numberOfLines={1}
          style={[styles.wordSub, { color: solid ? palette.muted : palette.onDarkMuted }]}
        >
          {brand.tagline.toUpperCase()}
        </Text>
      </View>
    </View>
  );

  if (!onPress) return body;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${brand.fullName} — open ministries`}
      hitSlop={6}
      style={({ pressed }) => pressed && styles.pressed}
    >
      {body}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  mark: { overflow: 'hidden', backgroundColor: palette.brandBlue },
  lockup: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  wordmark: { justifyContent: 'center' },
  wordName: { fontFamily: fonts.extra, fontSize: 13, letterSpacing: 0.6 },
  wordSub: { fontFamily: fonts.semi, fontSize: 8.5, letterSpacing: 1.5, marginTop: 2 },
  pressed: { opacity: 0.6 },
});

export default BrandMark;
