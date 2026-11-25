import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../components';
import { theme } from '../lib/theme';
import { brand, ministries, ministryById, ministryMailto } from '../lib/brand';
import { roomById, lastMessage, formatWhen } from '../lib/chat';
import { useChatStore } from '../store';

const { palette, spacing, radius, typeScale, fonts } = theme;

export default function MinistryDetailScreen({ route, navigation }: any) {
  const ministry = ministryById(route?.params?.id) ?? ministries[0];
  const others = ministries.filter((m) => m.id !== ministry.id);
  const roomId = `ministry-${ministry.id}`;
  const room = roomById(roomId);
  const joined = useChatStore((st) => !!st.joined[roomId]);
  const thread = useChatStore((st) => st.messages[roomId] ?? []);
  const latest = lastMessage(thread);

  const primary = () => {
    if (ministry.action.type === 'tab') {
      navigation.navigate(ministry.action.tab);
      return;
    }
    Linking.openURL(ministryMailto(ministry.action.subject)).catch(() => {});
  };

  return (
    <Screen scroll={false} style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Group hero — paper, one coloured rule, serif name. */}
        <View style={styles.hero}>
          <View style={[styles.heroRule, { backgroundColor: ministry.color }]} />
          <Text style={styles.eyebrow}>{ministry.eyebrow.toUpperCase()}</Text>
          <Text style={styles.name}>{ministry.name}</Text>
          <Text style={styles.blurb}>{ministry.blurb}</Text>
        </View>

        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Ionicons name="calendar-clear-outline" size={16} color={palette.muted} />
            <View style={styles.infoText}>
              <Text style={styles.infoLabel}>WHEN WE MEET</Text>
              <Text style={styles.infoValue}>{ministry.gathering}</Text>
            </View>
          </View>
          <View style={styles.infoDivider} />
          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={16} color={palette.muted} />
            <View style={styles.infoText}>
              <Text style={styles.infoLabel}>WHERE</Text>
              <Text style={styles.infoValue}>
                {brand.location} · {brand.serviceTime}
              </Text>
            </View>
          </View>
        </View>

        <Text style={styles.sectionLabel}>WEEK TO WEEK</Text>
        <Text style={styles.body}>{ministry.rhythm}</Text>

        <View style={styles.ctaBlock}>
          <Pressable
            onPress={primary}
            accessibilityRole="button"
            accessibilityLabel={`${ministry.cta} — ${ministry.name}`}
            style={({ pressed }) => [styles.primaryCta, pressed && styles.pressed]}
          >
            <Text style={styles.primaryLabel}>{ministry.cta}</Text>
            <Ionicons name="arrow-forward" size={16} color={palette.white} />
          </Pressable>

          <Pressable
            onPress={() => Linking.openURL(ministryMailto('General enquiry')).catch(() => {})}
            accessibilityRole="link"
            accessibilityLabel={`Email ${brand.email}`}
            style={({ pressed }) => [styles.secondaryCta, pressed && styles.pressed]}
          >
            <Ionicons name="mail-outline" size={16} color={palette.ink} />
            <Text style={styles.secondaryLabel}>{brand.email}</Text>
          </Pressable>
        </View>

        {room ? (
          <Pressable
            onPress={() =>
              navigation.navigate('Home', { screen: 'ChatRoom', params: { roomId: room.id } })
            }
            accessibilityRole="button"
            accessibilityLabel={
              joined ? `Open the ${room.name} group chat` : `Preview the ${room.name} group chat`
            }
            style={({ pressed }) => [styles.chatCard, pressed && styles.pressed]}
          >
            <View style={styles.chatIcon}>
              <Ionicons name="chatbubbles-outline" size={18} color={palette.navy} />
            </View>
            <View style={styles.chatText}>
              <Text style={styles.chatKicker}>
                {joined ? 'YOUR GROUP CHAT' : 'GROUP CHAT · PREVIEW'}
              </Text>
              <Text style={styles.chatTitle} numberOfLines={1}>
                {latest ? latest.body : 'Open the room and say hello'}
              </Text>
              <Text style={styles.chatMeta}>
                {latest
                  ? `${latest.author.split(' ')[0]} · ${formatWhen(latest.at)}`
                  : `${room.memberCount} members`}
                {joined ? '' : ' · join to post'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={palette.muted} />
          </Pressable>
        ) : null}

        <Text style={styles.sectionLabel}>EXPLORE OTHER GROUPS</Text>
        <View style={styles.others}>
          {others.map((o) => (
            <Pressable
              key={o.id}
              onPress={() => navigation.push('MinistryDetail', { id: o.id })}
              accessibilityRole="button"
              accessibilityLabel={`Open ${o.name}`}
              style={({ pressed }) => [styles.otherRow, pressed && styles.pressed]}
            >
              <View style={[styles.dot, { backgroundColor: o.color }]} />
              <View style={styles.otherText}>
                <Text style={styles.otherName}>{o.name}</Text>
                <Text style={styles.otherMeta}>{o.eyebrow}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={palette.muted} />
            </Pressable>
          ))}
        </View>

        <Text style={styles.copyright}>{brand.copyright}</Text>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingHorizontal: 0, paddingBottom: 0 },
  content: { paddingHorizontal: spacing.xl, paddingBottom: 80 },

  hero: {
    borderRadius: radius.card,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: palette.line,
    backgroundColor: palette.paper,
  },
  heroRule: { width: 26, height: 2, borderRadius: 1, marginBottom: spacing.lg },
  eyebrow: {
    fontSize: 9.5,
    fontFamily: fonts.semi,
    color: palette.muted,
    letterSpacing: 1.3,
    includeFontPadding: false,
  },
  name: {
    fontSize: 38,
    fontFamily: fonts.heading,
    color: palette.ink,
    letterSpacing: -0.4,
    lineHeight: 42,
    marginTop: 4,
  },
  blurb: {
    fontSize: typeScale.md,
    fontFamily: fonts.regular,
    color: palette.muted,
    lineHeight: 22,
    marginTop: spacing.md,
  },

  infoCard: {
    backgroundColor: palette.paper,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: palette.line,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
    marginTop: spacing.lg,
  },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md, paddingVertical: spacing.md },
  infoDivider: { height: 1, backgroundColor: palette.line },
  infoText: { flex: 1 },
  infoLabel: { fontSize: 9, fontFamily: fonts.bold, color: palette.muted, letterSpacing: 1.1 },
  infoValue: { fontSize: typeScale.md, fontFamily: fonts.semi, color: palette.ink, marginTop: 3 },

  sectionLabel: {
    fontSize: 10,
    fontFamily: fonts.bold,
    color: palette.muted,
    letterSpacing: 1.4,
    marginTop: spacing.xxl,
    marginBottom: spacing.sm,
  },
  body: { fontSize: typeScale.md, fontFamily: fonts.regular, color: palette.ink, lineHeight: 23 },

  chatCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: palette.paper,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: palette.line,
    padding: spacing.lg,
    marginTop: spacing.lg,
  },
  chatIcon: {
    width: 38,
    height: 38,
    borderRadius: radius.sm,
    backgroundColor: palette.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatText: { flex: 1 },
  chatKicker: {
    fontSize: 9,
    fontFamily: fonts.semi,
    color: palette.navy,
    letterSpacing: 1.1,
    includeFontPadding: false,
  },
  chatTitle: { fontSize: typeScale.base, fontFamily: fonts.semi, color: palette.ink, marginTop: 3 },
  chatMeta: { fontSize: typeScale.xs, fontFamily: fonts.regular, color: palette.muted, marginTop: 2 },

  ctaBlock: { marginTop: spacing.xl, gap: spacing.sm },
  primaryCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    borderRadius: radius.md,
    minHeight: 52,
    backgroundColor: palette.navy,
  },
  primaryLabel: { fontSize: typeScale.lg, fontFamily: fonts.bold, color: palette.white },
  secondaryCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    backgroundColor: palette.paper,
    borderWidth: 1,
    borderColor: palette.line,
    minHeight: 48,
  },
  secondaryLabel: { fontSize: typeScale.base, fontFamily: fonts.semi, color: palette.ink },
  pressed: { opacity: 0.7 },

  others: {
    backgroundColor: palette.paper,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: palette.line,
    paddingHorizontal: spacing.lg,
  },
  otherRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: palette.line,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  otherText: { flex: 1 },
  otherName: { fontSize: typeScale.base, fontFamily: fonts.semi, color: palette.ink },
  otherMeta: { fontSize: typeScale.xs, fontFamily: fonts.regular, color: palette.muted, marginTop: 1 },

  copyright: {
    fontSize: typeScale.xs,
    fontFamily: fonts.regular,
    color: palette.muted,
    marginTop: spacing.xxl,
    letterSpacing: 0.2,
  },
});
