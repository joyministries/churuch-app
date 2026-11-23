import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Section } from '../components';
import { theme } from '../lib/theme';
import { chatRooms, formatWhen, lastMessage, unreadCount, type ChatRoom } from '../lib/chat';
import { useChatStore } from '../store';

const { palette, spacing, radius, typeScale, fonts, shadow } = theme;

function RoomRow({
  room,
  joined,
  first,
  onPress,
  onJoin,
}: {
  room: ChatRoom;
  joined: boolean;
  first: boolean;
  onPress: () => void;
  onJoin: () => void;
}) {
  const thread = useChatStore((s) => s.messages[room.id]) ?? [];
  const lastRead = useChatStore((s) => s.lastRead[room.id]);
  const last = lastMessage(thread);
  const unread = joined ? unreadCount(thread, lastRead) : 0;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Open ${room.name}`}
      style={({ pressed }) => [styles.row, !first && styles.rowDivided, pressed && styles.rowPressed]}
    >
      {/* Colour marks the room; the row itself stays ink on paper. */}
      <View style={[styles.marker, { backgroundColor: room.color }]} />

      <View style={styles.body}>
        <View style={styles.nameRow}>
          <Text style={styles.name} numberOfLines={1}>
            {room.name}
          </Text>
          {unread > 0 ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unread > 9 ? '9+' : unread}</Text>
            </View>
          ) : null}
        </View>

        <Text style={styles.preview} numberOfLines={1}>
          {last ? `${last.mine ? 'You: ' : `${last.author.split(' ')[0]}: `}${last.body}` : room.short}
        </Text>

        <Text style={styles.meta} numberOfLines={1}>
          {room.memberCount} members · {room.meeting}
        </Text>
      </View>

      <View style={styles.right}>
        {last ? <Text style={styles.time}>{formatWhen(last.at)}</Text> : null}
        {joined ? (
          <Ionicons name="chevron-forward" size={15} color={palette.muted} style={styles.chevron} />
        ) : (
          <Pressable
            onPress={onJoin}
            accessibilityRole="button"
            accessibilityLabel={`Join ${room.name}`}
            hitSlop={10}
            style={({ pressed }) => [styles.joinLink, pressed && styles.rowPressed]}
          >
            <Text style={styles.joinLabel}>Join</Text>
          </Pressable>
        )}
      </View>
    </Pressable>
  );
}

export default function ChatHubScreen({ navigation }: any) {
  const joined = useChatStore((s) => s.joined);
  const toggleJoin = useChatStore((s) => s.toggleJoin);

  const mine = chatRooms.filter((r) => joined[r.id]);
  const discover = chatRooms.filter((r) => !joined[r.id]);

  return (
    <Screen scroll={false} style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.kicker}>CONVERSATIONS</Text>
        <Text style={styles.title}>Chats</Text>
        <Text style={styles.subtitle}>
          One room for the whole family, and a room for every ministry you belong to.
        </Text>

        <Pressable
          onPress={() => navigation.navigate('NoticeBoard')}
          accessibilityRole="button"
          accessibilityLabel="Read this week's notices"
          style={({ pressed }) => [styles.announce, pressed && styles.rowPressed]}
        >
          <View style={styles.announceHead}>
            <Text style={styles.announceLabel}>FROM THE OFFICE</Text>
            <Ionicons name="arrow-forward" size={15} color={palette.onDarkMuted} />
          </View>
          <Text style={styles.announceBody}>
            This week’s roster and the outreach sign-up are on the notice board.
          </Text>
        </Pressable>

        <Section title="Your rooms">
          <View style={styles.listCard}>
            {mine.map((room, i) => (
              <RoomRow
                key={room.id}
                room={room}
                joined
                first={i === 0}
                onPress={() => navigation.navigate('ChatRoom', { roomId: room.id })}
                onJoin={() => toggleJoin(room.id)}
              />
            ))}
            {mine.length === 0 && (
              <Text style={styles.empty}>You are not in a room yet — join one below.</Text>
            )}
          </View>
        </Section>

        {discover.length > 0 && (
          <Section title="Ministries you can join">
            <Text style={styles.hint}>
              Joining a ministry opens its room. Leave the ministry and the room closes again.
            </Text>
            <View style={styles.listCard}>
              {discover.map((room, i) => (
                <RoomRow
                  key={room.id}
                  room={room}
                  joined={false}
                  first={i === 0}
                  onPress={() => navigation.navigate('RoomInfo', { roomId: room.id })}
                  onJoin={() => {
                    toggleJoin(room.id);
                    navigation.navigate('ChatRoom', { roomId: room.id });
                  }}
                />
              ))}
            </View>
          </Section>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingHorizontal: 0, paddingBottom: 0 },
  content: { paddingHorizontal: spacing.xl, paddingBottom: 120 },

  kicker: {
    fontSize: typeScale.xs,
    fontFamily: fonts.semi,
    color: palette.muted,
    letterSpacing: 1.6,
    marginTop: spacing.sm,
  },
  title: {
    fontSize: 42,
    fontFamily: fonts.serif,
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
    marginBottom: spacing.xl,
  },

  /* One dark anchor, the same device as the next-service card on Home. */
  announce: {
    backgroundColor: palette.deep,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: palette.hairlineDark,
    padding: spacing.lg,
    marginBottom: spacing.xxl,
    ...shadow.md,
  },
  announceHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  announceLabel: {
    fontSize: 9.5,
    fontFamily: fonts.semi,
    color: palette.sky,
    letterSpacing: 1.4,
    includeFontPadding: false,
  },
  announceBody: {
    fontSize: typeScale.base,
    fontFamily: fonts.regular,
    color: palette.onDark,
    lineHeight: 20,
  },

  listCard: {
    backgroundColor: palette.paper,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: palette.line,
    overflow: 'hidden',
    ...shadow.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  rowDivided: { borderTopWidth: 1, borderTopColor: palette.line },
  rowPressed: { opacity: 0.6 },
  marker: { width: 2, height: 34, borderRadius: 1 },

  body: { flex: 1, minWidth: 0 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  name: {
    fontSize: 20,
    fontFamily: fonts.serif,
    color: palette.ink,
    letterSpacing: -0.2,
    lineHeight: 23,
    flexShrink: 1,
  },
  badge: {
    minWidth: 17,
    height: 17,
    paddingHorizontal: 4,
    borderRadius: radius.full,
    backgroundColor: palette.navy,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 9.5,
    fontFamily: fonts.bold,
    color: palette.white,
    lineHeight: 12,
    includeFontPadding: false,
  },
  preview: {
    fontSize: typeScale.sm,
    fontFamily: fonts.regular,
    color: palette.muted,
    marginTop: 2,
  },
  meta: {
    fontSize: 9.5,
    fontFamily: fonts.semi,
    color: palette.muted,
    letterSpacing: 0.4,
    marginTop: 3,
  },

  right: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    alignSelf: 'stretch',
    minWidth: 44,
    paddingVertical: 1,
  },
  time: {
    fontSize: 9.5,
    fontFamily: fonts.medium,
    color: palette.muted,
    includeFontPadding: false,
  },
  chevron: { marginTop: 'auto' },
  joinLink: { marginTop: 'auto', flexDirection: 'row', alignItems: 'center' },
  joinLabel: {
    fontSize: typeScale.xs,
    fontFamily: fonts.semi,
    color: palette.navy,
    lineHeight: 15,
    includeFontPadding: false,
  },

  hint: {
    fontSize: typeScale.sm,
    fontFamily: fonts.regular,
    color: palette.muted,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  empty: {
    fontSize: typeScale.sm,
    fontFamily: fonts.regular,
    color: palette.muted,
    textAlign: 'center',
    paddingVertical: spacing.lg,
  },
});
