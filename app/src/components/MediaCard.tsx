import React from 'react';
import { View, Text, StyleSheet, Image, Pressable } from 'react-native';
import { theme } from '../lib/theme';

const { palette, spacing, radius, typeScale, shadow, fonts } = theme;

interface MediaItem {
  id: number;
  title: string;
  body?: string | null;
  media_url?: string | null;
  type: string;
}

interface MediaCardProps {
  item: MediaItem;
  onPress: () => void;
}

export function MediaCard({ item, onPress }: MediaCardProps) {
  const isVideo = (item.media_url ?? '').match(/\.(mp4|mov|webm)$/i);
  return (
    <View style={styles.card}>
      <Pressable onPress={onPress} style={styles.pressable}>
        <Image source={{ uri: item.media_url || undefined }} style={styles.thumb} resizeMode="cover" />
        <View style={styles.body}>
          <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
          {item.body ? <Text style={styles.sub} numberOfLines={2}>{item.body}</Text> : null}
          <Text style={styles.badge}>{isVideo ? 'Video' : 'Audio'}</Text>
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: palette.paper, borderRadius: radius.md, overflow: 'hidden', ...shadow.sm, marginBottom: spacing.md },
  pressable: { borderRadius: radius.md, overflow: 'hidden' },
  thumb: { width: '100%', height: 160, backgroundColor: palette.badgeBg },
  body: { padding: spacing.md },
  title: { fontSize: typeScale.md, fontFamily: fonts.bold, color: palette.ink, marginBottom: 4 },
  sub: { fontSize: typeScale.sm, color: palette.muted, marginBottom: 8 },
  badge: { fontSize: typeScale.xs, color: palette.brandBlue, fontFamily: fonts.bold, textTransform: 'uppercase', letterSpacing: 0.5 },
});

export default MediaCard;