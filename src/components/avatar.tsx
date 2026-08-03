import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/hooks/use-theme';
import { avatarSource } from '@/lib/avatars';

export function Avatar({ avatarKey, size = 44 }: { avatarKey: string | null | undefined; size?: number }) {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.circle,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: theme.primarySoft },
      ]}>
      <Image source={avatarSource(avatarKey)} style={{ width: size, height: size }} contentFit="cover" />
    </View>
  );
}

const styles = StyleSheet.create({
  circle: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
});
