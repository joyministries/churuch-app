import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Pressable } from 'react-native';
import { Screen, Section, Card, Field, Button } from '../components';
import { theme } from '../lib/theme';
import { api } from '../services/api';
import { useAuthStore } from '../store';

const { palette, spacing, typeScale, radius, fonts } = theme;

export default function AdminScreen() {
  const isAdmin = useAuthStore((s) => s.user?.role === 'admin');
  const [users, setUsers] = useState<any[]>([]);
  const [campuses, setCampuses] = useState<any[]>([]);
  const [audit, setAudit] = useState<any[]>([]);
  const [tab, setTab] = useState<'users' | 'campuses' | 'audit'>('users');
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const [u, c, a] = await Promise.all([
        api<any[]>('/admin/users'),
        api<any[]>('/admin/campuses'),
        api<any[]>('/admin/audit'),
      ]);
      setUsers(u);
      setCampuses(c);
      setAudit(a);
    } catch {}
  };
  useEffect(() => { load(); }, []);

  if (!isAdmin) {
    return (
      <Screen scroll>
        <Card style={styles.locked}>
          <Text style={styles.lockedTitle}>Admin only</Text>
          <Text style={styles.lockedText}>This section requires admin permissions.</Text>
        </Card>
      </Screen>
    );
  }

  const tabs: { key: 'users' | 'campuses' | 'audit'; label: string; count: number }[] = [
    { key: 'users', label: 'Users', count: users.length },
    { key: 'campuses', label: 'Campuses', count: campuses.length },
    { key: 'audit', label: 'Audit Log', count: audit.length },
  ];

  return (
    <Screen scroll={false} style={styles.screen}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} colors={[palette.brandBlue]} />}>
        <View style={styles.tabs}>
          {tabs.map((t) => (
            <Pressable key={t.key} onPress={() => setTab(t.key)} style={[styles.tab, tab === t.key && styles.tabActive]}>
              <Text style={[styles.tabLabel, tab === t.key && styles.tabLabelActive]}>{t.label}</Text>
              <Text style={[styles.tabCount, tab === t.key && styles.tabCountActive]}>{t.count}</Text>
            </Pressable>
          ))}
        </View>

        {tab === 'users' && (
          <Section title="Users">
            {users.map((u) => (
              <Card key={u.id} style={styles.row}>
                <View>
                  <Text style={styles.rowName}>{u.name}</Text>
                  <Text style={styles.rowMeta}>{u.email ?? u.phone} · {u.role}</Text>
                </View>
                <Text style={[styles.rowRole, u.role === 'admin' && styles.rowRoleAdmin]}>{u.role}</Text>
              </Card>
            ))}
          </Section>
        )}

        {tab === 'campuses' && (
          <Section title="Campuses">
            {campuses.map((c) => (
              <Card key={c.id} style={styles.row}>
                <Text style={styles.rowName}>{c.name}</Text>
              </Card>
            ))}
          </Section>
        )}

        {tab === 'audit' && (
          <Section title="Audit Log">
            {audit.map((a) => (
              <Card key={a.id} style={styles.auditRow}>
                <Text style={styles.auditAction}>{a.action}</Text>
                <Text style={styles.auditMeta}>{a.target ?? ''} · {new Date(a.created_at).toLocaleString()}</Text>
              </Card>
            ))}
          </Section>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: spacing.xxxxl },
  locked: { padding: spacing.xl, alignItems: 'center' },
  lockedTitle: { fontSize: typeScale.md, fontFamily: fonts.bold, color: palette.ink, marginBottom: spacing.xs },
  lockedText: { color: palette.muted },
  tabs: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg, paddingHorizontal: spacing.xl },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, paddingVertical: spacing.md, borderRadius: radius.card, backgroundColor: palette.paper, borderWidth: 1, borderColor: palette.line },
  tabActive: { backgroundColor: palette.navy, borderColor: palette.navy },
  tabLabel: { fontSize: typeScale.xs, fontFamily: fonts.semi, color: palette.ink },
  tabLabelActive: { color: palette.white },
  tabCount: { fontSize: typeScale.xs, fontFamily: fonts.semi, color: palette.muted, backgroundColor: palette.badgeBg, paddingHorizontal: 6, paddingVertical: 2, borderRadius: radius.sm },
  tabCountActive: { backgroundColor: 'rgba(255,255,255,0.2)', color: palette.white },
  row: { padding: spacing.lg, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  rowName: { fontSize: typeScale.base, fontFamily: fonts.bold, color: palette.ink },
  rowMeta: { fontSize: typeScale.xs, color: palette.muted, marginTop: 2 },
  rowRole: { fontSize: typeScale.xs, fontFamily: fonts.semi, color: palette.navy, backgroundColor: palette.badgeBg, paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.sm },
  rowRoleAdmin: { backgroundColor: palette.brandBlue, color: palette.ink },
  auditRow: { padding: spacing.lg, marginBottom: spacing.md },
  auditAction: { fontSize: typeScale.xs, fontFamily: fonts.bold, color: palette.ink, marginBottom: 2 },
  auditMeta: { fontSize: typeScale.xs, color: palette.muted },
});