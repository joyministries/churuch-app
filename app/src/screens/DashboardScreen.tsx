import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Screen, Avatar } from '../components';
import { theme } from '../lib/theme';
import { brand } from '../lib/brand';
import { useAuthStore, useChatStore, useNotificationsStore, useQuickActionsStore } from '../store';
import { chatRooms, unreadCount } from '../lib/chat';
import { api } from '../services/api';
import { Ionicons } from '@expo/vector-icons';

const { palette, spacing, fonts } = theme;

const SHORTCUTS = [
  { icon: 'chatbubbles-outline', label: 'Chats', screen: 'ChatHub' },
  { icon: 'heart-outline', label: 'Prayer', screen: 'Pray' },
  { icon: 'card-outline', label: 'Give', screen: 'Give' },
  { icon: 'play-circle-outline', label: 'Sermons', screen: 'Media' },
  { icon: 'calendar-outline', label: 'Events', screen: 'Events' },
  { icon: 'people-outline', label: 'Ministries', screen: 'Ministries' },
  { icon: 'school-outline', label: 'Growth', screen: 'Growth' },
  { icon: 'megaphone-outline', label: 'Notices', screen: 'NoticeBoard' },
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

function clock(d: Date | null) {
  if (!d) return '';
  return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

function dayName(d: Date | null) {
  if (!d) return '';
  return d.toLocaleDateString(undefined, { weekday: 'short' });
}

function dayNumber(d: Date | null) {
  if (!d) return '--';
  return String(d.getDate()).padStart(2, '0');
}

function monthName(d: Date | null) {
  if (!d) return '';
  return d.toLocaleDateString(undefined, { month: 'short' });
}

export default function DashboardScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
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

  /* The four a member reaches for most often float to the front of the grid. */
  const shortcuts = [...SHORTCUTS].sort((a, b) => {
    const ai = recentActions.indexOf(a.screen);
    const bi = recentActions.indexOf(b.screen);
    const aRank = ai === -1 ? Number.MAX_SAFE_INTEGER : ai;
    const bRank = bi === -1 ? Number.MAX_SAFE_INTEGER : bi;
    if (aRank !== bRank) return aRank - bRank;
    return SHORTCUTS.indexOf(a) - SHORTCUTS.indexOf(b);
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

  useEffect(() => {
    load();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const nextService =
    events.find((e) => {
      const d = parseDate(e.starts_at);
      return d ? d.getTime() > Date.now() : false;
    }) ?? events[0];

  const startsAt = parseDate(nextService?.starts_at);
  const firstName = (user?.name ?? 'Friend').split(' ')[0];
  const greeting = greetingFor(new Date().getHours());
  const later = events.filter((e) => e.id !== nextService?.id).slice(0, 3);

  return (
    <Screen scroll={false} style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[palette.accent]} tintColor={palette.accent} />
        }
      >
        {/* Masthead — the church's own colour, carrying the greeting */}
        <View style={[styles.masthead, { paddingTop: insets.top + spacing.md }]}>
          <View style={styles.mastheadRow}>
            <View style={styles.wordmark}>
              <Text style={styles.wordmarkText}>JOY MINISTRIES</Text>
              <Text style={styles.wordmarkSub}>{brand.location}</Text>
            </View>
            <View style={styles.headerActions}>
              <Pressable
                onPress={() => navigation.navigate('Notifications')}
                accessibilityRole="button"
                accessibilityLabel={unreadNotes ? `Notifications, ${unreadNotes} unread` : 'Notifications'}
                hitSlop={8}
                style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}
              >
                <Ionicons name="notifications-outline" size={20} color={palette.onDark} />
                {unreadNotes > 0 ? (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{unreadNotes > 9 ? '9+' : unreadNotes}</Text>
                  </View>
                ) : null}
              </Pressable>
              <Pressable
                onPress={() => navigation.navigate('Profile')}
                accessibilityRole="button"
                accessibilityLabel="Your profile"
                hitSlop={8}
                style={({ pressed }) => [styles.avatarBtn, pressed && styles.pressed]}
              >
                <Avatar name={user?.name ?? 'Friend'} size={34} />
              </Pressable>
            </View>
          </View>

          <Text style={styles.greeting}>
            {greeting}, {firstName}
          </Text>
          <Text style={styles.mastheadLine}>
            {startsAt
              ? `Next service ${dayName(startsAt)} ${clock(startsAt)} · ${brand.location}`
              : `Sundays · 10:00 · ${brand.location}`}
          </Text>
        </View>

        {/* Next service — the one card that earns a card */}
        {nextService ? (
          <Pressable
            onPress={() => navigation.navigate('EventDetail', { id: nextService.id })}
            accessibilityRole="button"
            accessibilityLabel={`${nextService.title}, open details`}
            style={({ pressed }) => [styles.serviceCard, pressed && styles.cardPressed]}
          >
            <View style={styles.serviceTop}>
              <View style={styles.dateBlock}>
                <Text style={styles.dateDay}>{dayNumber(startsAt)}</Text>
                <Text style={styles.dateMonth}>{monthName(startsAt)}</Text>
              </View>
              <View style={styles.serviceBody}>
                <Text style={styles.serviceKicker}>Next up</Text>
                <Text style={styles.serviceTitle} numberOfLines={2}>
                  {nextService.title}
                </Text>
                <Text style={styles.serviceMeta} numberOfLines={1}>
                  {startsAt ? `${clock(startsAt)} · ` : ''}
                  {nextService.location || brand.location}
                </Text>
              </View>
            </View>

            <View style={styles.serviceActions}>
              <Pressable
                onPress={() => navigation.navigate('Media')}
                accessibilityRole="button"
                accessibilityLabel="Watch the service"
                style={({ pressed }) => [styles.primaryBtn, pressed && styles.btnPressed]}
              >
                <Ionicons name="play" size={13} color={palette.white} />
                <Text style={styles.primaryBtnLabel}>Watch</Text>
              </Pressable>
              <Pressable
                onPress={() => navigation.navigate('EventDetail', { id: nextService.id })}
                accessibilityRole="button"
                accessibilityLabel="See details and RSVP"
                style={({ pressed }) => [styles.secondaryBtn, pressed && styles.btnPressed]}
              >
                <Text style={styles.secondaryBtnLabel}>Details</Text>
              </Pressable>
            </View>
          </Pressable>
        ) : null}

        {/* Shortcuts — the app's whole map, one tap away */}
        <View style={styles.grid}>
          {shortcuts.map((q) => (
            <Pressable
              key={q.label}
              onPress={() => {
                touchAction(q.screen);
                navigation.navigate(q.screen);
              }}
              accessibilityRole="button"
              accessibilityLabel={q.label}
              style={({ pressed }) => [styles.shortcut, pressed && styles.pressed]}
            >
              <View style={styles.shortcutIcon}>
                <Ionicons name={q.icon as any} size={21} color={palette.navy} />
                {q.screen === 'ChatHub' && unread > 0 ? <View style={styles.dot} /> : null}
              </View>
              <Text style={styles.shortcutLabel}>{q.label}</Text>
            </Pressable>
          ))}
        </View>

        {/* The week ahead */}
        {later.length > 0 ? (
          <View style={styles.block}>
            <View style={styles.blockHead}>
              <Text style={styles.blockTitle}>This week</Text>
              <Pressable onPress={() => navigation.navigate('Events')} hitSlop={8} accessibilityRole="button">
                <Text style={styles.link}>All events</Text>
              </Pressable>
            </View>
            <View style={styles.list}>
              {later.map((e, i) => {
                const d = parseDate(e.starts_at);
                return (
                  <Pressable
                    key={e.id}
                    onPress={() => navigation.navigate('EventDetail', { id: e.id })}
                    accessibilityRole="button"
                    accessibilityLabel={`${e.title}, ${dayName(d)} ${clock(d)}`}
                    style={({ pressed }) => [styles.row, i > 0 && styles.rowDivider, pressed && styles.pressed]}
                  >
                    <View style={styles.rowDate}>
                      <Text style={styles.rowWeekday}>{dayName(d)}</Text>
                      <Text style={styles.rowDay}>{dayNumber(d)}</Text>
                    </View>
                    <View style={styles.rowBody}>
                      <Text style={styles.rowTitle} numberOfLines={1}>
                        {e.title}
                      </Text>
                      <Text style={styles.rowMeta} numberOfLines={1}>
                        {clock(d)}
                        {e.location ? ` · ${e.location}` : ''}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={15} color={palette.control} />
                  </Pressable>
                );
              })}
            </View>
          </View>
        ) : null}

        {/* Notice board */}
        <View style={styles.block}>
          <View style={styles.blockHead}>
            <Text style={styles.blockTitle}>Notices</Text>
            <Pressable onPress={() => navigation.navigate('NoticeBoard')} hitSlop={8} accessibilityRole="button">
              <Text style={styles.link}>All notices</Text>
            </Pressable>
          </View>
          {notices.length ? (
            <View style={styles.list}>
              {notices.slice(0, 3).map((n, i) => (
                <Pressable
                  key={n.id}
                  onPress={() => navigation.navigate('NoticeBoard')}
                  accessibilityRole="button"
                  accessibilityLabel={n.title}
                  style={({ pressed }) => [styles.row, i > 0 && styles.rowDivider, pressed && styles.pressed]}
                >
                  <View style={styles.rowBody}>
                    <Text style={styles.rowTitle} numberOfLines={2}>
                      {n.title}
                    </Text>
                    {n.body ? (
                      <Text style={styles.rowText} numberOfLines={2}>
                        {n.body}
                      </Text>
                    ) : null}
                  </View>
                </Pressable>
              ))}
            </View>
          ) : (
            <Text style={styles.empty}>Nothing posted yet.</Text>
          )}
        </View>

        {/* Devotional */}
        <Pressable
          onPress={() => navigation.navigate('Devotionals')}
          accessibilityRole="button"
          accessibilityLabel="Open today's devotional"
          style={({ pressed }) => [styles.devotional, pressed && styles.cardPressed]}
        >
          <View style={styles.devotionalBody}>
            <Text style={styles.devotionalKicker}>Today&apos;s devotional</Text>
            <Text style={styles.devotionalTitle}>Walk in Love</Text>
            <Text style={styles.devotionalMeta}>3 min read · reflection prompt</Text>
          </View>
          <View style={styles.devotionalArrow}>
            <Ionicons name="arrow-forward" size={16} color={palette.navy} />
          </View>
        </Pressable>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingHorizontal: 0, paddingBottom: 0 },
  content: { paddingBottom: 40 },

  /* masthead */
  masthead: {
    backgroundColor: palette.deep,
    paddingHorizontal: spacing.pad,
    paddingBottom: spacing.xxl + 6,
  },
  mastheadRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  wordmark: { gap: 1 },
  wordmarkText: {
    fontFamily: fonts.extra,
    fontSize: 13,
    letterSpacing: 1.2,
    color: palette.onDark,
    includeFontPadding: false,
  },
  wordmarkSub: { fontFamily: fonts.regular, fontSize: 11, color: palette.onDarkMuted },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  iconBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  avatarBtn: { borderRadius: 999 },
  pressed: { opacity: 0.65 },
  badge: {
    position: 'absolute',
    top: 3,
    right: 3,
    minWidth: 17,
    height: 17,
    paddingHorizontal: 4,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: palette.deep,
    backgroundColor: palette.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 9,
    fontFamily: fonts.bold,
    color: palette.white,
    lineHeight: 11,
    includeFontPadding: false,
  },
  greeting: {
    fontFamily: fonts.bold,
    fontSize: 26,
    lineHeight: 32,
    letterSpacing: -0.4,
    color: palette.onDark,
    marginTop: spacing.xl,
  },
  mastheadLine: {
    fontFamily: fonts.regular,
    fontSize: 12.5,
    lineHeight: 18,
    color: palette.onDarkMuted,
    marginTop: 5,
  },

  /* next service */
  serviceCard: {
    backgroundColor: palette.surface,
    marginHorizontal: spacing.pad,
    marginTop: -22,
    borderRadius: 14,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: palette.line,
  },
  cardPressed: { opacity: 0.85 },
  serviceTop: { flexDirection: 'row', gap: spacing.md },
  dateBlock: {
    width: 54,
    height: 58,
    borderRadius: 10,
    backgroundColor: palette.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateDay: {
    fontFamily: fonts.bold,
    fontSize: 20,
    lineHeight: 23,
    color: palette.navy,
    includeFontPadding: false,
  },
  dateMonth: {
    fontFamily: fonts.semi,
    fontSize: 10,
    letterSpacing: 0.6,
    color: palette.navy,
    includeFontPadding: false,
  },
  serviceBody: { flex: 1, justifyContent: 'center' },
  serviceKicker: { fontFamily: fonts.medium, fontSize: 11.5, color: palette.muted },
  serviceTitle: {
    fontFamily: fonts.bold,
    fontSize: 17,
    lineHeight: 22,
    letterSpacing: -0.2,
    color: palette.ink,
    marginTop: 1,
  },
  serviceMeta: { fontFamily: fonts.regular, fontSize: 12, color: palette.muted, marginTop: 3 },
  serviceActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg },
  primaryBtn: {
    flex: 1,
    height: 40,
    borderRadius: 9,
    backgroundColor: palette.navy,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  btnPressed: { opacity: 0.8 },
  primaryBtnLabel: { fontFamily: fonts.semi, fontSize: 13.5, color: palette.white },
  secondaryBtn: {
    paddingHorizontal: spacing.lg,
    height: 40,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: palette.control,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnLabel: { fontFamily: fonts.semi, fontSize: 13.5, color: palette.ink },

  /* shortcut grid */
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.pad - 4,
    marginTop: spacing.xxl,
  },
  shortcut: { width: '25%', alignItems: 'center', paddingVertical: spacing.sm, gap: 7 },
  shortcutIcon: {
    width: 48,
    height: 48,
    borderRadius: 13,
    backgroundColor: palette.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: palette.negative,
    borderWidth: 1.5,
    borderColor: palette.accentSoft,
  },
  shortcutLabel: {
    fontFamily: fonts.medium,
    fontSize: 11.5,
    color: palette.ink,
    textAlign: 'center',
  },

  /* blocks */
  block: { marginTop: spacing.xxl, paddingHorizontal: spacing.pad },
  blockHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  blockTitle: { fontFamily: fonts.bold, fontSize: 16, letterSpacing: -0.2, color: palette.ink },
  link: { fontFamily: fonts.semi, fontSize: 12.5, color: palette.navy },

  list: {
    backgroundColor: palette.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: palette.line,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md + 2,
    paddingHorizontal: spacing.md + 2,
    minHeight: 58,
  },
  rowDivider: { borderTopWidth: 1, borderTopColor: palette.rule },
  rowDate: { width: 34, alignItems: 'center' },
  rowWeekday: {
    fontFamily: fonts.semi,
    fontSize: 10,
    letterSpacing: 0.4,
    color: palette.muted,
    includeFontPadding: false,
  },
  rowDay: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: palette.ink,
    includeFontPadding: false,
  },
  rowBody: { flex: 1 },
  rowTitle: { fontFamily: fonts.semi, fontSize: 14, lineHeight: 19, color: palette.ink },
  rowMeta: { fontFamily: fonts.regular, fontSize: 11.5, color: palette.muted, marginTop: 2 },
  rowText: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 17, color: palette.muted, marginTop: 3 },
  empty: { fontFamily: fonts.regular, fontSize: 12.5, color: palette.muted },

  /* devotional */
  devotional: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.xxl,
    marginHorizontal: spacing.pad,
    padding: spacing.lg,
    borderRadius: 12,
    backgroundColor: palette.accentSoft,
  },
  devotionalBody: { flex: 1 },
  devotionalKicker: { fontFamily: fonts.medium, fontSize: 11.5, color: palette.navy },
  devotionalTitle: {
    fontFamily: fonts.bold,
    fontSize: 16.5,
    letterSpacing: -0.2,
    color: palette.ink,
    marginTop: 2,
  },
  devotionalMeta: { fontFamily: fonts.regular, fontSize: 11.5, color: palette.accentInk, marginTop: 3 },
  devotionalArrow: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: palette.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
