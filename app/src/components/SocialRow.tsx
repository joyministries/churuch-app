import React from 'react';
import { View, Text, StyleSheet, Pressable, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../lib/theme';
import { socialLinks } from '../lib/brand';

const { palette, spacing, radius, typeScale, fonts } = theme;

/**
 * The three platforms the church actually runs. Solid tiles, tinted icon,
 * no brand logos stretched out of proportion.
 */
export function SocialRow({ onPressStatus }: { onPressStatus?: (msg: string) => void }) {
  const open = async (url: string, label: string) => {
    try {
      await Linking.openURL(url);
    } catch {
      onPressStatus?.(`Could not open ${label}.`);
    }
  };

  return (
    <View style={styles.row}>
      {socialLinks.map((s) => (
        <Pressable
          key={s.id}
          onPress={() => open(s.url, s.label)}
          accessibilityRole="link"
          accessibilityLabel={`${s.label} — open the church page`}
          style={({ pressed }) => [styles.tile, pressed && styles.pressed]}
        >
          <View style={[styles.iconWrap, { backgroundColor: `${s.tint}14` }]}>
            <Ionicons name={s.icon} size={18} color={s.tint} />
          </View>
          <Text style={styles.label}>{s.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.sm },
  tile: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.lg,
    borderRadius: radius.card,
    backgroundColor: palette.paper,
    borderWidth: 1,
    borderColor: palette.line,
    gap: spacing.sm,
  },
  pressed: { opacity: 0.6 },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { fontSize: typeScale.sm, fontFamily: fonts.semi, color: palette.ink },
});

export default SocialRow;
