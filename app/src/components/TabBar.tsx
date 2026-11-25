import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { theme } from '../lib/theme';

const { palette, spacing, fonts } = theme;

type IconPair = {
  active: React.ComponentProps<typeof Ionicons>['name'];
  inactive: React.ComponentProps<typeof Ionicons>['name'];
};

const ICONS: Record<string, IconPair> = {
  Home: { active: 'home', inactive: 'home-outline' },
  Media: { active: 'play-circle', inactive: 'play-circle-outline' },
  Pray: { active: 'heart', inactive: 'heart-outline' },
  Give: { active: 'card', inactive: 'card-outline' },
  Ministries: { active: 'people', inactive: 'people-outline' },
};

/**
 * Custom tab bar. React Navigation's default height is computed internally and
 * clipped the labels in the browser, so the bar is drawn here: fixed height,
 * safe-area aware, one soft blue pill on the active tab.
 */
export function TabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.bar, { paddingBottom: insets.bottom + spacing.sm }]}>
      {state.routes.map((route, index) => {
        const focused = state.index === index;
        const options = descriptors[route.key]?.options;
        const label =
          typeof options?.tabBarLabel === 'string' ? options.tabBarLabel : route.name;
        const icons = ICONS[route.name] ?? ICONS.Home;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!focused && !event.defaultPrevented) {
            navigation.navigate(route.name as never);
          }
        };

        const onLongPress = () => {
          navigation.emit({ type: 'tabLongPress', target: route.key });
        };

        return (
          <Pressable
            key={route.key}
            accessibilityRole="tab"
            accessibilityState={focused ? { selected: true } : {}}
            accessibilityLabel={label}
            onPress={onPress}
            onLongPress={onLongPress}
            style={[styles.tab, focused && styles.tabActive]}
          >
            <Ionicons
              name={focused ? icons.active : icons.inactive}
              size={19}
              color={focused ? palette.navy : palette.muted}
            />
            <Text style={[styles.label, focused && styles.labelActive]} numberOfLines={1}>
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'stretch',
    backgroundColor: palette.paper,
    borderTopWidth: 1,
    borderTopColor: palette.line,
    paddingHorizontal: 0,
  },
  /* The active tab is marked by a rule at the top edge, like an index tab —
     no floating pill behind the icon. */
  tab: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    paddingTop: spacing.sm + 2,
    paddingBottom: 2,
    borderTopWidth: 2,
    borderTopColor: 'transparent',
  },
  tabActive: { borderTopColor: palette.navy },
  label: { fontSize: 10, fontFamily: fonts.medium, color: palette.muted },
  labelActive: { color: palette.navy, fontFamily: fonts.semi },
});

export default TabBar;
