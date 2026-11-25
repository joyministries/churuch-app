import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../components';
import { BrandLockup } from '../components/BrandMark';
import { SocialRow } from '../components/SocialRow';
import { theme } from '../lib/theme';
import { brand, ministries, ministriesIntro, ministryMailto } from '../lib/brand';

const { palette, spacing, radius, typeScale, fonts, shadow } = theme;

export default function MinistriesScreen({ navigation }: any) {
  return (
    <Screen scroll={false} style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <BrandLockup size={40} />
          <Text style={styles.eyebrow}>ENGAGE &amp; CONNECT</Text>
          <Text style={styles.title}>Our Ministries</Text>
          <Text style={styles.intro}>{ministriesIntro}</Text>
        </View>

        {ministries.map((m, i) => (
          <Pressable
            key={m.id}
            onPress={() => navigation.navigate('MinistryDetail', { id: m.id })}
            accessibilityRole="button"
            accessibilityLabel={`Open ${m.name}`}
            style={({ pressed }) => [styles.card, pressed && styles.pressed]}
          >
            {/* The ministry colour is a marker, not a wash — one rule, then ink. */}
            <View style={[styles.cardRule, { backgroundColor: m.color }]} />

            <View style={styles.cardHead}>
              <Text style={styles.cardIndex}>{String(i + 1).padStart(2, '0')}</Text>
              <Text style={styles.cardEyebrow}>{m.eyebrow.toUpperCase()}</Text>
            </View>

            <Text style={styles.cardName}>{m.name}</Text>

            <Text style={styles.blurb} numberOfLines={3}>
              {m.blurb}
            </Text>

            <View style={styles.foot}>
              <View style={styles.footLeft}>
                <Ionicons name="calendar-clear-outline" size={13} color={palette.muted} />
                <Text style={styles.gathering}>{m.gathering}</Text>
              </View>
              <View style={styles.footCta}>
                <Text style={styles.footCtaLabel}>{m.cta}</Text>
                <Ionicons name="arrow-forward" size={14} color={palette.navy} />
              </View>
            </View>
          </Pressable>
        ))}

        <View style={styles.footer}>
          <BrandLockup size={32} />

          <Pressable
            onPress={() => Linking.openURL(ministryMailto('General enquiry')).catch(() => {})}
            accessibilityRole="link"
            accessibilityLabel={`Email ${brand.email}`}
            hitSlop={6}
          >
            <Text style={styles.footerEmail}>{brand.email}</Text>
          </Pressable>

          <Pressable
            onPress={() => Linking.openURL(`tel:${brand.phone.replace(/\s/g, '')}`).catch(() => {})}
            accessibilityRole="link"
            accessibilityLabel={`Call ${brand.phone}`}
            hitSlop={6}
          >
            <Text style={styles.footerPhone}>{brand.phone}</Text>
          </Pressable>

          <Text style={styles.footerAddress}>
            {brand.location} · {brand.serviceTime}
          </Text>

          <View style={styles.social}>
            <SocialRow />
          </View>

          <Text style={styles.copyright}>{brand.copyright}</Text>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingHorizontal: 0, paddingBottom: 0 },
  content: { paddingHorizontal: spacing.xl, paddingBottom: 120 },

  hero: { marginBottom: spacing.xxl },
  eyebrow: {
    fontSize: typeScale.xs,
    fontFamily: fonts.semi,
    color: palette.muted,
    letterSpacing: 1.4,
    marginTop: spacing.xxl,
  },
  title: {
    fontSize: 42,
    fontFamily: fonts.heading,
    color: palette.ink,
    letterSpacing: -0.6,
    lineHeight: 46,
    marginTop: spacing.sm,
  },
  intro: {
    fontSize: typeScale.md,
    fontFamily: fonts.regular,
    color: palette.muted,
    lineHeight: 22,
    marginTop: spacing.md,
  },

  card: {
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: palette.line,
    backgroundColor: palette.paper,
    padding: spacing.lg,
    marginBottom: spacing.md,
    overflow: 'hidden',
    ...shadow.sm,
  },
  pressed: { opacity: 0.7 },
  cardRule: { width: 26, height: 2, borderRadius: 1, marginBottom: spacing.md },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  cardIndex: {
    fontSize: 10,
    fontFamily: fonts.semi,
    color: palette.muted,
    letterSpacing: 1.2,
    includeFontPadding: false,
  },
  cardEyebrow: {
    fontSize: 9.5,
    fontFamily: fonts.semi,
    color: palette.muted,
    letterSpacing: 1.3,
    includeFontPadding: false,
  },
  cardName: {
    fontSize: 24,
    fontFamily: fonts.heading,
    color: palette.ink,
    letterSpacing: -0.2,
    lineHeight: 28,
    marginTop: 4,
  },

  blurb: {
    fontSize: typeScale.base,
    fontFamily: fonts.regular,
    color: palette.muted,
    lineHeight: 20,
    marginTop: spacing.sm,
  },

  foot: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginTop: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: palette.line,
  },
  footLeft: { flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 1 },
  gathering: { fontSize: typeScale.sm, fontFamily: fonts.medium, color: palette.muted, flexShrink: 1 },
  footCta: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  footCtaLabel: { fontSize: typeScale.sm, fontFamily: fonts.semi, color: palette.navy },

  footer: { paddingTop: spacing.xl, gap: spacing.sm },
  footerEmail: { fontSize: typeScale.md, fontFamily: fonts.bold, color: palette.navy, marginTop: spacing.lg },
  footerPhone: { fontSize: typeScale.md, fontFamily: fonts.medium, color: palette.ink },
  footerAddress: { fontSize: typeScale.sm, fontFamily: fonts.regular, color: palette.muted },
  social: { marginTop: spacing.lg },
  copyright: {
    fontSize: typeScale.xs,
    fontFamily: fonts.regular,
    color: palette.muted,
    marginTop: spacing.xl,
    letterSpacing: 0.2,
  },
});
