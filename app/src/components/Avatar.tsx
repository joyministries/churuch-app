import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { theme } from '../lib/theme';

const { palette, radius, typeScale, fonts } = theme;

interface AvatarProps {
  name?: string;
  uri?: string | null;
  size?: number;
}

export function Avatar({ name, uri, size = 40 }: AvatarProps) {
  const initials = (name ?? '?')
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
  if (uri) {
    return <Image source={{ uri }} style={[styles.img, { width: size, height: size, borderRadius: size / 2 }]} />;
  }
  return (
    <View style={[styles.fallback, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={[styles.initials, { fontSize: size * 0.34 }]}>{initials}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  img: { backgroundColor: palette.raised },
  fallback: { backgroundColor: palette.accentSoft, alignItems: 'center', justifyContent: 'center' },
  initials: { color: palette.accentInk, fontFamily: fonts.bold },
});

export default Avatar;