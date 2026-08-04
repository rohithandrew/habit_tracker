/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#20241C',
    background: '#F1EEE1',
    backgroundElement: '#FFFFFF',
    backgroundSelected: '#E7E2CF',
    textSecondary: '#767C6E',
    border: '#E4E0D0',
    primary: '#C7EF3E',
    /** A warm neutral (not a pale green) used for secondary tinted surfaces — avatar circles,
     * selected-but-not-primary states — so only the real `primary` reads as "the green". */
    primarySoft: '#E9E4D3',
    /** Text/icon color to place on top of a `primary`-filled surface — primary is a light,
     * high-luminance lime in both themes, so it always needs a dark label, not white. */
    onPrimary: '#1B2A16',
    /** Brand-colored text/icons placed directly on the page background (links, "View all").
     * `primary` itself is too light to read as text on a light background, so this is a
     * darker olive in light mode; dark mode can use the lime directly since it's light-on-dark. */
    accent: '#5F7A1E',
    success: '#3E7A4B',
    danger: '#D9534F',
  },
  dark: {
    text: '#F1EEDF',
    background: '#14150F',
    backgroundElement: '#1E2118',
    backgroundSelected: '#262B1C',
    textSecondary: '#9CA48D',
    border: '#2A2E20',
    primary: '#C7EF3E',
    primarySoft: '#2A2822',
    onPrimary: '#1B2A16',
    accent: '#C7EF3E',
    success: '#5FCB98',
    danger: '#FF8A9B',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;

export const Radius = {
  sm: 10,
  md: 16,
  lg: 22,
  xl: 28,
  pill: 999,
} as const;
