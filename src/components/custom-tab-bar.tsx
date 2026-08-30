import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

// This bar is intentionally a fixed dark surface in both app themes (unlike the rest of the
// app's chrome) — a near-black bar is what gives the active-tab lime icon enough contrast to
// read clearly regardless of light/dark mode.
const BAR_BACKGROUND = '#1C2013';
const BAR_BORDER = 'rgba(255,255,255,0.08)';
// A true neutral gray (no hue at all) — anything with a green cast would compete
// visually with the lime `primary` used for the active tab, blurring the distinction.
const INACTIVE_ICON = '#8C8C8C';

const ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  index: 'home-outline',
  timer: 'timer-outline',
  todo: 'checkbox-outline',
  mood: 'happy-outline',
  friends: 'people-outline',
};

type TabBarRoute = { key: string; name: string };
type TabBarState = { routes: TabBarRoute[]; index: number };
// React Navigation's real NavigationHelpers type is a strict generic keyed to the
// navigator's event map, which doesn't structurally match a hand-written shape —
// this component only calls .navigate(name) and .emit({type, target}), so `any`
// avoids fighting that generic for no real type-safety gain here.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TabBarNavigation = any;

export function CustomTabBar({
  state,
  navigation,
}: {
  state: TabBarState;
  navigation: TabBarNavigation;
}) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const routes = state.routes.filter((route) => route.name in ICONS);

  return (
    <View
      style={[
        styles.bar,
        { backgroundColor: BAR_BACKGROUND, borderTopColor: BAR_BORDER, paddingBottom: insets.bottom },
      ]}>
      {routes.map((route) => {
        const routeIndex = state.routes.indexOf(route);
        const focused = state.index === routeIndex;

        function handlePress() {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
        }

        return (
          <Pressable key={route.key} onPress={handlePress} style={styles.tab}>
            {focused ? <View style={[styles.indicator, { backgroundColor: theme.primary }]} /> : null}
            <Ionicons
              name={ICONS[route.name]}
              size={24}
              color={focused ? theme.primary : INACTIVE_ICON}
            />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingTop: Spacing.three,
    paddingHorizontal: Spacing.four,
  },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: Spacing.three },
  indicator: {
    position: 'absolute',
    top: -Spacing.three,
    width: 18,
    height: 3,
    borderRadius: 2,
  },
});
