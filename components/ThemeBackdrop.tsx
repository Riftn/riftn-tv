import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useTvTheme } from '../contexts/ThemeContext';
import { withAlpha } from '../config/themes';

/**
 * The theme's scene behind every browse screen.
 *
 * Dimmed hardest on the left, where the nav rail and the first column of text
 * sit, and along the bottom, where rails run. Titles are white on whatever is
 * behind them, and the brightest frame of a scene (Island's sunset, Jungle's
 * clearing) would otherwise put white text on a pale sky.
 */
export function ThemeBackdrop() {
  const { theme } = useTvTheme();
  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: theme.page }]} pointerEvents="none">
      {theme.backdrop && (
        <>
          <Image
            source={theme.backdrop}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            transition={300}
            cachePolicy="memory"
          />
          <LinearGradient
            colors={[withAlpha(theme.page, 0.86), withAlpha(theme.page, 0.6), withAlpha(theme.page, 0.45)]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={StyleSheet.absoluteFill}
          />
          <LinearGradient
            colors={[withAlpha(theme.page, 0), withAlpha(theme.page, 0.55)]}
            locations={[0.35, 1]}
            style={StyleSheet.absoluteFill}
          />
        </>
      )}
    </View>
  );
}
