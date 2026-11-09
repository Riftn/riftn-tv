import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Txt } from '../components/Txt';
import { Focusable } from '../components/Focusable';
import { Grid } from '../components/Grid';
import { useGrid } from '../lib/useGrid';
import { useTvTheme } from '../contexts/ThemeContext';
import { TV_THEMES, type TvTheme } from '../config/themes';
import { colors, radius, spacing, OVERSCAN, s } from '../config/theme';

const COLUMNS = 4;

/**
 * Pick a theme. Same twelve as the site and the phone app.
 *
 * Applied on press, not on focus. Moving the cursor across the grid is not a
 * choice, and repainting the whole TV every time the ring passes a tile would
 * strobe the room.
 */
export function ThemesScreen() {
  const { theme, setTheme } = useTvTheme();
  const { cellWidth, cellHeight } = useGrid(COLUMNS, 16 / 9);

  return (
    <View style={styles.root}>
      <Grid
        data={TV_THEMES}
        columns={COLUMNS}
        itemWidth={cellWidth}
        itemHeight={cellHeight}
        keyExtractor={(t) => t.key}
        header={
          <View style={styles.header}>
            <Txt variant="title">Themes</Txt>
            <Txt variant="body" color={colors.mutedForeground}>
              The same themes as riftn.com and the Riftn app. Saved on this TV only.
            </Txt>
          </View>
        }
        renderItem={(t) => (
          <ThemeTile
            theme={t}
            width={cellWidth}
            height={cellHeight}
            active={t.key === theme.key}
            autoFocus={t.key === theme.key}
            onPress={() => setTheme(t.key)}
          />
        )}
      />
    </View>
  );
}

function ThemeTile({
  theme,
  width,
  height,
  active,
  autoFocus,
  onPress,
}: {
  theme: TvTheme;
  width: number;
  height: number;
  active: boolean;
  autoFocus: boolean;
  onPress: () => void;
}) {
  return (
    <Focusable onPress={onPress} autoFocus={autoFocus} borderRadius={radius.lg}>
      <View style={[styles.tile, { width, height, backgroundColor: theme.page }]}>
        {theme.backdrop ? (
          <Image source={theme.backdrop} style={StyleSheet.absoluteFill} contentFit="cover" cachePolicy="memory" />
        ) : (
          <SystemSwatch />
        )}
        <View style={styles.tileShade} />
        {theme.icons && (
          <View style={styles.iconRow}>
            <Image source={theme.icons.home} style={iconStyle} contentFit="contain" />
            <Image source={theme.icons.live} style={iconStyle} contentFit="contain" />
            <Image source={theme.icons.videos} style={iconStyle} contentFit="contain" />
          </View>
        )}
        <View style={styles.label}>
          <View style={[styles.dot, { backgroundColor: theme.accent }]} />
          <Txt variant="card" numberOfLines={1} style={styles.labelText}>
            {theme.name}
          </Txt>
          {active && <Ionicons name="checkmark-circle" size={s(20)} color={theme.accent} />}
        </View>
      </View>
    </Focusable>
  );
}

/** System has no scene: a plain panel with the white focus edge it uses. */
function SystemSwatch() {
  return (
    <View style={styles.systemSwatch}>
      <View style={styles.systemPill} />
      <View style={[styles.systemPill, styles.systemPillShort]} />
    </View>
  );
}

const iconStyle = { width: s(30), height: s(30) } as const;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    paddingTop: OVERSCAN.y,
  },
  header: {
    gap: spacing.xs,
    marginBottom: spacing.lg,
  },
  tile: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: s(1),
    borderColor: colors.border,
  },
  tileShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.18)',
  },
  iconRow: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    flexDirection: 'row',
    gap: spacing.xs,
  },
  label: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  labelText: {
    flex: 1,
  },
  dot: {
    width: s(10),
    height: s(10),
    borderRadius: s(5),
  },
  systemSwatch: {
    ...StyleSheet.absoluteFillObject,
    padding: spacing.md,
    gap: spacing.sm,
  },
  systemPill: {
    height: s(14),
    width: '60%',
    borderRadius: radius.pill,
    borderWidth: s(2),
    borderColor: '#FFFFFF',
  },
  systemPillShort: {
    width: '35%',
    borderColor: colors.border,
  },
});
