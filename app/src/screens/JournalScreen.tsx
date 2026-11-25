import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Card, Button, Chip } from '../components';
import { theme } from '../lib/theme';
import { sermonById } from '../lib/media';
import { useJournalStore } from '../store';

const { palette, spacing, radius, typeScale, fonts, shadow } = theme;

type Tab = 'saved' | 'notes';

function savedLabel(at?: number) {
  if (!at) return 'Saved';
  const diff = Date.now() - at;
  const mins = Math.round(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

function dateLine(iso?: string) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function JournalScreen({ navigation, route }: any) {
  const notes = useJournalStore((s) => s.notes);
  const savedAt = useJournalStore((s) => s.savedAt);
  const bookmarks = useJournalStore((s) => s.saved);
  const removeNote = useJournalStore((s) => s.removeNote);
  const toggleSaved = useJournalStore((s) => s.toggleSaved);

  const [tab, setTab] = useState<Tab>(route?.params?.filter === 'notes' ? 'notes' : 'saved');

  const savedEntries = useMemo(
    () =>
      Object.keys(bookmarks)
        .sort((a, b) => bookmarks[b] - bookmarks[a])
        .map((id) => ({ id, at: bookmarks[id], sermon: sermonById(id), note: notes[id] })),
    [bookmarks, notes]
  );

  const noteEntries = useMemo(
    () =>
      Object.entries(notes)
        .filter(([, body]) => body && body.trim().length > 0)
        .sort((a, b) => (savedAt[b[0]] ?? 0) - (savedAt[a[0]] ?? 0))
        .map(([id, body]) => ({ id, body, at: savedAt[id], sermon: sermonById(id) })),
    [notes, savedAt]
  );

  const openMessage = (id: string) => navigation.navigate('Media', { sermonId: id });

  return (
    <Screen scroll={false} style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.kicker}>YOUR JOURNAL</Text>
        <Text style={styles.title}>Journal</Text>
        <Text style={styles.subtitle}>
          Save a message to come back to later, and keep the notes you wrote while you listened.
        </Text>

        <View style={styles.tabs}>
          <Chip label={`Saved (${savedEntries.length})`} active={tab === 'saved'} onPress={() => setTab('saved')} />
          <Chip label={`Notes (${noteEntries.length})`} active={tab === 'notes'} onPress={() => setTab('notes')} />
        </View>

        {tab === 'saved' ? (
          savedEntries.length === 0 ? (
            <View style={styles.empty}>
              <View style={styles.emptyIcon}>
                <Ionicons name="bookmark-outline" size={24} color={palette.navy} />
              </View>
              <Text style={styles.emptyTitle}>Nothing saved yet</Text>
              <Text style={styles.emptyBody}>
                While a sermon plays, tap Journal. The message is kept here so you can pick it up
                again whenever you want.
              </Text>
              <Button label="Browse sermons" onPress={() => navigation.navigate('Media')} />
            </View>
          ) : (
            savedEntries.map(({ id, at, sermon, note }) => (
              <Card key={id} style={styles.card} onPress={() => openMessage(id)}>
                <View style={styles.cardTop}>
                  <Text style={styles.cardKicker}>SAVED MESSAGE</Text>
                  <Text style={styles.cardDate}>{savedLabel(at)}</Text>
                </View>

                <Text style={styles.cardTitle}>{sermon?.title ?? 'Sermon'}</Text>
                <Text style={styles.cardMeta}>
                  {sermon ? `${sermon.speaker} · ${dateLine(sermon.published)}` : 'From the archive'}
                </Text>

                {note && note.trim() ? (
                  <View style={styles.noteBlock}>
                    <Text style={styles.noteLabel}>YOUR NOTE</Text>
                    <Text style={styles.noteBody} numberOfLines={3}>
                      {note}
                    </Text>
                  </View>
                ) : null}

                <View style={styles.cardFoot}>
                  <Pressable
                    onPress={() => openMessage(id)}
                    accessibilityRole="button"
                    accessibilityLabel={`Open ${sermon?.title ?? 'message'}`}
                    style={({ pressed }) => [styles.footBtn, pressed && styles.pressed]}
                  >
                    <Ionicons name="play-circle-outline" size={15} color={palette.navy} />
                    <Text style={styles.footLabel}>Open message</Text>
                  </Pressable>

                  <Pressable
                    onPress={() => toggleSaved(id)}
                    accessibilityRole="button"
                    accessibilityLabel="Remove this message from your journal"
                    style={({ pressed }) => [styles.footBtn, pressed && styles.pressed]}
                  >
                    <Ionicons name="trash-outline" size={14} color={palette.danger} />
                    <Text style={styles.removeLabel}>Remove</Text>
                  </Pressable>
                </View>
              </Card>
            ))
          )
        ) : noteEntries.length === 0 ? (
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <Ionicons name="create-outline" size={24} color={palette.navy} />
            </View>
            <Text style={styles.emptyTitle}>No notes yet</Text>
            <Text style={styles.emptyBody}>
              Open a sermon and write what stands out. Your notes collect here, separate from the
              messages you save.
            </Text>
            <Button label="Browse sermons" onPress={() => navigation.navigate('Media')} />
          </View>
        ) : (
          noteEntries.map(({ id, body, at, sermon }) => {
            const isSaved = !!bookmarks[id];
            return (
              <Card key={id} style={styles.card} onPress={sermon ? () => openMessage(id) : undefined}>
                <View style={styles.cardTop}>
                  <Text style={styles.cardKicker}>NOTE</Text>
                  <Text style={styles.cardDate}>{savedLabel(at)}</Text>
                </View>

                <Text style={styles.cardTitle}>{sermon?.title ?? 'Sermon note'}</Text>
                {sermon ? (
                  <Text style={styles.cardMeta}>
                    {sermon.speaker} · {dateLine(sermon.published)}
                  </Text>
                ) : null}

                <Text style={styles.cardBody} numberOfLines={4}>
                  {body}
                </Text>

                <View style={styles.cardFoot}>
                  <View style={styles.footLeft}>
                    {sermon ? (
                      <Pressable
                        onPress={() => openMessage(id)}
                        accessibilityRole="button"
                        accessibilityLabel={`Open ${sermon.title}`}
                        style={({ pressed }) => [styles.footBtn, pressed && styles.pressed]}
                      >
                        <Ionicons name="play-circle-outline" size={15} color={palette.navy} />
                        <Text style={styles.footLabel}>Open message</Text>
                      </Pressable>
                    ) : null}

                    {!isSaved ? (
                      <Pressable
                        onPress={() => toggleSaved(id)}
                        accessibilityRole="button"
                        accessibilityLabel="Save this message in your journal"
                        style={({ pressed }) => [styles.footBtn, pressed && styles.pressed]}
                      >
                        <Ionicons name="bookmark-outline" size={14} color={palette.navy} />
                        <Text style={styles.footLabel}>Save for later</Text>
                      </Pressable>
                    ) : (
                      <View style={styles.footBtn}>
                        <Ionicons name="bookmark" size={14} color={palette.brandBlue} />
                        <Text style={styles.footLabel}>In your journal</Text>
                      </View>
                    )}
                  </View>

                  <Pressable
                    onPress={() => removeNote(id)}
                    accessibilityRole="button"
                    accessibilityLabel="Delete this note"
                    style={({ pressed }) => [styles.footBtn, pressed && styles.pressed]}
                  >
                    <Ionicons name="trash-outline" size={14} color={palette.danger} />
                    <Text style={styles.removeLabel}>Delete</Text>
                  </Pressable>
                </View>
              </Card>
            );
          })
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingHorizontal: 0, paddingBottom: 0 },
  content: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xxxxl },

  kicker: {
    fontSize: typeScale.xs,
    fontFamily: fonts.semi,
    color: palette.muted,
    letterSpacing: 1.6,
    marginTop: spacing.sm,
  },
  title: {
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
    marginBottom: spacing.lg,
  },

  tabs: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },

  card: { marginBottom: spacing.md },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardKicker: { fontSize: 9, fontFamily: fonts.bold, color: palette.brandBlue, letterSpacing: 1.2 },
  cardDate: { fontSize: typeScale.xs, fontFamily: fonts.medium, color: palette.muted },
  cardTitle: {
    fontSize: 22,
    fontFamily: fonts.heading,
    color: palette.ink,
    letterSpacing: -0.2,
    lineHeight: 27,
    marginTop: spacing.sm,
  },
  cardMeta: { fontSize: typeScale.xs, fontFamily: fonts.medium, color: palette.muted, marginTop: 3 },
  cardBody: {
    fontSize: typeScale.base,
    fontFamily: fonts.regular,
    color: palette.ink,
    lineHeight: 21,
    marginTop: spacing.md,
  },

  noteBlock: {
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: radius.sm,
    backgroundColor: palette.canvas,
    borderWidth: 1,
    borderColor: palette.line,
  },
  noteLabel: { fontSize: 9, fontFamily: fonts.bold, color: palette.muted, letterSpacing: 1.1 },
  noteBody: {
    fontSize: typeScale.sm,
    fontFamily: fonts.regular,
    color: palette.ink,
    lineHeight: 20,
    marginTop: 3,
  },

  cardFoot: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: palette.line,
  },
  footLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, flexShrink: 1 },
  footBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  footLabel: { fontSize: typeScale.xs, fontFamily: fonts.bold, color: palette.navy },
  removeLabel: { fontSize: typeScale.xs, fontFamily: fonts.semi, color: palette.danger },
  pressed: { opacity: 0.6 },

  empty: {
    alignItems: 'center',
    paddingVertical: spacing.xxxxl,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: palette.line,
    backgroundColor: palette.paper,
    ...shadow.sm,
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
    marginBottom: spacing.lg,
  },
});
