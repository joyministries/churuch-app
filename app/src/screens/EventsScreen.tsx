import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Screen, Section, Card, Chip } from '../components';
import { theme } from '../lib/theme';
import { api } from '../services/api';

const { palette, spacing, typeScale, radius, fonts } = theme;

export default function EventsScreen({ navigation }: any) {
  const [events, setEvents] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try { setEvents(await api<any[]>('/events?upcoming=1')); } catch {}
  };
  useEffect(() => { load(); }, []);

  return (
    <Screen scroll={false} style={styles.screen}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} colors={[palette.brandBlue]} />}>
        <Section title="Upcoming Events">
          {events.map((e) => (
            <Card key={e.id} style={styles.card} onPress={() => navigation.navigate('EventDetail', { id: e.id })}>
              <Text style={styles.title}>{e.title}</Text>
              <Text style={styles.meta}>{new Date(e.starts_at).toLocaleDateString()} · {new Date(e.starts_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
              {e.description ? <Text style={styles.desc} numberOfLines={2}>{e.description}</Text> : null}
              <View style={styles.row}>
                <Chip label={e.my_rsvp === 'yes' ? 'You are going' : e.my_rsvp === 'maybe' ? 'Maybe' : 'RSVP'} active={e.my_rsvp === 'yes'} />
                <Text style={styles.count}>{e.rsvp_count} going</Text>
              </View>
            </Card>
          ))}
          {events.length === 0 && <Text style={styles.empty}>No upcoming events.</Text>}
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
  title: { fontSize: typeScale.md, fontFamily: fonts.bold, color: palette.ink, marginBottom: spacing.xs },
  meta: { fontSize: typeScale.xs, color: palette.muted, marginBottom: spacing.sm },
  desc: { fontSize: typeScale.base, color: palette.muted, lineHeight: 22, marginBottom: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  count: { fontSize: typeScale.xs, color: palette.muted },
  empty: { color: palette.muted, fontSize: typeScale.sm, textAlign: 'center', marginTop: spacing.xl },
});