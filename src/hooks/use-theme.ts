/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useSettings } from '@/lib/settings-context';

export function useResolvedScheme(): 'light' | 'dark' {
  const scheme = useColorScheme();
  const { themeMode } = useSettings();

  if (themeMode !== 'system') return themeMode;
  return scheme === 'dark' ? 'dark' : 'light';
}

export function useTheme() {
  return Colors[useResolvedScheme()];
}
