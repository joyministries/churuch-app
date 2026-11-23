import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Pressable,
  TextInput,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Card, Button } from '../components';
import { theme } from '../lib/theme';
import { api } from '../services/api';
import { brand } from '../lib/brand';

const { palette, spacing, typeScale, radius, fonts } = theme;

type GivingFund = {
  id: number;
  name: string;
  slug: string;
  blurb?: string | null;
  kind?: string;
  goal_amount?: string | null;
};

/** Used only until the office's list arrives, or when the phone is offline. */
const DEFAULT_FUNDS: GivingFund[] = [
  { id: 0, name: 'Tithe', slug: 'tithe' },
  { id: 0, name: 'Offering', slug: 'offering' },
  { id: 0, name: 'Missions', slug: 'missions' },
  { id: 0, name: 'Building', slug: 'building' },
];

function money(digits: string) {
  const n = Number(digits);
  if (!n) return '0';
  return n.toLocaleString('en-ZA').replace(/,/g, ' ');
}

export default function GivingScreen() {
  const [history, setHistory] = useState<any[]>([]);
  const [funds, setFunds] = useState<GivingFund[]>(DEFAULT_FUNDS);
  const [amount, setAmount] = useState('');
  const [fund, setFund] = useState('tithe');
  const [reference, setReference] = useState('');
  const [recurring, setRecurring] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      setHistory(await api<any[]>('/giving'));
    } catch {}

    try {
      // The office controls this list, so a new drive shows up without a release.
      const list = await api<GivingFund[]>('/giving/funds');
      if (Array.isArray(list) && list.length) {
        setFunds(list);
        setFund((current) => (list.some((f) => f.slug === current) ? current : list[0].slug));
      }
    } catch {}
  };

  useEffect(() => {
    load();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const fundLabel = funds.find((f) => f.slug === fund)?.name ?? 'Tithe';
  const fundName = (slug?: string) =>
    funds.find((f) => f.slug === slug)?.name ?? (slug ? slug.replace(/-/g, ' ') : 'Gift');

  const submit = async () => {
    const value = Number(amount);
    if (!value || value <= 0) {
      setStatus('Enter an amount to continue.');
      return;
    }
    setSubmitting(true);
    setStatus('');
    try {
      // PayFast hosts the card form; the API signs the fields and returns a URL.
      const res = await api<{ reference: string; checkout_url: string }>('/giving/payfast', {
        method: 'POST',
        body: {
          amount: value,
          fund,
          reference: reference || undefined,
        },
      });
      setAmount('');
      setReference('');
      setStatus(`Opening PayFast — reference ${res.reference}.`);
      await Linking.openURL(res.checkout_url);
      await load();
    } catch (err: any) {
      setStatus(err?.message?.includes('{') ? 'Could not start the payment. Please try again.' : String(err?.message ?? 'Could not start the payment.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen scroll={false} style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[palette.brandBlue]} />
        }
      >
        <Text style={styles.eyebrow}>GIVE WITH JOY</Text>
        <Text style={styles.title}>Tithe &amp; offering</Text>
        <Text style={styles.subtitle}>
          Every gift fuels the work in {brand.location} and beyond. Give any amount — securely, in
          seconds.
        </Text>

        {/* Fund */}
        <Text style={styles.sectionLabel}>FUND</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.fundRow}
        >
          {funds.map((f) => {
            const active = fund === f.slug;
            return (
              <Pressable
                key={f.slug}
                onPress={() => setFund(f.slug)}
                accessibilityRole="button"
                accessibilityLabel={f.name}
                accessibilityHint={f.blurb ?? undefined}
                accessibilityState={{ selected: active }}
                style={({ pressed }) => [
                  styles.fundBtn,
                  active && styles.fundActive,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={[styles.fundLabel, active && styles.fundLabelActive]}>{f.name}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Amount — free entry, no preset chips */}
        <View style={styles.amountCard}>
          <Text style={styles.amountLabel}>AMOUNT</Text>

          <View style={styles.amountRow}>
            <Text style={styles.currency}>R</Text>
            <TextInput
              style={styles.amountInput}
              value={amount}
              onChangeText={(t) => setAmount(t.replace(/[^0-9]/g, '').slice(0, 9))}
              placeholder="0"
              placeholderTextColor={palette.onDarkMuted}
              keyboardType="number-pad"
              maxLength={9}
              accessibilityLabel="Gift amount in rand"
            />
          </View>

          <View style={styles.amountRule} />

          <Text style={styles.amountHint}>
            {amount ? `${fundLabel} · R ${money(amount)}` : 'Type the amount you want to give'}
          </Text>
        </View>

        {/* Pay with */}
        <Text style={styles.sectionLabel}>PAY WITH</Text>
        <Card style={styles.method}>
          <View style={styles.methodIcon}>
            <Ionicons name="shield-checkmark-outline" size={20} color={palette.navy} />
          </View>
          <View style={styles.methodInfo}>
            <Text style={styles.methodTitle}>PayFast</Text>
            <Text style={styles.methodDetail}>Card · Instant EFT · Scan to Pay</Text>
          </View>
          <Ionicons name="lock-closed-outline" size={15} color={palette.muted} />
        </Card>

        <Card style={styles.recurringCard}>
          <View style={styles.recurringLeft}>
            <Text style={styles.recurringTitle}>Make this recurring</Text>
            <Text style={styles.recurringDetail}>Monthly, on the day you choose</Text>
          </View>
          <Pressable
            onPress={() => setRecurring(!recurring)}
            style={[styles.toggleTrack, recurring && styles.toggleTrackOn]}
            accessibilityRole="switch"
            accessibilityState={{ checked: recurring }}
            accessibilityLabel="Make this recurring"
          >
            <View style={[styles.toggleThumb, recurring && styles.toggleThumbOn]} />
          </Pressable>
        </Card>

        <Button
          label={submitting ? 'Processing…' : `Give R ${money(amount)}`}
          onPress={submit}
          disabled={submitting || !Number(amount)}
        />

        {status ? <Text style={styles.status}>{status}</Text> : null}

        {history.length > 0 && (
          <View style={styles.history}>
            <Text style={styles.sectionLabel}>YOUR GIVING</Text>
            <View style={styles.historyCard}>
              {history.slice(0, 6).map((g, i) => (
                <View
                  key={String(g.id ?? i)}
                  style={[styles.historyRow, i === 0 && styles.historyRowFirst]}
                >
                  <View style={styles.historyIcon}>
                    <Ionicons name="arrow-up" size={14} color={palette.positive} />
                  </View>
                  <View style={styles.historyText}>
                    <Text style={styles.historyTitle}>{fundName(g.fund)}</Text>
                    <Text style={styles.historyMeta}>
                      {g.status ?? 'pending'}
                      {g.created_at ? ` · ${String(g.created_at).slice(0, 10)}` : ''}
                    </Text>
                  </View>
                  <Text style={styles.historyAmount}>R {money(String(g.amount ?? ''))}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <Text style={styles.footer}>
          Gifts are processed securely by PayFast. Joy Ministries never sees or stores your card
          details.
        </Text>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingHorizontal: 0, paddingBottom: 0 },
  content: { paddingHorizontal: spacing.xl, paddingBottom: 120 },

  eyebrow: { fontSize: typeScale.xs, fontFamily: fonts.semi, color: palette.muted, letterSpacing: 1.6 },
  title: {
    fontSize: 42,
    fontFamily: fonts.serif,
    color: palette.ink,
    letterSpacing: -0.6,
    lineHeight: 46,
    marginTop: spacing.sm,
  },
  subtitle: {
    fontSize: typeScale.md,
    fontFamily: fonts.regular,
    color: palette.muted,
    lineHeight: 22,
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
  },

  sectionLabel: {
    fontSize: 10,
    fontFamily: fonts.bold,
    color: palette.muted,
    letterSpacing: 1.4,
    marginBottom: spacing.sm,
  },

  fundRow: { gap: spacing.sm, paddingRight: spacing.xl, marginBottom: spacing.xl },
  fundBtn: {
    minHeight: 38,
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    borderRadius: radius.full,
    backgroundColor: palette.paper,
    borderWidth: 1,
    borderColor: palette.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fundActive: { backgroundColor: palette.navy, borderColor: palette.navy },
  fundLabel: {
    fontSize: typeScale.base,
    fontFamily: fonts.semi,
    color: palette.ink,
    lineHeight: 17,
    includeFontPadding: false,
  },
  fundLabelActive: { color: palette.white },
  pressed: { opacity: 0.7 },

  amountCard: {
    backgroundColor: palette.deep,
    borderRadius: radius.card,
    padding: spacing.xl,
    marginBottom: spacing.xl,
  },
  amountLabel: { fontSize: 10, fontFamily: fonts.semi, color: palette.sky, letterSpacing: 1.4 },
  amountRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.sm },
  currency: { fontSize: 26, fontFamily: fonts.bold, color: palette.onDarkMuted },
  amountInput: {
    flex: 1,
    fontSize: typeScale.amount,
    fontFamily: fonts.extra,
    color: palette.onDark,
    letterSpacing: -1.5,
    padding: 0,
  },
  amountRule: { height: 1, backgroundColor: palette.hairlineDark, marginTop: spacing.sm },
  amountHint: {
    fontSize: typeScale.sm,
    fontFamily: fonts.medium,
    color: palette.onDarkMuted,
    marginTop: spacing.md,
  },

  method: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  methodIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    backgroundColor: palette.badgeBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  methodInfo: { flex: 1 },
  methodTitle: { fontSize: typeScale.base, fontFamily: fonts.bold, color: palette.ink },
  methodDetail: { fontSize: typeScale.xs, fontFamily: fonts.regular, color: palette.muted, marginTop: 2 },

  recurringCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  recurringLeft: { flex: 1 },
  recurringTitle: { fontSize: typeScale.base, fontFamily: fonts.bold, color: palette.ink },
  recurringDetail: { fontSize: typeScale.xs, fontFamily: fonts.regular, color: palette.muted, marginTop: 2 },
  toggleTrack: {
    width: 46,
    height: 28,
    borderRadius: 14,
    backgroundColor: palette.toggleOff,
    justifyContent: 'center',
  },
  toggleTrackOn: { backgroundColor: palette.navy },
  toggleThumb: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: palette.white,
    marginLeft: 3,
  },
  toggleThumbOn: { marginLeft: 21 },

  status: {
    fontSize: typeScale.sm,
    fontFamily: fonts.medium,
    color: palette.muted,
    textAlign: 'center',
    marginTop: spacing.md,
  },

  history: { marginTop: spacing.xxl },
  historyCard: {
    backgroundColor: palette.paper,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: palette.line,
    paddingHorizontal: spacing.lg,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: palette.line,
  },
  historyRowFirst: { borderTopWidth: 0 },
  historyIcon: {
    width: 28,
    height: 28,
    borderRadius: radius.full,
    backgroundColor: palette.mist,
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyText: { flex: 1 },
  historyTitle: { fontSize: typeScale.base, fontFamily: fonts.semi, color: palette.ink },
  historyMeta: { fontSize: typeScale.xs, fontFamily: fonts.regular, color: palette.muted, marginTop: 1 },
  historyAmount: { fontSize: typeScale.base, fontFamily: fonts.bold, color: palette.ink },

  footer: {
    fontSize: typeScale.xs,
    fontFamily: fonts.regular,
    color: palette.muted,
    lineHeight: 18,
    marginTop: spacing.xxl,
    textAlign: 'center',
  },
});
