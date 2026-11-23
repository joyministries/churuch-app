import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Screen, Section, Card, Button } from '../components';
import { theme } from '../lib/theme';
import { api } from '../services/api';

const { palette, spacing, typeScale, radius, fonts } = theme;

export default function GrowthScreen() {
  const [tracks, setTracks] = useState<any[]>([]);
  const [progress, setProgress] = useState<any[]>([]);

  const load = async () => {
    try {
      const [t, p] = await Promise.all([
        api<any[]>('/growth/tracks'),
        api<any[]>('/growth/me'),
      ]);
      setTracks(t);
      setProgress(p);
    } catch {}
  };
  useEffect(() => { load(); }, []);

  const enroll = async (id: number) => {
    try { await api('/growth/me', { method: 'POST', body: { track_id: id } }); await load(); } catch {}
  };

  const advance = async (id: number) => {
    try { await api('/growth/me/step', { method: 'POST', body: { track_id: id } }); await load(); } catch {}
  };

  return (
    <Screen scroll={false} style={styles.screen}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} refreshControl={<RefreshControl refreshing={false} onRefresh={load} colors={[palette.brandBlue]} />}>
        <Section title="Growth Tracks">
          {tracks.map((t) => {
            const prog = progress.find((p) => p.track_id === t.id);
            const enrolled = !!prog;
            const steps: string[] = t.steps ?? [];
            const idx = prog?.step_index ?? 0;
            return (
              <Card key={t.id} style={styles.card}>
                <Text style={styles.title}>{t.name}</Text>
                <View style={styles.steps}>
                  {steps.map((s: string, i: number) => {
                    const done = enrolled && i < idx;
                    const current = enrolled && i === idx;
                    return (
                      <View key={i} style={styles.stepRow}>
                        <View style={[styles.dot, done && styles.dotDone, current && styles.dotCurrent]} />
                        <Text style={[styles.stepText, done && styles.stepDone]}>{s}</Text>
                      </View>
                    );
                  })}
                </View>
                {!enrolled ? (
                  <Button label="Enroll" size="sm" onPress={() => enroll(t.id)} />
                ) : prog?.completed ? (
                  <Text style={styles.done}>Track complete</Text>
                ) : (
                  <Button label="Advance" size="sm" onPress={() => advance(t.id)} />
                )}
              </Card>
            );
          })}
        </Section>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: spacing.xxxxl },
  card: { padding: spacing.lg, marginBottom: spacing.md },
  title: { fontSize: typeScale.md, fontFamily: fonts.bold, color: palette.ink, marginBottom: spacing.md },
  steps: { marginBottom: spacing.md },
  stepRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  dot: { width: 18, height: 18, borderRadius: 9, borderWidth: 1.5, borderColor: palette.line, marginRight: 10, backgroundColor: palette.paper },
  dotDone: { backgroundColor: palette.brandBlue, borderColor: palette.brandBlue },
  dotCurrent: { backgroundColor: palette.navy, borderColor: palette.navy },
  stepText: { fontSize: typeScale.xs, color: palette.muted, flex: 1 },
  stepDone: { color: palette.ink, fontWeight: '600' },
  done: { color: palette.brandBlue, fontSize: typeScale.xs, fontWeight: '700' },
});