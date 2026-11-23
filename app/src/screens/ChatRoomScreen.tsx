import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../components';
import { theme } from '../lib/theme';
import { dayLabel, formatClock, roomById, type ChatMessage } from '../lib/chat';
import { useChatStore } from '../store';

const { palette, spacing, radius, typeScale, fonts } = theme;

const KIND_LABEL: Record<string, string> = {
  church: 'CHURCH-WIDE',
  ministry: 'MINISTRY ROOM',
  team: 'TEAM ROOM',
};

export default function ChatRoomScreen({ route, navigation }: any) {
  const roomId: string = route?.params?.roomId;
  const room = roomById(roomId);
  const messages = useChatStore((s) => (roomId ? s.messages[roomId] ?? [] : []));
  const joined = useChatStore((s) => (roomId ? s.joined[roomId] : false));
  const send = useChatStore((s) => s.send);
  const markRead = useChatStore((s) => s.markRead);
  const toggleJoin = useChatStore((s) => s.toggleJoin);

  const [text, setText] = useState('');
  const listRef = useRef<FlatList<ChatMessage>>(null);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: room?.name ?? 'Chat',
      headerRight: () => (
        <Pressable
          onPress={() => navigation.navigate('RoomInfo', { roomId })}
          accessibilityRole="button"
          accessibilityLabel="Room information"
          hitSlop={10}
          style={styles.headerBtn}
        >
          <Ionicons name="information-circle-outline" size={22} color={palette.navy} />
        </Pressable>
      ),
    });
  }, [navigation, room?.name, roomId]);

  useEffect(() => {
    if (joined) markRead(roomId);
  }, [joined, roomId, messages.length, markRead]);

  const submit = () => {
    const body = text.trim();
    if (!body) return;
    send(roomId, body);
    setText('');
    requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
  };

  const scrollToEnd = useCallback(() => {
    listRef.current?.scrollToEnd({ animated: false });
  }, []);

  if (!room) {
    return (
      <Screen style={{ flex: 1 }}>
        <Text style={styles.missing}>This room no longer exists.</Text>
      </Screen>
    );
  }

  const rows = messages;

  return (
    <Screen scroll={false} style={styles.screen}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 92 : 0}
      >
        <FlatList
          ref={listRef}
          data={rows}
          keyExtractor={(m) => m.id}
          contentContainerStyle={styles.list}
          onContentSizeChange={scrollToEnd}
          onLayout={scrollToEnd}
          ListHeaderComponent={
            <View style={styles.intro}>
              <View style={styles.introHead}>
                <View style={[styles.introMark, { backgroundColor: room.color }]} />
                <Text style={styles.introKind}>{KIND_LABEL[room.kind]}</Text>
              </View>
              <Text style={styles.introTitle}>{room.name}</Text>
              <Text style={styles.introBody}>{room.description}</Text>

              <View style={[styles.houseNote, { borderLeftColor: room.color }]}>
                <Text style={styles.houseLabel}>HOUSE RULE</Text>
                <Text style={styles.houseText}>{room.pinned}</Text>
              </View>

              <Pressable
                onPress={() => navigation.navigate('RoomInfo', { roomId })}
                accessibilityRole="button"
                accessibilityLabel="Room details and members"
                style={({ pressed }) => [styles.introLink, pressed && styles.pressed]}
              >
                <Text style={styles.introLinkLabel}>
                  {room.memberCount} members · {room.meeting}
                </Text>
                <Ionicons name="chevron-forward" size={13} color={palette.navy} />
              </Pressable>
            </View>
          }
          renderItem={({ item, index }) => {
            const prev = index > 0 ? rows[index - 1] : null;
            const newDay = !prev || dayLabel(prev.at) !== dayLabel(item.at);
            return (
              <View>
                {newDay ? (
                  <View style={styles.dayRow}>
                    <View style={styles.dayLine} />
                    <Text style={styles.day}>{dayLabel(item.at)}</Text>
                    <View style={styles.dayLine} />
                  </View>
                ) : null}
                <View style={[styles.bubbleRow, item.mine && styles.bubbleRowMine]}>
                  {!item.mine ? <Text style={styles.author}>{item.author}</Text> : null}
                  <View style={[styles.bubble, item.mine ? styles.bubbleMine : styles.bubbleOther]}>
                    <Text style={[styles.message, item.mine && styles.messageMine]}>{item.body}</Text>
                  </View>
                  <Text style={styles.clock}>{formatClock(item.at)}</Text>
                </View>
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyTitle}>No messages yet</Text>
              <Text style={styles.emptyBody}>
                Say hello — the first message in a room is always the hardest.
              </Text>
            </View>
          }
        />

        {joined ? (
          <View style={styles.composer}>
            <Pressable
              onPress={() => navigation.navigate('RoomInfo', { roomId })}
              accessibilityRole="button"
              accessibilityLabel="Room information"
              style={({ pressed }) => [styles.plus, pressed && styles.pressed]}
            >
              <Ionicons name="add" size={20} color={palette.navy} />
            </Pressable>
            <TextInput
              style={styles.input}
              placeholder={`Message ${room.name}`}
              placeholderTextColor={palette.muted}
              value={text}
              onChangeText={setText}
              onSubmitEditing={submit}
              returnKeyType="send"
              multiline
              accessibilityLabel={`Message ${room.name}`}
            />
            <Pressable
              onPress={submit}
              disabled={!text.trim()}
              accessibilityRole="button"
              accessibilityLabel="Send message"
              style={({ pressed }) => [
                styles.sendBtn,
                !text.trim() && styles.sendDisabled,
                pressed && styles.pressed,
              ]}
            >
              <Ionicons name="arrow-up" size={18} color={palette.white} />
            </Pressable>
          </View>
        ) : (
          <View style={styles.joinBar}>
            <View style={styles.joinText}>
              <Text style={styles.joinTitle}>You are not in this room</Text>
              <Text style={styles.joinBody}>Join to read along and take part.</Text>
            </View>
            <Pressable
              onPress={() => toggleJoin(roomId)}
              accessibilityRole="button"
              accessibilityLabel={`Join ${room.name}`}
              style={({ pressed }) => [styles.joinBtn, pressed && styles.pressed]}
            >
              <Text style={styles.joinLabel}>Join room</Text>
            </Pressable>
          </View>
        )}
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingHorizontal: 0, paddingBottom: 0 },
  flex: { flex: 1 },
  missing: {
    fontSize: typeScale.md,
    fontFamily: fonts.regular,
    color: palette.muted,
    textAlign: 'center',
    marginTop: spacing.xxxl,
  },
  headerBtn: { paddingRight: spacing.lg },

  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl },

  intro: {
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: palette.line,
    marginBottom: spacing.md,
  },
  introHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  introMark: { width: 22, height: 2, borderRadius: 1 },
  introKind: {
    fontSize: 9.5,
    fontFamily: fonts.semi,
    color: palette.muted,
    letterSpacing: 1.4,
    includeFontPadding: false,
  },
  introTitle: {
    fontSize: 30,
    fontFamily: fonts.serif,
    color: palette.ink,
    letterSpacing: -0.3,
    lineHeight: 33,
    marginTop: spacing.sm,
  },
  introBody: {
    fontSize: typeScale.md,
    fontFamily: fonts.regular,
    color: palette.muted,
    lineHeight: 22,
    marginTop: spacing.sm,
  },

  houseNote: { borderLeftWidth: 2, paddingLeft: spacing.md, marginTop: spacing.lg },
  houseLabel: {
    fontSize: 9,
    fontFamily: fonts.semi,
    color: palette.muted,
    letterSpacing: 1.2,
    marginBottom: 3,
    includeFontPadding: false,
  },
  houseText: { fontSize: typeScale.sm, fontFamily: fonts.medium, color: palette.ink, lineHeight: 19 },

  introLink: { flexDirection: 'row', alignItems: 'center', gap: 2, marginTop: spacing.lg },
  introLinkLabel: { fontSize: typeScale.xs, fontFamily: fonts.semi, color: palette.navy },

  dayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginVertical: spacing.lg,
    paddingHorizontal: spacing.xs,
  },
  dayLine: { flex: 1, height: 1, backgroundColor: palette.line },
  day: {
    fontSize: 9,
    fontFamily: fonts.semi,
    color: palette.muted,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    includeFontPadding: false,
  },

  bubbleRow: { alignItems: 'flex-start', marginBottom: spacing.md, maxWidth: '86%' },
  bubbleRowMine: { alignSelf: 'flex-end', alignItems: 'flex-end' },
  author: {
    fontSize: 9,
    fontFamily: fonts.semi,
    color: palette.muted,
    letterSpacing: 0.6,
    marginBottom: 4,
    marginLeft: 2,
  },
  bubble: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderRadius: 16 },
  bubbleOther: {
    backgroundColor: palette.paper,
    borderWidth: 1,
    borderColor: palette.line,
    borderTopLeftRadius: 4,
  },
  bubbleMine: { backgroundColor: palette.deep, borderTopRightRadius: 4 },
  message: { fontSize: typeScale.base, fontFamily: fonts.regular, color: palette.ink, lineHeight: 20 },
  messageMine: { color: palette.onDark },
  clock: { fontSize: 9, fontFamily: fonts.medium, color: palette.muted, marginTop: 4 },

  emptyWrap: { alignItems: 'center', paddingVertical: spacing.xxxl },
  emptyTitle: { fontSize: 22, fontFamily: fonts.serif, color: palette.ink, marginBottom: spacing.xs },
  emptyBody: {
    fontSize: typeScale.sm,
    fontFamily: fonts.regular,
    color: palette.muted,
    textAlign: 'center',
    maxWidth: 260,
    lineHeight: 20,
  },

  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    borderTopWidth: 1,
    borderTopColor: palette.line,
    backgroundColor: palette.canvas,
  },
  plus: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    backgroundColor: palette.paper,
    borderWidth: 1,
    borderColor: palette.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    maxHeight: 110,
    minHeight: 40,
    backgroundColor: palette.paper,
    borderWidth: 1,
    borderColor: palette.line,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    fontSize: typeScale.base,
    fontFamily: fonts.regular,
    color: palette.ink,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    backgroundColor: palette.deep,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendDisabled: { opacity: 0.3 },
  pressed: { opacity: 0.7 },

  joinBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: palette.line,
    backgroundColor: palette.canvas,
  },
  joinText: { flex: 1 },
  joinTitle: { fontSize: typeScale.base, fontFamily: fonts.semi, color: palette.ink },
  joinBody: { fontSize: typeScale.xs, fontFamily: fonts.regular, color: palette.muted, marginTop: 2 },
  joinBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.deep,
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
    borderRadius: radius.sm,
  },
  joinLabel: {
    fontSize: typeScale.sm,
    fontFamily: fonts.bold,
    color: palette.white,
    lineHeight: 16,
    includeFontPadding: false,
  },
});
