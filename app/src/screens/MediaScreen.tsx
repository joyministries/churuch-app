import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Linking,
  Share,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Section } from '../components';
import { BrandLockup } from '../components/BrandMark';
import { VideoPlayer } from '../components/VideoPlayer';
import { SocialRow } from '../components/SocialRow';
import { theme } from '../lib/theme';
import { useJournalStore, useRecentsStore } from '../store';
import {
  sermons,
  featuredSermon,
  formatSermonDate,
  daysAgo,
  youtubeThumb,
  youtubeWatchUrl,
  type Sermon,
} from '../lib/media';
import { libraryIntro, resources, resourceRequestMailto, type Resource } from '../lib/resources';

const { palette, spacing, radius, typeScale, fonts } = theme;

function timeAgo(ts: number) {
  const mins = Math.max(0, Math.round((Date.now() - ts) / 60000));
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} h ago`;
  return `${Math.round(hours / 24)} d ago`;
}

export default function MediaScreen({ route }: any) {
  const [active, setActive] = useState<Sermon>(featuredSermon);
  const [draft, setDraft] = useState('');
  const [status, setStatus] = useState('');

  const scrollRef = useRef<React.ComponentRef<typeof ScrollView>>(null);
  const notesRef = useRef<React.ComponentRef<typeof TextInput>>(null);
  const notesY = useRef(0);

  const notes = useJournalStore((s) => s.notes);
  const savedAt = useJournalStore((s) => s.savedAt);
  const saveNote = useJournalStore((s) => s.saveNote);
  const removeNote = useJournalStore((s) => s.removeNote);
  const toggleSaved = useJournalStore((s) => s.toggleSaved);
  const journalled = useJournalStore((s) => s.saved);
  const recent = useRecentsStore((s) => s.recent);
  const pushRecent = useRecentsStore((s) => s.push);
  const clearRecent = useRecentsStore((s) => s.clear);

  useEffect(() => {
    setDraft(notes[active.id] ?? '');
    setStatus('');
  }, [active.id]);

  // Arriving from the journal: jump straight to the message that note belongs to.
  useEffect(() => {
    const id = route?.params?.sermonId;
    if (!id) return;
    const sermon = sermons.find((s) => s.id === id);
    if (!sermon) return;
    setActive(sermon);
    pushRecent({ id: sermon.id, title: sermon.title, speaker: sermon.speaker });
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  }, [route?.params?.sermonId]);

  const play = (sermon: Sermon, scrollTop = true) => {
    setActive(sermon);
    pushRecent({ id: sermon.id, title: sermon.title, speaker: sermon.speaker });
    if (scrollTop) scrollRef.current?.scrollTo({ y: 0, animated: true });
  };

  const hasNote = (notes[active.id] ?? '').trim().length > 0;
  const bookmarked = !!journalled[active.id];

  const flash = (message: string) => {
    setStatus(message);
    setTimeout(() => setStatus(''), 2600);
  };

  const save = () => {
    if (!draft.trim()) {
      flash('Write a line first — nothing to save yet.');
      return;
    }
    saveNote(active.id, draft);
    flash('Saved to your journal');
  };

  /** The bookmark saves the message itself for later — notes are separate. */
  const toggleJournal = () => {
    toggleSaved(active.id);
    flash(bookmarked ? 'Removed from your journal' : 'Saved — find it in your journal');
  };

  const share = () => {
    Share.share({
      message: `${active.title} — ${active.speaker}\n${youtubeWatchUrl(active.id)}`,
    }).catch(() => {});
  };

  const focusNotes = () => {
    scrollRef.current?.scrollTo({ y: Math.max(0, notesY.current - 80), animated: true });
    setTimeout(() => notesRef.current?.focus(), 280);
  };

  const openResource = (resource: Resource) => {
    const target = resource.url ?? resourceRequestMailto(resource.title);
    Linking.openURL(target).catch(() => setStatus(`Could not open ${resource.title}.`));
  };

  return (
    <Screen scroll={false} style={styles.screen}>
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.topLine}>
          <BrandLockup size={30} />
          <View style={styles.live}>
            <View style={styles.liveRule} />
            <Text style={styles.liveText}>SUNDAYS · 10:00</Text>
          </View>
        </View>

        <Text style={styles.title}>Sermons</Text>
        <Text style={styles.subtitle}>
          Every Sunday message from Joy Lambton, Germiston — watch it here, take notes, and carry it
          into the week.
        </Text>

        {/* Player + the message it is playing */}
        <View style={styles.playerCard}>
          <VideoPlayer videoId={active.id} rounded={0} />
          <View style={styles.playerMeta}>
            <View style={styles.metaTop}>
              <Text style={styles.metaKicker}>
                {active.id === featuredSermon.id ? 'LATEST MESSAGE' : 'NOW PLAYING'}
              </Text>
              <Text style={styles.metaDate}>{daysAgo(active.published)}</Text>
            </View>

            <Text style={styles.sermonTitle}>{active.title}</Text>
            <Text style={styles.sermonMeta}>
              {active.speaker} · {formatSermonDate(active.published)}
            </Text>

            <View style={styles.actions}>
              <Pressable
                onPress={focusNotes}
                accessibilityRole="button"
                accessibilityLabel="Go to sermon notes"
                style={({ pressed }) => [styles.action, pressed && styles.actionPressed]}
              >
                <Ionicons name="create-outline" size={15} color={palette.white} />
                <Text style={styles.actionLabel}>Notes</Text>
              </Pressable>
              <Pressable
                onPress={toggleJournal}
                accessibilityRole="button"
                accessibilityState={{ selected: bookmarked }}
                accessibilityLabel={bookmarked ? 'Remove this message from your journal' : 'Save this message to your journal for later'}
                style={({ pressed }) => [styles.action, pressed && styles.actionPressed]}
              >
                <Ionicons
                  name={bookmarked ? 'bookmark' : 'bookmark-outline'}
                  size={15}
                  color={bookmarked ? palette.brandBlue : palette.white}
                />
                <Text style={[styles.actionLabel, bookmarked && styles.actionLabelOn]}>
                  {bookmarked ? 'Saved' : 'Save'}
                </Text>
              </Pressable>
              <Pressable
                onPress={share}
                accessibilityRole="button"
                accessibilityLabel="Share this message"
                style={({ pressed }) => [styles.action, pressed && styles.actionPressed]}
              >
                <Ionicons name="share-outline" size={15} color={palette.white} />
                <Text style={styles.actionLabel}>Share</Text>
              </Pressable>
            </View>
          </View>
        </View>

        {/* Notes */}
        <View onLayout={(e) => (notesY.current = e.nativeEvent.layout.y)}>
          <Section
            title="Sermon notes"
            action={
              savedAt[active.id] ? (
                <Text style={styles.sectionNote}>Saved {timeAgo(savedAt[active.id])}</Text>
              ) : undefined
            }
          >
            <View style={styles.notesCard}>
              <TextInput
                ref={notesRef}
                style={styles.notesInput}
                placeholder="Write what stands out as you listen…"
                placeholderTextColor={palette.muted}
                value={draft}
                onChangeText={setDraft}
                multiline
                textAlignVertical="top"
                accessibilityLabel="Sermon notes"
              />
              <View style={styles.notesFoot}>
                <Text style={styles.notesHint}>
                  {status || (hasNote ? 'Note saved' : `${draft.trim().length} characters`)}
                </Text>
                <View style={styles.notesActions}>
                  {hasNote ? (
                    <Pressable
                      onPress={() => {
                        removeNote(active.id);
                        flash('Note removed');
                      }}
                      accessibilityRole="button"
                      accessibilityLabel="Remove this note"
                      style={({ pressed }) => [styles.removeBtn, pressed && styles.pressed]}
                    >
                      <Text style={styles.removeLabel}>Remove</Text>
                    </Pressable>
                  ) : null}
                  <Pressable
                    onPress={save}
                    accessibilityRole="button"
                    style={({ pressed }) => [styles.saveBtn, pressed && styles.pressed]}
                  >
                    <Text style={styles.saveLabel}>{hasNote ? 'Update note' : 'Save note'}</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          </Section>
        </View>

        {/* Downloads */}
        <Section title="Library" action={<Text style={styles.sectionNote}>Books & guides</Text>}>
          <Text style={styles.sectionIntro}>{libraryIntro}</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.libRow}
          >
            {resources.map((r) => (
              <Pressable
                key={r.id}
                onPress={() => openResource(r)}
                accessibilityRole="button"
                accessibilityLabel={
                  r.url ? `Download ${r.title}` : `Request ${r.title} from the office`
                }
                style={({ pressed }) => [styles.libCard, pressed && styles.pressed]}
              >
                <View style={styles.libIcon}>
                  <Ionicons name={r.icon} size={18} color={palette.navy} />
                </View>
                <Text style={styles.libKind}>{r.kind.toUpperCase()}</Text>
                <Text style={styles.libTitle} numberOfLines={2}>
                  {r.title}
                </Text>
                <View style={styles.libFoot}>
                  <Text style={styles.libFormat}>{r.url ? r.format : 'ON REQUEST'}</Text>
                  <Ionicons
                    name={r.url ? 'download-outline' : 'mail-outline'}
                    size={15}
                    color={palette.navy}
                  />
                </View>
              </Pressable>
            ))}
          </ScrollView>
        </Section>

        {/* Recents */}
        <Section
          title="Recently played"
          action={
            recent.length > 0 ? (
              <Pressable onPress={clearRecent} hitSlop={8} accessibilityRole="button">
                <Text style={styles.clear}>Clear</Text>
              </Pressable>
            ) : undefined
          }
        >
          {recent.length === 0 ? (
            <View style={styles.empty}>
              <Ionicons name="time-outline" size={18} color={palette.muted} />
              <Text style={styles.emptyText}>
                Nothing played yet. Pick a message from the archive and it will show up here.
              </Text>
            </View>
          ) : (
            <View style={styles.recentList}>
              {recent.map((r) => (
                <Pressable
                  key={r.id}
                  onPress={() => {
                    const sermon = sermons.find((s) => s.id === r.id);
                    if (sermon) play(sermon);
                  }}
                  accessibilityRole="button"
                  style={({ pressed }) => [styles.recentRow, pressed && styles.pressed]}
                >
                  <View style={styles.recentIcon}>
                    <Ionicons name="play" size={12} color={palette.navy} />
                  </View>
                  <View style={styles.recentText}>
                    <Text style={styles.recentTitle} numberOfLines={1}>
                      {r.title}
                    </Text>
                    <Text style={styles.recentMeta}>
                      {r.speaker} · {timeAgo(r.at)}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={palette.muted} />
                </Pressable>
              ))}
            </View>
          )}
        </Section>

        {/* Archive */}
        <Section title="Archive" action={<Text style={styles.sectionNote}>{sermons.length} messages</Text>}>
          {sermons.map((s) => {
            const isActive = s.id === active.id;
            return (
              <Pressable
                key={s.id}
                onPress={() => play(s)}
                accessibilityRole="button"
                accessibilityLabel={`Play ${s.title}`}
                style={({ pressed }) => [styles.row, pressed && styles.pressed]}
              >
                <View style={styles.thumb}>
                  <Image source={{ uri: youtubeThumb(s.id) }} style={styles.thumbImg} />
                  <View style={styles.thumbPlay}>
                    <Ionicons name="play" size={10} color={palette.white} />
                  </View>
                </View>

                <View style={styles.rowText}>
                  <Text style={[styles.rowTitle, isActive && styles.rowTitleActive]} numberOfLines={2}>
                    {s.title}
                  </Text>
                  <Text style={styles.rowMeta}>
                    {formatSermonDate(s.published)} · {s.speaker}
                  </Text>
                </View>

                {isActive ? (
                  <View style={styles.playing}>
                    <View style={styles.playingDot} />
                    <Text style={styles.playingText}>ON</Text>
                  </View>
                ) : (
                  <Ionicons name="chevron-forward" size={16} color={palette.muted} />
                )}
              </Pressable>
            );
          })}
        </Section>

        <Section title="Follow the church">
          <SocialRow onPressStatus={setStatus} />
        </Section>

        <Text style={styles.footerNote}>
          Messages are streamed from the church channel. Download the video inside the player for
          offline listening.
        </Text>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingHorizontal: 0, paddingBottom: 0 },
  content: { paddingHorizontal: spacing.xl, paddingBottom: 120 },

  topLine: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  eyebrow: { fontSize: typeScale.xs, fontFamily: fonts.semi, color: palette.muted, letterSpacing: 1.6 },
  live: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  liveRule: { width: 16, height: 1, backgroundColor: palette.line },
  liveText: {
    fontSize: 9.5,
    fontFamily: fonts.semi,
    color: palette.muted,
    letterSpacing: 1.3,
    includeFontPadding: false,
  },

  title: {
    fontSize: 42,
    fontFamily: fonts.serif,
    color: palette.ink,
    letterSpacing: -0.6,
    lineHeight: 46,
    marginTop: spacing.md,
  },
  subtitle: {
    fontSize: typeScale.md,
    fontFamily: fonts.regular,
    color: palette.muted,
    lineHeight: 22,
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
  },

  playerCard: {
    borderRadius: radius.card,
    overflow: 'hidden',
    backgroundColor: palette.deep,
    marginBottom: spacing.xxl,
  },
  playerMeta: { padding: spacing.lg },
  metaTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  metaKicker: { fontSize: 10, fontFamily: fonts.semi, color: palette.sky, letterSpacing: 1.4 },
  metaDate: { fontSize: typeScale.xs, fontFamily: fonts.medium, color: palette.onDarkMuted },
  sermonTitle: {
    fontSize: 26,
    fontFamily: fonts.serif,
    color: palette.onDark,
    lineHeight: 30,
    letterSpacing: -0.2,
    marginTop: spacing.sm,
  },
  sermonMeta: {
    fontSize: typeScale.sm,
    fontFamily: fonts.medium,
    color: palette.onDarkMuted,
    marginTop: spacing.sm,
  },

  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: palette.hairlineDark,
  },
  action: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: radius.sm,
    backgroundColor: palette.glassDark,
  },
  actionPressed: { opacity: 0.55 },
  actionLabel: { fontSize: typeScale.sm, fontFamily: fonts.semi, color: palette.white },
  actionLabelOn: { color: palette.sky },

  sectionNote: { fontSize: typeScale.xs, fontFamily: fonts.medium, color: palette.muted },
  sectionIntro: {
    fontSize: typeScale.sm,
    fontFamily: fonts.regular,
    color: palette.muted,
    lineHeight: 19,
    marginTop: -spacing.sm,
    marginBottom: spacing.lg,
  },

  notesCard: {
    backgroundColor: palette.paper,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: palette.line,
    padding: spacing.lg,
  },
  notesInput: {
    minHeight: 110,
    fontSize: typeScale.md,
    fontFamily: fonts.regular,
    color: palette.ink,
    lineHeight: 22,
  },
  notesFoot: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: palette.line,
    gap: spacing.md,
  },
  notesHint: { flex: 1, fontSize: typeScale.xs, fontFamily: fonts.regular, color: palette.muted },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: 9,
    borderRadius: radius.full,
    backgroundColor: palette.navy,
  },
  saveLabel: {
    fontSize: typeScale.sm,
    fontFamily: fonts.bold,
    color: palette.white,
    lineHeight: 16,
    includeFontPadding: false,
  },
  notesActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  removeBtn: { paddingHorizontal: spacing.sm, paddingVertical: 8 },
  removeLabel: { fontSize: typeScale.sm, fontFamily: fonts.semi, color: palette.danger },
  pressed: { opacity: 0.7 },

  libRow: { gap: spacing.md, paddingRight: spacing.xl },
  libCard: {
    width: 176,
    padding: spacing.lg,
    borderRadius: radius.card,
    backgroundColor: palette.paper,
    borderWidth: 1,
    borderColor: palette.line,
    gap: spacing.sm,
  },
  libIcon: {
    width: 34,
    height: 34,
    borderRadius: radius.sm,
    backgroundColor: palette.sand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  libKind: { fontSize: 9, fontFamily: fonts.bold, color: palette.muted, letterSpacing: 1.1 },
  libTitle: {
    fontSize: typeScale.md,
    fontFamily: fonts.semi,
    color: palette.ink,
    lineHeight: 19,
    minHeight: 38,
  },
  libFoot: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: palette.line,
  },
  libFormat: { fontSize: 10, fontFamily: fonts.bold, color: palette.navy, letterSpacing: 0.8 },

  empty: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: palette.paper,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: palette.line,
    padding: spacing.lg,
  },
  emptyText: {
    flex: 1,
    fontSize: typeScale.sm,
    fontFamily: fonts.regular,
    color: palette.muted,
    lineHeight: 19,
  },

  recentList: {
    backgroundColor: palette.paper,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: palette.line,
    paddingHorizontal: spacing.lg,
  },
  recentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: palette.line,
  },
  recentIcon: {
    width: 28,
    height: 28,
    borderRadius: radius.full,
    backgroundColor: palette.badgeBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recentText: { flex: 1 },
  recentTitle: { fontSize: typeScale.base, fontFamily: fonts.semi, color: palette.ink },
  recentMeta: { fontSize: typeScale.xs, fontFamily: fonts.regular, color: palette.muted, marginTop: 2 },

  clear: { fontSize: typeScale.xs, fontFamily: fonts.semi, color: palette.navy },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: palette.line,
  },
  thumb: {
    width: 64,
    height: 44,
    borderRadius: radius.sm,
    overflow: 'hidden',
    backgroundColor: palette.ink,
  },
  thumbImg: { width: '100%', height: '100%' },
  thumbPlay: {
    position: 'absolute',
    left: 5,
    bottom: 5,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: palette.overlayDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: { flex: 1 },
  rowTitle: { fontSize: typeScale.md, fontFamily: fonts.semi, color: palette.ink, lineHeight: 19 },
  rowTitleActive: { color: palette.navy },
  rowMeta: { fontSize: typeScale.xs, fontFamily: fonts.regular, color: palette.muted, marginTop: 3 },
  playing: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  playingDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: palette.brandBlue },
  playingText: { fontSize: 9, fontFamily: fonts.semi, color: palette.sky, letterSpacing: 1 },

  footerNote: {
    fontSize: typeScale.xs,
    fontFamily: fonts.regular,
    color: palette.muted,
    lineHeight: 18,
    marginTop: spacing.sm,
  },
});
