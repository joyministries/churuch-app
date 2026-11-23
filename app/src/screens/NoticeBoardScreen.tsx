import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Card, Chip, Button } from '../components';
import { theme } from '../lib/theme';
import { api } from '../services/api';

const { palette, spacing, typeScale, radius, fonts, shadow } = theme;

const FILTERS = ['all', 'notice', 'devotional', 'sermon', 'media'];

function label(t: string) {
  return t === 'all' ? 'Everything' : t.charAt(0).toUpperCase() + t.slice(1);
}

function when(value?: string) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

export default function NoticeBoardScreen() {
  const [items, setItems] = useState<any[]>([]);
  const [type, setType] = useState('all');
  const [refreshing, setRefreshing] = useState(false);
  const [open, setOpen] = useState<Record<string, boolean>>({});

  const load = async () => {
    try {
      const q = type === 'all' ? '/content' : `/content?type=${type}`;
      const rows = await api<any[]>(q);
      setItems(Array.isArray(rows) ? rows : []);
    } catch {
      setItems([]);
    }
  };

  useEffect(() => {
    load();
  }, [type]);

  const refresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const toggle = (id: string) => setOpen((prev) => ({ ...prev, [id]: !prev[id] }));

  return (
    <Screen scroll={false} style={styles.screen}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refresh} colors={[palette.brandBlue]} />
        }
      >
        <View style={styles.filters}>
          {FILTERS.map((f) => (
            <Chip key={f} label={label(f)} active={type === f} onPress={() => setType(f)} />
          ))}
        </View>

        {items.length > 0 ? (
          <Text style={styles.count}>
            {items.length} {items.length === 1 ? 'update' : 'updates'}
          </Text>
        ) : null}

        {items.map((n) => {
          const id = String(n.id);
          const expanded = !!open[id];
          const long = typeof n.body === 'string' && n.body.length > 160;
          return (
            <Card key={id} style={styles.card} onPress={long ? () => toggle(id) : undefined}>
              <View style={styles.tagRow}>
                <Text style={styles.tag}>{String(n.type ?? 'notice').toUpperCase()}</Text>
                {when(n.created_at) ? <Text style={styles.date}>{when(n.created_at)}</Text> : null}
              </View>

              <Text style={styles.title}>{n.title}</Text>

              {n.body ? (
                <Text style={styles.body} numberOfLines={expanded ? undefined : 3}>
                  {n.body}
                </Text>
              ) : null}

              {long ? (
                <Pressable
                  onPress={() => toggle(id)}
                  accessibilityRole="button"
                  accessibilityLabel={expanded ? 'Show less' : 'Read the full notice'}
                  style={styles.more}
                >
                  <Text style={styles.moreLabel}>{expanded ? 'Show less' : 'Read more'}</Text>
                  <Ionicons
                    name={expanded ? 'chevron-up' : 'chevron-down'}
                    size={14}
                    color={palette.navy}
                  />
                </Pressable>
              ) : null}
            </Card>
          );
        })}

        {items.length === 0 && (
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <Ionicons name="megaphone-outline" size={24} color={palette.navy} />
            </View>
            <Text style={styles.emptyTitle}>
              {type === 'all' ? 'The board is quiet' : `No ${label(type).toLowerCase()} yet`}
            </Text>
            <Text style={styles.emptyBody}>
              Notices from the church office land here. Pull down to check again, or browse another
              category above.
            </Text>
            <Button label="Check again" variant="ghost" size="sm" onPress={refresh} />
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: spacing.xxxxl },

  filters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  count: {
    fontSize: typeScale.xs,
    fontFamily: fonts.semi,
    color: palette.muted,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: spacing.md,
  },

  card: { padding: spacing.lg },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  tag: {
    fontSize: 10,
    fontFamily: fonts.bold,
    color: palette.navy,
    backgroundColor: palette.accentSoft,
    letterSpacing: 1.1,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.sm,
    overflow: 'hidden',
  },
  date: { fontSize: typeScale.xs, fontFamily: fonts.medium, color: palette.muted },
  title: {
    fontSize: 21,
    fontFamily: fonts.serif,
    color: palette.ink,
    letterSpacing: -0.2,
    lineHeight: 26,
    marginBottom: spacing.sm,
  },
  body: { fontSize: typeScale.md, fontFamily: fonts.regular, color: palette.muted, lineHeight: 23 },

  more: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.md,
    alignSelf: 'flex-start',
  },
  moreLabel: { fontSize: typeScale.sm, fontFamily: fonts.bold, color: palette.navy },

  empty: {
    alignItems: 'center',
    paddingVertical: spacing.xxxxl,
    paddingHorizontal: spacing.xl,
    marginTop: spacing.md,
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
  emptyTitle: {
    fontSize: 24,
    fontFamily: fonts.serif,
    color: palette.ink,
    letterSpacing: -0.2,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  emptyBody: {
    fontSize: typeScale.md,
    fontFamily: fonts.regular,
    color: palette.muted,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: spacing.lg,
    maxWidth: 280,
  },
});
