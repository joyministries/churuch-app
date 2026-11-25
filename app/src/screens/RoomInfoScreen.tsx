import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Card, Avatar, Button } from '../components';
import { theme } from '../lib/theme';
import { roomById } from '../lib/chat';
import { ministryById } from '../lib/brand';
import { useChatStore } from '../store';

const { palette, spacing, radius, typeScale, fonts } = theme;

const KIND_LABEL: Record<string, string> = {
  church: 'CHURCH-WIDE',
  ministry: 'MINISTRY ROOM',
  team: 'TEAM ROOM',
};

export default function RoomInfoScreen({ route, navigation }: any) {
  const roomId: string = route?.params?.roomId;
  const room = roomById(roomId);
  const joined = useChatStore((s) => (roomId ? !!s.joined[roomId] : false));
  const toggleJoin = useChatStore((s) => s.toggleJoin);
  const memberCount = useChatStore((s) =>
    roomId ? (s.messages[roomId]?.length ?? 0) : 0
  );

  if (!room) {
    return (
      <Screen style={{ flex: 1 }}>
        <Text style={styles.missing}>This room no longer exists.</Text>
      </Screen>
    );
  }

  const ministry = ministryById(room.ministryId);

  return (
    <Screen scroll={false} style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Card style={styles.hero}>
          <View style={[styles.heroMark, { backgroundColor: room.color }]} />
          <Text style={styles.kind}>{KIND_LABEL[room.kind]}</Text>
          <Text style={styles.name}>{room.name}</Text>
          <Text style={styles.description}>{room.description}</Text>

          <View style={styles.heroStats}>
            <View style={styles.heroStat}>
              <Text style={styles.heroStatValue}>{room.memberCount}</Text>
              <Text style={styles.heroStatLabel}>MEMBERS</Text>
            </View>
            <View style={styles.heroDivider} />
            <View style={styles.heroStat}>
              <Text style={styles.heroStatValue}>{memberCount}</Text>
              <Text style={styles.heroStatLabel}>MESSAGES</Text>
            </View>
            <View style={styles.heroDivider} />
            <View style={styles.heroStat}>
              <Text style={styles.heroStatValue}>{joined ? 'IN' : '—'}</Text>
              <Text style={styles.heroStatLabel}>YOU</Text>
            </View>
          </View>
        </Card>

        <View style={styles.detailCard}>
          <View style={styles.detailRow}>
            <Ionicons name="person-outline" size={16} color={palette.muted} />
            <View style={styles.detailText}>
              <Text style={styles.detailLabel}>WHO LEADS IT</Text>
              <Text style={styles.detailValue}>{room.leader}</Text>
            </View>
          </View>
          <View style={styles.detailDivider} />
          <View style={styles.detailRow}>
            <Ionicons name="calendar-clear-outline" size={16} color={palette.muted} />
            <View style={styles.detailText}>
              <Text style={styles.detailLabel}>WHEN</Text>
              <Text style={styles.detailValue}>{room.meeting}</Text>
            </View>
          </View>
          <View style={styles.detailDivider} />
          <View style={styles.detailRow}>
            <Ionicons name="shield-checkmark-outline" size={16} color={palette.muted} />
            <View style={styles.detailText}>
              <Text style={styles.detailLabel}>HOUSE RULE</Text>
              <Text style={styles.detailValue}>{room.pinned}</Text>
            </View>
          </View>
        </View>

        <View style={styles.ctaRow}>
          <Button
            label={joined ? 'Leave this room' : 'Join this room'}
            variant={joined ? 'ghost' : 'primary'}
            onPress={() => toggleJoin(room.id)}
          />
          <Pressable
            onPress={() => navigation.navigate('ChatRoom', { roomId: room.id })}
            accessibilityRole="button"
            accessibilityLabel={`Open ${room.name}`}
            style={({ pressed }) => [styles.openRow, pressed && styles.pressed]}
          >
            <Text style={styles.openLabel}>Open the conversation</Text>
            <Ionicons name="arrow-forward" size={15} color={palette.navy} />
          </Pressable>
        </View>

        <Text style={styles.sectionLabel}>MEMBERS</Text>
        <Card style={styles.members}>
          {room.members.map((name, index) => (
            <View
              key={`${name}-${index}`}
              style={[styles.memberRow, index === room.members.length - 1 && styles.memberRowLast]}
            >
              <Avatar name={name} size={32} />
              <Text style={styles.memberName}>{name}</Text>
              {index === 0 ? <Text style={styles.memberTag}>LEAD</Text> : null}
              {name === 'You' ? <Text style={styles.memberTag}>YOU</Text> : null}
            </View>
          ))}
          <Text style={styles.memberFoot}>
            +{Math.max(room.memberCount - room.members.length, 0)} more in the room
          </Text>
        </Card>

        {ministry ? (
          <Pressable
            onPress={() =>
              navigation.navigate('Ministries', {
                screen: 'MinistryDetail',
                params: { id: ministry.id },
              })
            }
            accessibilityRole="button"
            accessibilityLabel={`Open ${ministry.name} page`}
            style={({ pressed }) => [styles.ministryLink, pressed && styles.pressed]}
          >
            <View style={styles.ministryIcon}>
              <Ionicons name={ministry.icon} size={16} color={palette.navy} />
            </View>
            <View style={styles.ministryText}>
              <Text style={styles.ministryLabel}>MINISTRY PAGE</Text>
              <Text style={styles.ministryName}>{ministry.name}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={palette.muted} />
          </Pressable>
        ) : null}

        <Text style={styles.footer}>
          Conversation is sample content for this preview. Live messages connect when member
          accounts are signed in.
        </Text>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingHorizontal: 0, paddingBottom: 0 },
  content: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xxxxl },
  missing: {
    fontSize: typeScale.md,
    fontFamily: fonts.regular,
    color: palette.muted,
    textAlign: 'center',
    marginTop: spacing.xxxl,
  },

  hero: { padding: spacing.xl, marginTop: spacing.md, marginBottom: spacing.lg },
  heroMark: { width: 26, height: 2, borderRadius: 1, marginBottom: spacing.lg },
  kind: {
    fontSize: 9.5,
    fontFamily: fonts.semi,
    color: palette.muted,
    letterSpacing: 1.4,
    marginBottom: spacing.xs,
    includeFontPadding: false,
  },
  name: { fontSize: 32, fontFamily: fonts.heading, color: palette.ink, letterSpacing: -0.4, lineHeight: 36 },
  description: {
    fontSize: typeScale.md,
    fontFamily: fonts.regular,
    color: palette.muted,
    lineHeight: 22,
    marginTop: spacing.sm,
  },

  heroStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.lg,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: palette.line,
  },
  heroStat: { flex: 1, alignItems: 'center', gap: 2 },
  heroStatValue: {
    fontSize: 22,
    fontFamily: fonts.heading,
    color: palette.ink,
    letterSpacing: -0.2,
    lineHeight: 26,
  },
  heroStatLabel: {
    fontSize: 9,
    fontFamily: fonts.semi,
    color: palette.muted,
    letterSpacing: 1.1,
    includeFontPadding: false,
  },
  heroDivider: { width: 1, height: 28, backgroundColor: palette.line },

  detailCard: {
    backgroundColor: palette.paper,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: palette.line,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  detailRow: { flexDirection: 'row', gap: spacing.md, paddingVertical: spacing.md },
  detailText: { flex: 1 },
  detailLabel: { fontSize: 9, fontFamily: fonts.bold, color: palette.muted, letterSpacing: 1.1, marginBottom: 3 },
  detailValue: { fontSize: typeScale.base, fontFamily: fonts.medium, color: palette.ink, lineHeight: 20 },
  detailDivider: { height: 1, backgroundColor: palette.line },

  ctaRow: { gap: spacing.md, marginBottom: spacing.xxl },
  openRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs, paddingVertical: spacing.sm },
  openLabel: { fontSize: typeScale.sm, fontFamily: fonts.bold, color: palette.navy },
  pressed: { opacity: 0.7 },

  sectionLabel: {
    fontSize: 10,
    fontFamily: fonts.bold,
    color: palette.muted,
    letterSpacing: 1.4,
    marginBottom: spacing.md,
  },
  members: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, marginBottom: spacing.lg },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: palette.line,
  },
  memberRowLast: { borderBottomWidth: 0 },
  memberName: { flex: 1, fontSize: typeScale.base, fontFamily: fonts.medium, color: palette.ink },
  memberTag: {
    fontSize: 9,
    fontFamily: fonts.semi,
    color: palette.navy,
    letterSpacing: 0.9,
    includeFontPadding: false,
  },
  memberFoot: {
    fontSize: typeScale.xs,
    fontFamily: fonts.regular,
    color: palette.muted,
    paddingVertical: spacing.md,
  },

  ministryLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: palette.paper,
    borderWidth: 1,
    borderColor: palette.line,
    borderRadius: radius.card,
    padding: spacing.lg,
  },
  ministryIcon: {
    width: 34,
    height: 34,
    borderRadius: radius.sm,
    backgroundColor: palette.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ministryText: { flex: 1 },
  ministryLabel: { fontSize: 9, fontFamily: fonts.bold, color: palette.muted, letterSpacing: 1.1 },
  ministryName: { fontSize: typeScale.base, fontFamily: fonts.semi, color: palette.ink, marginTop: 2 },

  footer: {
    fontSize: typeScale.xs,
    fontFamily: fonts.regular,
    color: palette.muted,
    lineHeight: 18,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
});
