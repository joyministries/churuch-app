import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Card, Chip } from '../components';
import { theme } from '../lib/theme';
import { formatWhen } from '../lib/chat';
import { notificationDay, notificationStyle, type AppNotification } from '../lib/notifications';
import { useNotificationsStore } from '../store';

const { palette, spacing, radius, typeScale, fonts } = theme;

const FILTERS = ['all', 'unread'] as const;

function NotificationRow({
  item,
  onPress,
}: {
  item: AppNotification;
  onPress: () => void;
}) {
  const style = notificationStyle[item.kind];
  return (
    <Card onPress={onPress} padding={spacing.lg} style={[styles.card, !item.read ? styles.cardUnread : null]}>
      <View style={styles.row}>
        <View style={[styles.tile, { backgroundColor: `${style.color}14` }]}>
          <Ionicons name={style.icon} size={19} color={style.color} />
        </View>

        <View style={styles.body}>
          <View style={styles.topRow}>
            <Text style={[styles.kind, { color: style.color }]}>{style.label}</Text>
            <Text style={styles.time}>{formatWhen(item.at)}</Text>
          </View>
          <Text style={[styles.title, !item.read && styles.titleUnread]} numberOfLines={2}>
            {item.title}
          </Text>
          <Text style={styles.preview} numberOfLines={2}>
            {item.body}
          </Text>
          {item.cue ? (
            <View style={styles.cueRow}>
              <Text style={styles.cue}>{item.cue}</Text>
              <Ionicons name="arrow-forward" size={12} color={palette.navy} />
            </View>
          ) : null}
        </View>

        {!item.read ? <View style={styles.dot} /> : null}
      </View>
    </Card>
  );
}

export default function NotificationsScreen({ navigation }: any) {
  const items = useNotificationsStore((s) => s.items);
  const markRead = useNotificationsStore((s) => s.markRead);
  const markAllRead = useNotificationsStore((s) => s.markAllRead);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('all');

  const unread = items.filter((n) => !n.read).length;
  const visible = useMemo(
    () => (filter === 'unread' ? items.filter((n) => !n.read) : items),
    [filter, items]
  );

  const groups = useMemo(() => {
    const sorted = [...visible].sort((a, b) => b.at - a.at);
    const map = new Map<string, AppNotification[]>();
    for (const n of sorted) {
      const key = notificationDay(n.at);
      map.set(key, [...(map.get(key) ?? []), n]);
    }
    return [...map.entries()];
  }, [visible]);

  const open = (item: AppNotification) => {
    markRead(item.id);
    if (!item.screen) return;
    navigation.navigate(item.screen, item.params as any);
  };

  return (
    <Screen scroll={false} style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.kicker}>INBOX</Text>
          <Text style={styles.pageTitle}>Notifications</Text>
          <Text style={styles.subtitle}>
            {unread > 0
              ? `${unread} thing${unread === 1 ? '' : 's'} waiting on you — a room, a prayer, or the office.`
              : 'You are all caught up. New updates land here as they happen.'}
          </Text>
        </View>

        <View style={styles.controls}>
          <View style={styles.filters}>
            {FILTERS.map((f) => (
              <Chip
                key={f}
                label={f === 'all' ? 'Everything' : `Unread${unread ? ` (${unread})` : ''}`}
                active={filter === f}
                onPress={() => setFilter(f)}
              />
            ))}
          </View>
          {unread > 0 ? (
            <Pressable
              onPress={markAllRead}
              accessibilityRole="button"
              accessibilityLabel="Mark every notification as read"
              style={({ pressed }) => [styles.markAll, pressed && styles.pressed]}
            >
              <Ionicons name="checkmark-outline" size={14} color={palette.navy} />
              <Text style={styles.markAllLabel}>Mark all read</Text>
            </Pressable>
          ) : null}
        </View>

        {groups.map(([day, rows]) => (
          <View key={day} style={styles.group}>
            <Text style={styles.day}>{day}</Text>
            {rows.map((item) => (
              <NotificationRow key={item.id} item={item} onPress={() => open(item)} />
            ))}
          </View>
        ))}

        {visible.length === 0 ? (
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <Ionicons name="notifications-off" size={24} color={palette.navy} />
            </View>
            <Text style={styles.emptyTitle}>Nothing unread</Text>
            <Text style={styles.emptyBody}>
              When a room gets busy, a prayer goes up, or the office posts something, it shows up
              here.
            </Text>
          </View>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingHorizontal: 0, paddingBottom: 0 },
  content: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xxxxl },

  header: { marginTop: spacing.sm, marginBottom: spacing.lg },
  kicker: { fontSize: typeScale.xs, fontFamily: fonts.semi, color: palette.muted, letterSpacing: 1.6 },
  pageTitle: {
    fontSize: 42,
    fontFamily: fonts.heading,
    color: palette.ink,
    letterSpacing: -0.6,
    lineHeight: 46,
    marginTop: spacing.xs,
  },
  subtitle: {
    fontSize: typeScale.md,
    fontFamily: fonts.regular,
    color: palette.muted,
    lineHeight: 22,
    marginTop: spacing.sm,
  },

  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  filters: { flexDirection: 'row', gap: spacing.sm },
  markAll: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  markAllLabel: { fontSize: typeScale.xs, fontFamily: fonts.bold, color: palette.navy },
  pressed: { opacity: 0.6 },

  group: { marginBottom: spacing.md },
  day: {
    fontSize: 10,
    fontFamily: fonts.bold,
    color: palette.muted,
    letterSpacing: 1.3,
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
  },

  card: { marginBottom: spacing.sm },
  cardUnread: { borderColor: `${palette.brandBlue}40` },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  tile: {
    width: 38,
    height: 38,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  kind: { fontSize: 9, fontFamily: fonts.bold, letterSpacing: 1.2 },
  time: { fontSize: 10, fontFamily: fonts.medium, color: palette.muted },
  title: {
    fontSize: typeScale.lg,
    fontFamily: fonts.semi,
    color: palette.ink,
    marginTop: 3,
    lineHeight: 20,
  },
  titleUnread: { fontFamily: fonts.bold },
  preview: {
    fontSize: typeScale.sm,
    fontFamily: fonts.regular,
    color: palette.muted,
    lineHeight: 19,
    marginTop: 3,
  },
  cueRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: spacing.sm },
  cue: { fontSize: typeScale.xs, fontFamily: fonts.bold, color: palette.navy },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: palette.brandBlue,
    marginTop: 6,
  },

  empty: {
    alignItems: 'center',
    paddingVertical: spacing.xxxxl,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: palette.line,
    backgroundColor: palette.paper,
    marginTop: spacing.md,
  },
  emptyIcon: {
    width: 52,
    height: 52,
    borderRadius: radius.full,
    backgroundColor: palette.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  emptyTitle: { fontSize: 24, fontFamily: fonts.heading, color: palette.ink, marginBottom: spacing.sm },
  emptyBody: {
    fontSize: typeScale.md,
    fontFamily: fonts.regular,
    color: palette.muted,
    lineHeight: 22,
    textAlign: 'center',
    maxWidth: 280,
  },
});
