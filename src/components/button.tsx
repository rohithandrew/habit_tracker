import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View, type PressableProps } from 'react-native';

import { DotsLoader } from '@/components/dots-loader';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

export type ButtonProps = Omit<PressableProps, 'style'> & {
  label: string;
  variant?: ButtonVariant;
  icon?: keyof typeof Ionicons.glyphMap;
  loading?: boolean;
  fullWidth?: boolean;
};

export function Button({
  label,
  variant = 'primary',
  icon,
  loading = false,
  fullWidth = true,
  disabled,
  ...rest
}: ButtonProps) {
  const theme = useTheme();
  const isDisabled = disabled || loading;

  const backgroundColor =
    variant === 'primary'
      ? theme.primary
      : variant === 'danger'
        ? theme.danger
        : variant === 'secondary'
          ? theme.backgroundSelected
          : 'transparent';

  const textColor =
    variant === 'primary' ? theme.onPrimary : variant === 'danger' ? '#FFFFFF' : theme.text;

  return (
    <Pressable
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        { backgroundColor, opacity: isDisabled ? 0.6 : pressed ? 0.85 : 1 },
        fullWidth && styles.fullWidth,
        variant === 'ghost' && { borderWidth: 1, borderColor: theme.border },
      ]}
      {...rest}>
      {loading ? (
        <DotsLoader color={textColor} size={6} />
      ) : (
        <View style={styles.content}>
          {icon ? <Ionicons name={icon} size={18} color={textColor} /> : null}
          <ThemedText
            type="smallBold"
            numberOfLines={1}
            ellipsizeMode="clip"
            style={[styles.label, { color: textColor }]}>
            {label}
          </ThemedText>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.four,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullWidth: {
    alignSelf: 'stretch',
  },
  content: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  label: { flexShrink: 0, includeFontPadding: false },
});
