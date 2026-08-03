import { Image } from 'expo-image';
import { useState } from 'react';
import { Dimensions, NativeScrollEvent, NativeSyntheticEvent, ScrollView, StyleSheet, View } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { FOCUS_CAROUSEL_IMAGES } from '@/lib/focus-carousel';

const HEIGHT = 200;

export function FocusCarousel() {
  const [index, setIndex] = useState(0);
  const [width, setWidth] = useState(Dimensions.get('window').width - Spacing.four * 2);

  function handleScroll(e: NativeSyntheticEvent<NativeScrollEvent>) {
    if (width === 0) return;
    setIndex(Math.round(e.nativeEvent.contentOffset.x / width));
  }

  return (
    <View style={styles.wrapper} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        style={{ borderRadius: Radius.xl }}>
        {FOCUS_CAROUSEL_IMAGES.map((source, i) => (
          <Image key={i} source={source} style={{ width, height: HEIGHT, borderRadius: Radius.xl }} contentFit="cover" />
        ))}
      </ScrollView>

      {FOCUS_CAROUSEL_IMAGES.length > 1 ? (
        <View style={styles.dots}>
          {FOCUS_CAROUSEL_IMAGES.map((_, i) => (
            <View
              key={i}
              style={[styles.dot, { backgroundColor: i === index ? '#fff' : 'rgba(255,255,255,0.5)' }]}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { position: 'relative' },
  dots: {
    position: 'absolute',
    bottom: Spacing.two,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
});
