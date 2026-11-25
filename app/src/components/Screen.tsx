import React from 'react';
import { View, Text, StyleSheet, ScrollView, ViewStyle, Pressable } from 'react-native';
import { useSafeArea } from 'react-native-safe-area-context';
import { theme } from '../lib/theme';
import { Ionicons } from '@expo/vector-icons';

const { palette, spacing, typeScale, fonts, radius } = theme;

const TABS = [
  { key: 'Home', icon: 'home', label: 'Home' },
  { key: 'Media', icon: 'play-circle', label: 'Media' },
  { key: 'Pray', icon: 'heart', label: 'Pray' },
  { key: 'Give', icon: 'card', label: 'Give' },
];

interface ScreenProps {
  children: React.ReactNode;
  title?: string;
  style?: ViewStyle;
  scroll?: boolean;
  rightAction?: React.ReactNode;
  showTabs?: boolean;
  activeTab?: string;
  onTabPress?: (t: string) => void;
}

export function Screen({ children, title, style, scroll = true, rightAction, showTabs, activeTab, onTabPress }: ScreenProps) {
  const insets = useSafeArea();
  const topPadding = title ? spacing.xxxl : insets.top + spacing.xxxl;

  return (
    <View style={styles.root}>
      {title ? (
        <View style={[styles.header, { paddingTop: insets.top + spacing.xl }]}>
          <Text style={styles.title}>{title}</Text>
          {rightAction ?? <View />}
        </View>
      ) : null}
      {scroll ? (
        <ScrollView
          contentContainerStyle={[styles.inner, { paddingTop: topPadding }, style]}
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.inner, { paddingTop: topPadding }, style]}>
          {children}
        </View>
      )}
      {showTabs && (
        <View style={[styles.tabs, { paddingBottom: insets.bottom + 4 }]}>
          {TABS.map((t) => {
            const active = t.key === activeTab;
            return (
              <Pressable key={t.key} onPress={() => onTabPress?.(t.key)} style={styles.tab}>
                <Ionicons name={t.icon as any} size={16} color={active ? palette.accent : palette.muted} />
                <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{t.label}</Text>
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.ground },
  header: {
    paddingHorizontal: spacing.pad,
    paddingBottom: spacing.lg,
    backgroundColor: palette.ground,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 26,
    lineHeight: 32,
    letterSpacing: -0.5,
    fontFamily: fonts.bold,
    color: palette.ink,
  },
  inner: { paddingHorizontal: spacing.pad, paddingBottom: spacing.xxxxl, gap: spacing.gap },
  tabs: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: palette.rule,
    backgroundColor: palette.surface,
    paddingTop: 6,
    minHeight: 48,
  },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3 },
  tabLabel: { fontSize: 11, fontFamily: fonts.medium, color: palette.muted },
  tabLabelActive: { color: palette.accent, fontFamily: fonts.semi },
});

export default Screen;