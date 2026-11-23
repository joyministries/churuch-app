import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Pressable } from 'react-native';
import { Screen, Avatar } from '../components';
import { BrandLockup } from '../components/BrandMark';
import { theme } from '../lib/theme';
import { brand } from '../lib/brand';
import { useAuthStore, useChatStore, useNotificationsStore, useQuickActionsStore } from '../store';
import { chatRooms, unreadCount } from '../lib/chat';
import { api } from '../services/api';
import { Ionicons } from '@expo/vector-icons';

const { palette, spacing, typeScale, radius, fonts } = theme;

const QUICK_ACTIONS = [
  { icon: 'chatbubbles-outline', label: 'Chats', hint: 'Family & ministries', screen: 'ChatHub' },
  { icon: 'heart-outline', label: 'Prayer', hint: 'Wall & requests', screen: 'Pray' },
  { icon: 'card-outline', label: 'Give', hint: 'Tithe & offering', screen: 'Give' },
  { icon: 'play-circle-outline', label: 'Sermons', hint: 'Watch & listen', screen: 'Media' },
  { icon: 'calendar-outline', label: 'Events', hint: 'RSVP & check-in', screen: 'Events' },
  { icon: 'people-outline', label: 'Ministries', hint: 'Find your place', screen: 'Ministries' },
  { icon: 'school-outline', label: 'Growth', hint: 'Classes & tracks', screen: 'Growth' },
  { icon: 'megaphone-outline', label: 'Notices', hint: 'Board & updates', screen: 'NoticeBoard' },
] as const;

function parseDate(value?: string | null): Date | null {
  if (!value) return null;
  const d = new Date(String(value).replace(' ', 'T'));
  return isNaN(d.getTime()) ? null : d;
}

function greetingFor(hour: number) {
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function DashboardScreen({ navigation }: any) {
  const user = useAuthStore((s) => s.user);
  const [events, setEvents] = useState<any[]>([]);
  const [notices, setNotices] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const chatJoined = useChatStore((s) => s.joined);
  const chatMessages = useChatStore((s) => s.messages);
  const chatRead = useChatStore((s) => s.lastRead);
  const unread = chatRooms
    .filter((r) => chatJoined[r.id])
    .reduce((total, r) => total + unreadCount(chatMessages[r.id] ?? [], chatRead[r.id]), 0);
  const notifications = useNotificationsStore((s) => s.items);
  const unreadNotes = notifications.filter((n) => !n.read).length;

  const recentActions = useQuickActionsStore((s) => s.recent);
  const touchAction = useQuickActionsStore((s) => s.touch);

  const quickActions = [...QUICK_ACTIONS].sort((a, b) => {
    const ai = recentActions.indexOf(a.screen);
    const bi = recentActions.indexOf(b.screen);
    const aRank = ai === -1 ? Number.MAX_SAFE_INTEGER : ai;
    const bRank = bi === -1 ? Number.MAX_SAFE_INTEGER : bi;
    if (aRank !== bRank) return aRank - bRank;
    return QUICK_ACTIONS.indexOf(a) - QUICK_ACTIONS.indexOf(b);
  });

  const load = async () => {
    try {
      const [ev, ct] = await Promise.all([
        api<any[]>('/events'),
        api<any[]>('/content?type=notice'),
      ]);
      setEvents(ev);
      setNotices(ct);
    } catch {}
  };

  useEffect(() => { load(); }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const nextService = events.find((e) => {
    const d = parseDate(e.starts_at);
    return d ? d.getTime() > Date.now() : false;
  }) ?? events[0];

  const startsAt = parseDate(nextService?.starts_at);
  const firstName = (user?.name ?? 'Friend').split(' ')[0];
  const greeting = greetingFor(new Date().getHours());

  return (
    <Screen scroll={false} style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[palette.accent]} tintColor={palette.accent} />}
      >
        {/* Brand — the mark stays on every load, above the fold */}
        <View style={styles.brandRow}>
          <BrandLockup size={32} onPress={() => navigation.navigate('Ministries')} />
          <View style={styles.headerActions}>
            <Pressable
              onPress={() => navigation.navigate('Notifications')}
              accessibilityRole="button"
              accessibilityLabel={unreadNotes ? `Open notifications, ${unreadNotes} unread` : 'Open notifications'}
              hitSlop={8}
              style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}
            >
              <Ionicons name="notifications-outline" size={20} color={palette.ink} />
              {unreadNotes > 0 ? (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{unreadNotes > 9 ? '9+' : unreadNotes}</Text>
                </View>
              ) : null}
            </Pressable>
            <Pressable
              onPress={() => navigation.navigate('ChatHub')}
              accessibilityRole="button"
              accessibilityLabel={unread ? `Open chats, ${unread} unread` : 'Open chats'}
              hitSlop={8}
              style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}
            >
              <Ionicons name="chatbubbles-outline" size={20} color={palette.ink} />
              {unread > 0 ? (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{unread > 9 ? '9+' : unread}</Text>
                </View>
              ) : null}
            </Pressable>
            <Pressable
              onPress={() => navigation.navigate('Profile')}
              accessibilityRole="button"
              accessibilityLabel="Open your profile"
              hitSlop={8}
              style={({ pressed }) => [styles.avatarBtn, pressed && styles.pressed]}
            >
              <Avatar name={user?.name ?? 'Friend'} size={36} />
            </Pressable>
          </View>
        </View>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.eyebrow}>{brand.location.toUpperCase()}</Text>
          <Text style={styles.greeting}>{greeting},</Text>
          <Text style={styles.name} numberOfLines={1}>{firstName}</Text>
        </View>

        {/* Next service — a printed band that runs edge to edge, not a card */}
        {nextService && (
          <View style={styles.service}>
            <View style={styles.serviceTop}>
              <Text style={styles.serviceLabel}>NEXT SERVICE</Text>
              {startsAt && (
                <Text style={styles.serviceLabel}>
                  {startsAt
                    .toLocaleDateString(undefined, { weekday: 'short', day: '2-digit', month: 'short' })
                    .toUpperCase()}
                </Text>
              )}
            </View>
            <Text style={styles.serviceTitle} numberOfLines={2}>{nextService.title}</Text>
            <Text style={styles.serviceMeta}>
              {startsAt
                ? `${startsAt.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}  ·  ${brand.location}`
                : brand.location}
            </Text>
            <View style={styles.serviceActions}>
              <Pressable
                onPress={() => navigation.navigate('Media')}
                accessibilityRole="button"
                accessibilityLabel="Watch the service live"
                style={({ pressed }) => [styles.serviceAction, pressed && styles.pressed]}
              >
                <Text style={styles.serviceActionLabel}>Watch live</Text>
                <Ionicons name="arrow-forward" size={13} color={palette.onDark} />
              </Pressable>
              <Pressable
                onPress={() => navigation.navigate('EventDetail', { id: nextService.id })}
                accessibilityRole="button"
                accessibilityLabel="RSVP for this service"
                style={({ pressed }) => [styles.serviceAction, pressed && styles.pressed]}
              >
                <Text style={styles.serviceActionLabel}>RSVP</Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* Quick actions — one directory card, hairlines instead of floating tiles */}
        <View style={styles.sectionHead}>
          <Text style={styles.sectionLabel}>QUICK ACTIONS</Text>
          <View style={styles.sectionRule} />
        </View>
        <View style={styles.actionList}>
          {quickActions.map((q, i) => (
            <Pressable
              key={q.label}
              onPress={() => {
                touchAction(q.screen);
                navigation.navigate(q.screen);
              }}
              accessibilityRole="button"
              accessibilityLabel={`${q.label} — ${q.hint}`}
              style={({ pressed }) => [styles.action, i > 0 && styles.actionDivider, pressed && styles.pressed]}
            >
              <Ionicons name={q.icon as any} size={15} color={palette.ink} />
              <Text style={styles.actionLabel}>{q.label}</Text>
              <Text style={styles.actionHint} numberOfLines={1}>{q.hint}</Text>
              <Ionicons name="chevron-forward" size={13} color={palette.control} />
            </Pressable>
          ))}
        </View>

        {/* Devotional */}
        <View style={styles.rule} />
        <Pressable
          onPress={() => navigation.navigate('Devotionals')}
          accessibilityRole="button"
          accessibilityLabel="Open today's devotional"
          style={({ pressed }) => [styles.devotional, pressed && styles.pressed]}
        >
          <View style={styles.devotionalHead}>
            <Text style={styles.sectionLabel}>TODAY&apos;S DEVOTIONAL</Text>
            <View style={styles.streak}>
              <View style={styles.streakRule} />
              <Text style={styles.streakText}>DAY 7</Text>
            </View>
          </View>
          <Text style={styles.devotionalTitle}>Walk in Love</Text>
          <Text style={styles.devotionalMeta}>3 min read · reflection prompt</Text>
          <View style={styles.readRow}>
            <Text style={styles.readLabel}>Read devotional</Text>
            <Ionicons name="arrow-forward" size={14} color={palette.accent} />
          </View>
        </Pressable>

        {/* Notice board — indexed list, hairlines not stacked cards */}
        <View style={styles.rule} />
        <View style={styles.sectionHead}>
          <Text style={styles.sectionLabel}>NOTICE BOARD</Text>
          <View style={styles.sectionRule} />
          <Pressable onPress={() => navigation.navigate('NoticeBoard')} accessibilityRole="button" accessibilityLabel="See all notices" hitSlop={8}>
            <Text style={styles.linkLabel}>All</Text>
          </Pressable>
        </View>

        {notices.slice(0, 3).map((n, i) => (
          <Pressable
            key={n.id}
            onPress={() => navigation.navigate('NoticeBoard')}
            accessibilityRole="button"
            accessibilityLabel={n.title}
            style={({ pressed }) => [styles.notice, pressed && styles.pressed]}
          >
            <Text style={styles.noticeIndex}>{String(i + 1).padStart(2, '0')}</Text>
            <View style={styles.noticeBody}>
              <Text style={styles.noticeTitle} numberOfLines={2}>{n.title}</Text>
              {n.body ? <Text style={styles.noticeText} numberOfLines={2}>{n.body}</Text> : null}
            </View>
          </Pressable>
        ))}
        {notices.length === 0 && <Text style={styles.empty}>Nothing posted yet.</Text>}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingHorizontal: 0, paddingBottom: 0 },
  content: { paddingHorizontal: 24, paddingBottom: 96, gap: 18 },

  brandRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  iconBtn: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
  avatarBtn: { borderRadius: 999 },
  pressed: { opacity: 0.6 },
  badge: {
    position: 'absolute',
    top: 1,
    right: 1,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: palette.ground,
    backgroundColor: palette.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 9,
    fontFamily: 'Plus Jakarta Sans Bold',
    color: palette.surface,
    lineHeight: 11,
    includeFontPadding: false,
  },

  header: { marginBottom: 0 },
  eyebrow: {
    fontSize: 9.5,
    fontFamily: 'Plus Jakarta Sans SemiBold',
    color: palette.muted,
    letterSpacing: 1.5,
    includeFontPadding: false,
  },
  greeting: { fontSize: 14, fontFamily: 'Plus Jakarta Sans', color: palette.muted, marginTop: 8 },
  name: { fontSize: 32, fontFamily: 'Instrument Serif', color: palette.ink, letterSpacing: -0.6, lineHeight: 38 },

  /* Full-bleed band: square edges, no card, no radius. */
  service: {
    backgroundColor: palette.deep,
    marginHorizontal: -24,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 20,
    marginBottom: 4,
  },
  serviceTop: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  serviceLabel: {
    fontSize: 9,
    fontFamily: 'Plus Jakarta Sans SemiBold',
    color: palette.sky,
    letterSpacing: 1.8,
    includeFontPadding: false,
  },
  serviceTitle: {
    fontSize: 34,
    fontFamily: 'Instrument Serif',
    color: palette.onDark,
    letterSpacing: -0.5,
    lineHeight: 38,
  },
  serviceMeta: { fontSize: 11, fontFamily: 'Plus Jakarta Sans', color: palette.onDarkMuted, marginTop: 8 },
  serviceActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 22,
    marginTop: 20,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.16)',
  },
  serviceAction: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  serviceActionLabel: {
    fontSize: 10,
    fontFamily: 'Plus Jakarta Sans SemiBold',
    color: palette.onDark,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    includeFontPadding: false,
  },

  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: -4 },
  sectionRule: { flex: 1, height: 1, backgroundColor: palette.border },
  sectionLabel: { fontSize: 9.5, fontFamily: 'Plus Jakarta Sans SemiBold', color: palette.muted, letterSpacing: 1.5, includeFontPadding: false },

  actionList: { marginBottom: 0 },
  action: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14 },
  actionDivider: { borderTopWidth: 1, borderTopColor: palette.border },
  actionLabel: { fontSize: 13, fontFamily: 'Plus Jakarta Sans SemiBold', color: palette.ink, lineHeight: 18 },
  actionHint: {
    flex: 1,
    textAlign: 'right',
    fontSize: 11,
    fontFamily: 'Plus Jakarta Sans',
    color: palette.muted,
  },

  rule: { height: 1, backgroundColor: palette.rule, marginBottom: 0 },

  devotional: { marginBottom: 0 },
  devotionalHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  streak: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  streakRule: { width: 14, height: 1, backgroundColor: palette.border },
  streakText: {
    fontSize: 9.5,
    fontFamily: 'Plus Jakarta Sans SemiBold',
    color: palette.muted,
    letterSpacing: 1.2,
    includeFontPadding: false,
  },
  devotionalTitle: { fontSize: 24, fontFamily: 'Instrument Serif', color: palette.ink, letterSpacing: -0.3, lineHeight: 28 },
  devotionalMeta: { fontSize: 12, fontFamily: 'Plus Jakarta Sans', color: palette.muted, marginTop: 4 },
  readRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 16 },
  readLabel: { fontSize: 13, fontFamily: 'Plus Jakarta Sans SemiBold', color: palette.accent },

  notice: { flexDirection: 'row', gap: 16, paddingVertical: 16, borderTopWidth: 1, borderTopColor: palette.border },
  noticeIndex: {
    fontSize: 9.5,
    fontFamily: 'Plus Jakarta Sans SemiBold',
    color: palette.muted,
    letterSpacing: 1,
    paddingTop: 4,
    includeFontPadding: false,
  },
  noticeBody: { flex: 1 },
  noticeTitle: {
    fontSize: 16,
    fontFamily: 'Instrument Serif',
    color: palette.ink,
    letterSpacing: -0.1,
    lineHeight: 21,
  },
  noticeText: { fontSize: 12, fontFamily: 'Plus Jakarta Sans', color: palette.muted, lineHeight: 18, marginTop: 2 },

  linkLabel: { fontSize: 12, fontFamily: 'Plus Jakarta Sans SemiBold', color: palette.accent },
  empty: { fontSize: 12, fontFamily: 'Plus Jakarta Sans', color: palette.muted, paddingVertical: 16 },
});

const nextService = null; // TypeScript satisfaction