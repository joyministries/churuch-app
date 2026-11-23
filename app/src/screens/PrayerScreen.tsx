import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Pressable, TextInput } from 'react-native';
import { Screen, Section, Card, Button, Chip, Field } from '../components';
import { theme } from '../lib/theme';
import { api } from '../services/api';
import { Ionicons } from '@expo/vector-icons';

const { palette, spacing, typeScale, radius, fonts } = theme;

export default function PrayerScreen() {
  const [requests, setRequests] = useState<any[]>([]);
  const [text, setText] = useState('');
  const [posting, setPosting] = useState(false);
  const [filter, setFilter] = useState('All');
  const [refreshing, setRefreshing] = useState(false);

  const scrollRef = useRef<React.ComponentRef<typeof ScrollView>>(null);
  const inputRef = useRef<React.ComponentRef<typeof TextInput>>(null);

  const load = async () => {
    try { setRequests(await api<any[]>('/prayer')); } catch {}
  };
  useEffect(() => { load(); }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const submit = async () => {
    if (!text.trim()) return;
    setPosting(true);
    try {
      await api('/prayer', { method: 'POST', body: { text: text.trim() } });
      setText('');
      await load();
    } catch {} finally { setPosting(false); }
  };

  const pray = async (id: number) => {
    try { await api(`/prayer/${id}/pray`, { method: 'POST' }); await load(); } catch {}
  };

  const startRequest = () => {
    scrollRef.current?.scrollTo({ y: 0, animated: true });
    inputRef.current?.focus();
  };

  return (
    <Screen scroll={false} style={styles.screen}>
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[palette.brandBlue]} />}
      >
        <View style={styles.filters}>
          {['All', 'Healing', 'Family', 'Praise'].map((f) => (
            <Chip key={f} label={f} active={filter === f} onPress={() => setFilter(f)} />
          ))}
        </View>

        <Card style={styles.form}>
          <Text style={styles.formTitle}>Share a prayer request</Text>
          <Field
            inputRef={inputRef}
            placeholder="How can we pray for you?"
            value={text}
            onChangeText={setText}
            multiline
          />
          <Button label={posting ? 'Posting…' : 'Post Request'} onPress={submit} disabled={posting || !text.trim()} />
        </Card>

        <Section title="Prayer Wall">
          {requests.map((p) => (
            <Card key={p.id} style={styles.req}>
              <View style={styles.reqHead}>
                <Text style={styles.author}>{p.author_name ?? 'Anonymous'}</Text>
                <Text style={[styles.time, p.status === 'answered' && styles.timeAnswered]}>{p.status === 'answered' ? 'Answered' : p.status === 'prayed' ? 'Prayed for' : 'Open'}</Text>
              </View>
              <Text style={styles.reqText}>{p.text}</Text>
              <View style={styles.reqFoot}>
                <Text style={styles.prayCount}>{p.prayer_count ?? 0} praying</Text>
                <Button label={p.status === 'answered' ? 'Prayed for ✓' : 'I prayed'} variant={p.status === 'answered' ? 'ghost' : 'primary'} size="sm" onPress={() => pray(p.id)} />
              </View>
            </Card>
          ))}
          {requests.length === 0 && <Text style={styles.empty}>Be the first to share.</Text>}
        </Section>
      </ScrollView>

      <Pressable
        onPress={startRequest}
        style={styles.fab}
        accessibilityRole="button"
        accessibilityLabel="Write a new prayer request"
      >
        <Ionicons name="add" size={20} color={palette.white} />
        <Text style={styles.fabLabel}>New request</Text>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingHorizontal: 0, paddingBottom: 0 },
  content: { paddingHorizontal: spacing.xl, paddingBottom: 120 },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.lg },
  form: { padding: spacing.lg, marginBottom: spacing.xl },
  formTitle: { fontSize: typeScale.md, fontFamily: fonts.bold, color: palette.ink, marginBottom: spacing.md },
  req: { padding: spacing.lg, marginBottom: spacing.md },
  reqHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  author: { fontSize: typeScale.xs, fontFamily: fonts.bold, color: palette.ink },
  time: { fontSize: typeScale.xs, color: palette.muted },
  timeAnswered: { color: palette.brandBlue },
  reqText: { fontSize: typeScale.base, color: palette.muted, lineHeight: 22, marginBottom: spacing.md },
  reqFoot: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  prayCount: { fontSize: typeScale.xs, color: palette.muted },
  empty: { color: palette.muted, fontSize: typeScale.sm, textAlign: 'center', marginTop: spacing.xl },
  fab: {
    position: 'absolute',
    right: spacing.xl,
    bottom: spacing.xxl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    minHeight: 52,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.fab,
    backgroundColor: palette.navy,
    ...theme.shadow.lg,
  },
  fabLabel: { color: palette.white, fontFamily: fonts.bold, fontSize: typeScale.lg },
});
