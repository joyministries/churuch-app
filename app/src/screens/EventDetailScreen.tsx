import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Screen, Section, Card, Button, Chip } from '../components';
import { theme } from '../lib/theme';
import { api } from '../services/api';

const { palette, spacing, typeScale, radius, fonts } = theme;

export default function EventDetailScreen({ route, navigation }: any) {
  const eventId = route?.params?.id;
  const [event, setEvent] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    if (!eventId) return;
    try {
      const e = await api<any>(`/events/${eventId}`);
      const attendees = await api<any[]>(`/events/${eventId}/attendance`);
      setEvent({ ...e, attendees });
    } catch {}
  };
  useEffect(() => { load(); }, [eventId]);

  const handleRsvp = async (status: string) => {
    if (!eventId) return;
    try {
      await api(`/events/${eventId}/rsvp`, { method: 'POST', body: { status } });
      await load();
    } catch {}
  };

  if (!event) return null;

  return (
    <Screen scroll={false} style={styles.screen}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} colors={[palette.brandBlue]} />}>
        <Card style={styles.card}>
          <Text style={styles.title}>{event.title}</Text>
          <Text style={styles.meta}>{new Date(event.starts_at).toLocaleDateString()} · {new Date(event.starts_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
          {event.description ? <Text style={styles.desc}>{event.description}</Text> : null}
          <View style={styles.rsvpRow}>
            <Button label="Going" size="sm" variant={event.my_rsvp === 'yes' ? 'primary' : 'ghost'} onPress={() => handleRsvp('yes')} />
            <Button label="Maybe" size="sm" variant={event.my_rsvp === 'maybe' ? 'primary' : 'ghost'} onPress={() => handleRsvp('maybe')} />
            <Button label="Not going" size="sm" variant={event.my_rsvp === 'no' ? 'primary' : 'ghost'} onPress={() => handleRsvp('no')} />
          </View>
          <Text style={styles.count}>{event.rsvp_count} going</Text>
        </Card>

        {event.attendees && event.attendees.length > 0 && (
          <Section title="Attendees">
            {event.attendees.map((a: any) => (
              <Card key={a.id} style={styles.attendee}>
                <Text style={styles.attendeeName}>{a.name}</Text>
                <Text style={styles.attendeeTime}>{new Date(a.checked_in_at).toLocaleTimeString()}</Text>
              </Card>
            ))}
          </Section>
        )}

        <Section title="Check in">
          <Button label="Check in now" variant="secondary" onPress={() => navigation.navigate('CheckIn', { eventId })} />
        </Section>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: spacing.xxxxl },
  card: { padding: spacing.lg, marginBottom: spacing.xl },
  title: { fontSize: typeScale.title, fontFamily: fonts.extra, color: palette.ink, marginBottom: spacing.xs },
  meta: { fontSize: typeScale.xs, color: palette.muted, marginBottom: spacing.lg },
  desc: { fontSize: typeScale.base, color: palette.muted, lineHeight: 22, marginBottom: spacing.lg },
  rsvpRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  count: { fontSize: typeScale.xs, color: palette.muted },
  attendee: { padding: spacing.lg, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  attendeeName: { fontSize: typeScale.base, fontFamily: fonts.bold, color: palette.ink },
  attendeeTime: { fontSize: typeScale.xs, color: palette.muted },
});