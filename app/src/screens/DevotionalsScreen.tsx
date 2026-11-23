import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Screen, Section, Card, Field, Button } from '../components';
import { theme } from '../lib/theme';
import { api } from '../services/api';
import { useJournalStore } from '../store';

const { palette, spacing, typeScale, radius, fonts } = theme;

export default function DevotionalsScreen() {
  const [items, setItems] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);
  const [note, setNote] = useState('');
  const [saved, setSaved] = useState(false);

  const savedNotes = useJournalStore((s) => s.notes);
  const saveToJournal = useJournalStore((s) => s.saveNote);

  const load = async () => {
    try { setItems(await api<any[]>('/content?type=devotional')); } catch {}
  };
  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (selected?.id) setNote(savedNotes[String(selected.id)] ?? selected.user_note ?? '');
    setSaved(false);
  }, [selected?.id]);

  const saveNote = () => {
    if (!selected) return;
    saveToJournal(selected.id, note);
    setSaved(true);
  };

  if (selected) {
    return (
      <Screen scroll>
        <Text style={styles.title}>{selected.title}</Text>
        {selected.body ? <Text style={styles.body}>{selected.body}</Text> : null}
        <Field label="Your notes" placeholder="Write a note…" value={note} onChangeText={setNote} multiline />
        <Button label="Save Notes" onPress={saveNote} />
        {saved ? <Text style={styles.saved}>Saved to your journal.</Text> : null}
      </Screen>
    );
  }

  return (
    <Screen scroll={false} style={styles.screen}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} refreshControl={<RefreshControl refreshing={false} onRefresh={load} colors={[palette.brandBlue]} />}>
        <Section title="Daily Devotionals">
          {items.map((d) => (
            <Card key={d.id} onPress={() => setSelected(d)}>
              <Text style={styles.itemTitle}>{d.title}</Text>
              {d.body ? <Text style={styles.itemBody} numberOfLines={3}>{d.body}</Text> : null}
            </Card>
          ))}
          {items.length === 0 && <Text style={styles.empty}>No devotionals yet.</Text>}
        </Section>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: spacing.xxxxl },
  title: { fontSize: typeScale.hero, fontFamily: fonts.extra, color: palette.ink, letterSpacing: -0.8, marginBottom: spacing.lg },
  body: { fontSize: typeScale.md, fontFamily: fonts.regular, color: palette.muted, lineHeight: 24, marginBottom: spacing.xl },
  itemTitle: { fontSize: typeScale.md, fontFamily: fonts.bold, color: palette.ink, marginBottom: spacing.xs },
  itemBody: { fontSize: typeScale.xs, fontFamily: fonts.regular, color: palette.muted, lineHeight: 20 },
  saved: { fontSize: typeScale.sm, fontFamily: fonts.medium, color: palette.navy, marginTop: spacing.md },
  empty: { color: palette.muted, fontSize: typeScale.sm, fontFamily: fonts.regular, textAlign: 'center', marginTop: spacing.xl },
});