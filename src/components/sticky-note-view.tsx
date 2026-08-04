import { useRef, useState } from 'react';
import { Animated, PanResponder, Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import type { StickyNote } from '@/lib/types';

export function StickyNoteView({
  note,
  canvasSize,
  draggable,
  onDragEnd,
  onPress,
}: {
  note: StickyNote;
  canvasSize: { width: number; height: number };
  draggable: boolean;
  onDragEnd?: (positionX: number, positionY: number) => void;
  onPress?: () => void;
}) {
  const [dragging, setDragging] = useState(false);
  const pan = useRef(new Animated.ValueXY()).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => draggable,
      onMoveShouldSetPanResponder: () => draggable,
      onPanResponderGrant: () => {
        setDragging(true);
        pan.setOffset({ x: (pan.x as any)._value, y: (pan.y as any)._value });
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], { useNativeDriver: false }),
      onPanResponderRelease: () => {
        pan.flattenOffset();
        setDragging(false);
        const currentX = (pan.x as any)._value as number;
        const currentY = (pan.y as any)._value as number;
        const left = note.position_x * canvasSize.width + currentX;
        const top = note.position_y * canvasSize.height + currentY;
        const clampedX = Math.min(1, Math.max(0, left / canvasSize.width));
        const clampedY = Math.min(1, Math.max(0, top / canvasSize.height));
        onDragEnd?.(clampedX, clampedY);
      },
    })
  ).current;

  const left = note.position_x * canvasSize.width - 44;
  const top = note.position_y * canvasSize.height - 30;

  return (
    <Animated.View
      {...panResponder.panHandlers}
      style={[
        styles.note,
        {
          backgroundColor: note.color,
          left,
          top,
          transform: pan.getTranslateTransform(),
          zIndex: dragging ? 10 : 1,
        },
      ]}>
      <Pressable onPress={onPress} disabled={!onPress}>
        <ThemedText type="small" style={styles.text} numberOfLines={3}>
          {note.text}
        </ThemedText>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  note: {
    position: 'absolute',
    width: 88,
    minHeight: 60,
    borderRadius: Radius.sm,
    padding: Spacing.two,
    transform: [{ rotate: '-2deg' }],
  },
  text: { color: '#3A3320' },
});
