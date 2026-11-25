import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Linking } from 'react-native';
import Constants from 'expo-constants';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Section, Card, Button, Avatar } from '../components';
import { SocialRow } from '../components/SocialRow';
import { theme } from '../lib/theme';
import { brand, ministries } from '../lib/brand';
import { useAuthStore, useChatStore, useJournalStore, useRecentsStore } from '../store';
import { chatRooms } from '../lib/chat';

const { palette, spacing, radius, typeScale, fonts } = theme;

function Stat({
  value,
  label,
  tint,
  onPress,
}: {
  value: string | number;
  label: string;
  tint: string;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={`${value} ${label.toLowerCase()}`}
      style={({ pressed }) => [
        styles.stat,
        { backgroundColor: `${tint}12` },
        pressed && onPress ? styles.pressed : null,
      ]}
    >
      <Text style={[styles.statValue, { color: tint }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </Pressable>
  );
}

function Row({
  icon,
  label,
  value,
  tint,
  onPress,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  value?: string;
  tint?: string;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={label}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <View style={styles.rowIcon}>
        <Ionicons name={icon} size={16} color={tint ?? palette.navy} />
      </View>
      <Text style={styles.rowLabel}>{label}</Text>
      {value ? <Text style={styles.rowValue}>{value}</Text> : null}
      {onPress ? <Ionicons name="chevron-forward" size={15} color={palette.muted} /> : null}
    </Pressable>
  );
}

export default function ProfileScreen({ navigation }: any) {
  const user = useAuthStore((s) => s.user);
  const notes = useJournalStore((s) => s.notes);
  const recent = useRecentsStore((s) => s.recent);
  const joinedRooms = useChatStore((s) => s.joined);
  const myRooms = chatRooms.filter((r) => joinedRooms[r.id]);
  const myMinistries = myRooms.filter((r) => r.kind === 'ministry').length;

  const bookmarks = useJournalStore((s) => s.saved);
  const noteCount = Object.values(notes).filter((n) => n && n.trim().length > 0).length;
  const savedCount = Object.keys(bookmarks).length;
  const version = Constants.expoConfig?.version ?? '1.0.0';

  const logout = () => {
    useAuthStore.getState().logout();
    navigation.navigate('Login');
  };

  return (
    <Screen scroll={false} style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Card style={styles.hero}>
          <View style={styles.heroTop}>
            <Avatar name={user?.name} size={64} />
            <View style={styles.heroText}>
              <Text style={styles.name}>{user?.name ?? 'Friend'}</Text>
              <View style={styles.rolePill}>
                <Text style={styles.roleText}>{(user?.role ?? 'guest').toUpperCase()}</Text>
              </View>
              <Text style={styles.campus}>{brand.location}</Text>
            </View>
          </View>

          <View style={styles.stats}>
            <Stat
              value={noteCount}
              label="NOTES"
              tint={palette.brandBlue}
              onPress={() => navigation.navigate('Journal')}
            />
            <Stat
              value={recent.length}
              label="PLAYED"
              tint={palette.teal}
              onPress={() => navigation.navigate('Media')}
            />
            <Stat
              value={myMinistries}
              label="GROUPS"
              tint={palette.plum}
              onPress={() => navigation.navigate('ChatHub')}
            />
          </View>
        </Card>

        <Section title="My walk">
          <View style={styles.group}>
            <Row
              icon="bookmark-outline"
              label="Saved sermons"
              value={savedCount ? `${savedCount} in journal` : 'Nothing saved'}
              tint={palette.brandBlue}
              onPress={() => navigation.navigate('Journal')}
            />
            <Row
              icon="create-outline"
              label="Sermon notes"
              value={noteCount ? `${noteCount} written` : 'None yet'}
              tint={palette.teal}
              onPress={() => navigation.navigate('Journal', { filter: 'notes' })}
            />
            <Row
              icon="notifications-outline"
              label="Notifications"
              tint={palette.amber}
              onPress={() => navigation.navigate('Notifications')}
            />
            <Row
              icon="chatbubbles-outline"
              label="Church chats"
              value={`${myRooms.length} ${myRooms.length === 1 ? 'room' : 'rooms'}`}
              tint={palette.navy}
              onPress={() => navigation.navigate('ChatHub')}
            />
            <Row
              icon="time-outline"
              label="Recently played"
              value={recent.length ? `${recent.length} messages` : 'None yet'}
              tint={palette.teal}
              onPress={() => navigation.navigate('Media')}
            />
            <Row
              icon="heart-outline"
              label="Prayer wall"
              tint={palette.danger}
              onPress={() => navigation.navigate('Pray')}
            />
            <Row
              icon="card-outline"
              label="Giving"
              tint={palette.violet}
              onPress={() => navigation.navigate('Give')}
            />
            <Row
              icon="people-outline"
              label="Our ministries"
              tint={palette.steel}
              onPress={() => navigation.navigate('Ministries')}
            />
          </View>
        </Section>

        <Section title="Connect">
          <SocialRow />
          <View style={[styles.group, styles.groupSpaced]}>
            <Row
              icon="mail-outline"
              label="Email the office"
              tint={palette.navy}
              onPress={() => Linking.openURL(`mailto:${brand.email}`).catch(() => {})}
            />
            <Row
              icon="call-outline"
              label="Call the church"
              value={brand.phone}
              tint={palette.navy}
              onPress={() => Linking.openURL(`tel:${brand.phone.replace(/\s/g, '')}`).catch(() => {})}
            />
            <Row
              icon="logo-whatsapp"
              label="WhatsApp"
              tint={palette.teal}
              onPress={() => Linking.openURL(brand.whatsapp).catch(() => {})}
            />
            <Row
              icon="location-outline"
              label="Visit us"
              value={brand.serviceTime}
              tint={palette.navy}
              onPress={() => Linking.openURL(brand.site).catch(() => {})}
            />
          </View>
        </Section>

        <Section title="Account">
          <View style={styles.group}>
            <Row icon="person-outline" label="Name" value={user?.name ?? 'Friend'} />
            <Row icon="at-outline" label="Email" value={user?.email ?? 'Not linked'} />
            <Row icon="business-outline" label="Campus" value="Joy Lambton" />
          </View>

          <View style={styles.logout}>
            <Button label="Log out" variant="danger" onPress={logout} />
          </View>
        </Section>

        <Text style={styles.footer}>
          {brand.name} · v{version}
          {'\n'}
          {brand.copyright}
        </Text>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingHorizontal: 0, paddingBottom: 0 },
  content: { paddingHorizontal: spacing.xl, paddingBottom: 120 },

  hero: { padding: spacing.lg, marginBottom: spacing.xxl },
  heroTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  heroText: { flex: 1 },
  name: { fontSize: 30, fontFamily: fonts.heading, color: palette.ink, letterSpacing: -0.3, lineHeight: 34 },
  rolePill: {
    alignSelf: 'flex-start',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.badgeBg,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    marginTop: spacing.xs,
  },
  roleText: {
    fontSize: 9,
    fontFamily: fonts.bold,
    color: palette.navy,
    letterSpacing: 1,
    lineHeight: 12,
    includeFontPadding: false,
  },
  campus: { fontSize: typeScale.xs, fontFamily: fonts.regular, color: palette.muted, marginTop: spacing.sm },

  stats: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg },
  stat: {
    flex: 1,
    borderRadius: radius.sm,
    paddingVertical: spacing.md,
    alignItems: 'center',
    gap: 2,
  },
  statValue: { fontSize: typeScale.title, fontFamily: fonts.extra, letterSpacing: -0.4 },
  statLabel: { fontSize: 9, fontFamily: fonts.bold, color: palette.muted, letterSpacing: 1 },

  group: {
    backgroundColor: palette.paper,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: palette.line,
    paddingHorizontal: spacing.lg,
  },
  groupSpaced: { marginTop: spacing.md },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: palette.line,
    minHeight: 48,
  },
  pressed: { opacity: 0.6 },
  rowIcon: {
    width: 30,
    height: 30,
    borderRadius: radius.sm,
    backgroundColor: palette.canvas,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: { flex: 1, fontSize: typeScale.base, fontFamily: fonts.semi, color: palette.ink },
  rowValue: { fontSize: typeScale.sm, fontFamily: fonts.regular, color: palette.muted, maxWidth: 150, textAlign: 'right' },

  logout: { marginTop: spacing.lg },

  footer: {
    fontSize: typeScale.xs,
    fontFamily: fonts.regular,
    color: palette.muted,
    lineHeight: 18,
    textAlign: 'center',
    marginTop: spacing.md,
  },
});
