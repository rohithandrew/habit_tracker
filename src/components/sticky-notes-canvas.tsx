import { useState } from 'react';
import { Alert, LayoutChangeEvent, Pressable, StyleSheet, View } from 'react-native';

import { StickyNoteComposer } from '@/components/sticky-note-composer';
import { StickyNoteView } from '@/components/sticky-note-view';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { createStickyNote, deleteStickyNote, updateStickyNotePosition } from '@/lib/sticky-notes-api';
import type { StickyNote, StickyNoteTargetType } from '@/lib/types';

export function StickyNotesCanvas({
  notes,
  currentUserId,
  ownerId,
  targetType,
  canAuthorNote,
  onNotesChange,
  children,
}: {
  notes: StickyNote[];
  currentUserId: string;
  ownerId: string;
  targetType: StickyNoteTargetType;
  canAuthorNote: boolean;
  onNotesChange: (notes: StickyNote[]) => void;
  children: React.ReactNode;
}) {
  const theme = useTheme();
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [composerOpen, setComposerOpen] = useState(false);
  const isOwner = ownerId === currentUserId;

  function handleLayout(e: LayoutChangeEvent) {
    const { width, height } = e.nativeEvent.layout;
    setSize({ width, height });
  }

  async function handleDragEnd(note: StickyNote, x: number, y: number) {
    onNotesChange(notes.map((n) => (n.id === note.id ? { ...n, position_x: x, position_y: y } : n)));
    try {
      await updateStickyNotePosition(note.id, x, y);
    } catch {
      // position is cosmetic; a failed persist isn't worth interrupting the user
    }
  }

  function handleNotePress(note: StickyNote) {
    const canDelete = isOwner || note.author_id === currentUserId;
    if (!canDelete) return;
    Alert.alert('Delete this note?', note.text, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          onNotesChange(notes.filter((n) => n.id !== note.id));
          try {
            await deleteStickyNote(note.id);
          } catch (err) {
            Alert.alert('Could not delete', err instanceof Error ? err.message : String(err));
          }
        },
      },
    ]);
  }

  return (
    <View style={styles.wrapper}>
      <View onLayout={handleLayout} style={styles.canvas}>
        {children}
        {size.width > 0 &&
          notes.map((note) => (
            <StickyNoteView
              key={note.id}
              note={note}
              canvasSize={size}
              draggable={note.author_id === currentUserId}
              onDragEnd={(x, y) => handleDragEnd(note, x, y)}
              onPress={() => handleNotePress(note)}
            />
          ))}
      </View>

      {canAuthorNote && !isOwner ? (
        <Pressable
          onPress={() => setComposerOpen(true)}
          style={[styles.leaveNoteButton, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
          <ThemedText type="smallBold">📝 Leave a note</ThemedText>
        </Pressable>
      ) : null}

      <StickyNoteComposer
        visible={composerOpen}
        onClose={() => setComposerOpen(false)}
        onSubmit={async (text, color) => {
          setComposerOpen(false);
          try {
            const created = await createStickyNote({
              authorId: currentUserId,
              ownerId,
              targetType,
              targetId: null,
              positionX: 0.5,
              positionY: 0.5,
              color,
              text,
            });
            onNotesChange([...notes, created]);
          } catch (err) {
            Alert.alert('Could not post note', err instanceof Error ? err.message : String(err));
          }
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: Spacing.two },
  canvas: { position: 'relative' },
  leaveNoteButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Radius.pill,
    borderWidth: 1,
  },
});
