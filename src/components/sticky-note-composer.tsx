import { useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { STICKY_NOTE_COLORS } from '@/lib/types';

export function StickyNoteComposer({
  visible,
  onClose,
  onSubmit,
}: {
  visible: boolean;
  onClose: () => void;
  onSubmit: (text: string, color: string) => void;
}) {
  const theme = useTheme();
  const [text, setText] = useState('');
  const [color, setColor] = useState<string>(STICKY_NOTE_COLORS[0]);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <ThemedView style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.header}>
            <ThemedText type="subtitle" style={styles.title}>
              Leave a note
            </ThemedText>
            <Pressable onPress={onClose} hitSlop={12}>
              <ThemedText type="smallBold" themeColor="textSecondary">
                Close
              </ThemedText>
            </Pressable>
          </View>

          <TextField placeholder="Say something nice…" value={text} onChangeText={setText} multiline />

          <View style={styles.colorRow}>
            {STICKY_NOTE_COLORS.map((c) => (
              <Pressable
                key={c}
                onPress={() => setColor(c)}
                style={[
                  styles.swatch,
                  { backgroundColor: c },
                  color === c && { borderWidth: 3, borderColor: theme.text },
                ]}
              />
            ))}
          </View>

          <Button label="Post note" disabled={!text.trim()} onPress={() => onSubmit(text.trim(), color)} />
        </SafeAreaView>
      </ThemedView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    gap: Spacing.three,
    alignSelf: 'center',
    width: '100%',
    maxWidth: MaxContentWidth,
  },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 20 },
  colorRow: { flexDirection: 'row', gap: Spacing.two },
  swatch: { width: 36, height: 36, borderRadius: Radius.pill },
});
