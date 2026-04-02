import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  LayoutChangeEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { useThemeColors } from '../../contexts/ThemeContext';
import { borderRadius, fontFamily, space } from '../../theme';

interface ListingMediaHeaderProps {
  listingId: string;
  title: string;
  category: string;
  images?: string[];
  onPress: () => void;
  onFavoriteToggle?: (id: string) => void;
  isFavorited?: boolean;
}

const IMAGE_PATTERN = /\.(avif|gif|jpe?g|png|webp)(\?.*)?$/i;

function getValidImages(images?: string[]) {
  return (images ?? [])
    .filter((item) => typeof item === 'string' && (item.startsWith('data:image/') || IMAGE_PATTERN.test(item)));
}

function getCategoryPalette(category: string, colors: any) {
  const normalized = category.toLocaleLowerCase('tr-TR');

  if (normalized.includes('elektronik')) {
    return { background: colors.primary.DEFAULT, glow: '#4BA3FF', label: colors.white };
  }

  if (normalized.includes('tekstil') || normalized.includes('moda')) {
    return { background: '#C24E7B', glow: '#F4A261', label: colors.white };
  }

  if (normalized.includes('gıda') || normalized.includes('ambalaj')) {
    return { background: colors.success.DEFAULT, glow: '#B7E86C', label: colors.white };
  }

  if (normalized.includes('inşaat') || normalized.includes('endüstriyel')) {
    return { background: '#6E5E4C', glow: '#D9B36C', label: colors.white };
  }

  return { background: colors.primary.DEFAULT, glow: colors.accent.DEFAULT, label: colors.white };
}

export function ListingMediaHeader({
  listingId,
  title,
  category,
  images,
  onPress,
  onFavoriteToggle,
  isFavorited,
}: ListingMediaHeaderProps) {
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const palette = useMemo(() => getCategoryPalette(category, colors), [category, colors]);
  const validImages = useMemo(() => getValidImages(images), [images]);
  const previewImages = useMemo(() => validImages.slice(0, 5), [validImages]);
  const scrollRef = useRef<ScrollView>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    setActiveIndex(0);
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ x: 0, animated: false });
    }
  }, [listingId, previewImages.length]);

  const handleLayout = (event: LayoutChangeEvent) => {
    setWidth(event.nativeEvent.layout.width);
  };

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (!width) return;
    const nextIndex = Math.round(event.nativeEvent.contentOffset.x / width);
    if (nextIndex !== activeIndex) {
      setActiveIndex(nextIndex);
    }
  };

  const scrollToIndex = (index: number) => {
    if (!scrollRef.current || !width) return;
    scrollRef.current.scrollTo({ x: index * width, animated: true });
    setActiveIndex(index);
  };

  return (
    <View style={styles.wrapper} onLayout={handleLayout}>
      {previewImages.length > 0 ? (
        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          nestedScrollEnabled
          bounces={false}
          decelerationRate="fast"
          showsHorizontalScrollIndicator={false}
          scrollEventThrottle={16}
          onScroll={handleScroll}
        >
          {previewImages.map((image, index) => (
            <TouchableOpacity
              key={`${image}-${index}`}
              activeOpacity={0.96}
              onPress={onPress}
              style={[styles.slide, { width: width || 320 }]}
            >
              <Image
                source={image}
                style={styles.image}
                contentFit="cover"
                transition={120}
                cachePolicy="memory-disk"
              />
              <View style={styles.imageScrim} />
            </TouchableOpacity>
          ))}
        </ScrollView>
      ) : (
        <TouchableOpacity
          activeOpacity={0.92}
          onPress={onPress}
          style={[styles.placeholder, { backgroundColor: palette.background }]}
        >
          <View style={[styles.placeholderGlowLarge, { backgroundColor: palette.glow }]} />
          <View style={[styles.placeholderGlowSmall, { backgroundColor: colors.white }]} />
          <View style={styles.placeholderContent}>
            <View style={styles.placeholderBadge}>
              <Ionicons name="images-outline" size={12} color={palette.label} />
              <Text style={[styles.placeholderBadgeText, { color: palette.label }]}>Görsel Yok</Text>
            </View>
            <View>
              <Text style={styles.placeholderCategory}>{category}</Text>
              <Text style={styles.placeholderTitle} numberOfLines={2}>{title}</Text>
            </View>
          </View>
        </TouchableOpacity>
      )}

      {previewImages.length > 0 && (
        <View style={styles.countBadge}>
          <Ionicons name="images-outline" size={12} color={colors.white} />
          <Text style={styles.countBadgeText}>{validImages.length}</Text>
        </View>
      )}

      {onFavoriteToggle && (
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => onFavoriteToggle(listingId)}
          style={[
            styles.favoriteButton,
            isFavorited ? styles.favoriteButtonActive : null,
          ]}
        >
          <Ionicons
            name={isFavorited ? 'heart' : 'heart-outline'}
            size={18}
            color={isFavorited ? colors.error.DEFAULT : colors.textSecondary}
          />
        </TouchableOpacity>
      )}

      {previewImages.length > 1 && (
        <View style={styles.dots}>
          {previewImages.map((image, index) => (
            <TouchableOpacity
              key={`${image}-dot-${index}`}
              activeOpacity={0.85}
              onPress={() => scrollToIndex(index)}
              style={[styles.dot, index === activeIndex && styles.dotActive]}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const makeStyles = (colors: any) => StyleSheet.create({
  wrapper: {
    position: 'relative',
    aspectRatio: 16 / 9,
    borderTopLeftRadius: borderRadius.lg,
    borderTopRightRadius: borderRadius.lg,
    overflow: 'hidden',
    backgroundColor: colors.surfaceRaised,
  },
  slide: {
    height: '100%',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageScrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.16)',
  },
  placeholder: {
    flex: 1,
    padding: space.md,
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  placeholderGlowLarge: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 999,
    right: -40,
    top: -38,
    opacity: 0.28,
  },
  placeholderGlowSmall: {
    position: 'absolute',
    width: 110,
    height: 110,
    borderRadius: 999,
    left: 18,
    bottom: -42,
    opacity: 0.12,
  },
  placeholderContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  placeholderBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.16)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
  },
  placeholderBadgeText: {
    fontSize: 11,
    fontFamily: fontFamily.semiBold,
    letterSpacing: 0.6,
  },
  placeholderCategory: {
    fontSize: 11,
    fontFamily: fontFamily.medium,
    color: 'rgba(255,255,255,0.75)',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 6,
  },
  placeholderTitle: {
    fontSize: 18,
    lineHeight: 24,
    fontFamily: fontFamily.bold,
    color: colors.white,
    maxWidth: '82%',
  },
  countBadge: {
    position: 'absolute',
    left: space.sm,
    top: space.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(18,18,18,0.58)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
  },
  countBadgeText: {
    fontSize: 11,
    fontFamily: fontFamily.semiBold,
    color: colors.white,
  },
  favoriteButton: {
    position: 'absolute',
    right: space.sm,
    top: space.sm,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  favoriteButtonActive: {
    backgroundColor: colors.error.light,
    borderColor: colors.error.light,
  },
  dots: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: space.sm,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.56)',
  },
  dotActive: {
    width: 18,
    backgroundColor: colors.white,
  },
});
