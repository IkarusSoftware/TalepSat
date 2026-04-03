import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { resolveAppMediaUrl } from '../../lib/media';
import { colors, fontFamily, borderRadius } from '../../theme';

type AvatarSize = 'sm' | 'md' | 'lg';

interface AvatarProps {
  name: string;
  image?: string | null;
  size?: AvatarSize;
  verified?: boolean;
}

const sizeMap: Record<AvatarSize, number> = { sm: 24, md: 36, lg: 48 };
const fontSizeMap: Record<AvatarSize, number> = { sm: 10, md: 14, lg: 18 };

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}

export function Avatar({ name, image, size = 'md', verified }: AvatarProps) {
  const dim = sizeMap[size];
  const fs = fontSizeMap[size];
  const resolvedImage = resolveAppMediaUrl(image);

  return (
    <View style={{ position: 'relative' }}>
      {resolvedImage ? (
        <Image
          source={{ uri: resolvedImage }}
          style={[styles.image, { width: dim, height: dim, borderRadius: dim / 2 }]}
        />
      ) : (
        <View
          style={[
            styles.placeholder,
            { width: dim, height: dim, borderRadius: dim / 2 },
          ]}
        >
          <Text style={[styles.initials, { fontSize: fs }]}>{getInitials(name)}</Text>
        </View>
      )}
      {verified && (
        <View style={[styles.verifiedBadge, { right: -2, bottom: -2 }]}>
          <Ionicons name="checkmark-circle" size={size === 'sm' ? 12 : 16} color={colors.success.DEFAULT} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  image: {
    backgroundColor: colors.surfaceRaised,
  },
  placeholder: {
    backgroundColor: colors.accent.lighter,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    color: colors.accent.light,
    fontFamily: fontFamily.bold,
  },
  verifiedBadge: {
    position: 'absolute',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.full,
  },
});
