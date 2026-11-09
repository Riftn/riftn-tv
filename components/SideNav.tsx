import React, { useCallback, useRef, useState } from 'react';
import { Animated, Image, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Focusable } from './Focusable';
import { Txt } from './Txt';
import { TVFocusGuideView } from '../lib/tv';
import { useAuth } from '../contexts/AuthContext';
import { useTvTheme } from '../contexts/ThemeContext';
import { useFocusColors } from '../lib/useFocusColors';
import { withAlpha, type ThemeIconKey } from '../config/themes';
import { colors, radius, spacing, OVERSCAN, NAV_RAIL_WIDTH, s } from '../config/theme';

export type NavKey = 'home' | 'videos' | 'live' | 'tv' | 'search' | 'themes' | 'account';

export interface NavItem {
  key: NavKey;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  /** The theme's own drawing of this item, when the theme has one. */
  themeIcon?: ThemeIconKey;
}

export const NAV_ITEMS: NavItem[] = [
  { key: 'home', label: 'Home', icon: 'home', themeIcon: 'home' },
  { key: 'videos', label: 'Videos', icon: 'film', themeIcon: 'videos' },
  { key: 'live', label: 'Live', icon: 'radio', themeIcon: 'live' },
  { key: 'tv', label: 'Live TV', icon: 'tv', themeIcon: 'tv' },
  { key: 'search', label: 'Search', icon: 'search', themeIcon: 'search' },
  { key: 'themes', label: 'Themes', icon: 'color-palette-outline', themeIcon: 'paint' },
  // Label is overridden with the signed-in name below — a nav that still says
  // "Sign in" after you have signed in is the most common way a TV app leaves
  // people unsure whether it worked.
  { key: 'account', label: 'Sign in', icon: 'person-circle-outline', themeIcon: 'profile' },
];

/** How wide the rail grows when focus enters it. */
const NAV_EXPANDED_WIDTH = s(240);

export interface SideNavProps {
  active: NavKey;
  onSelect: (key: NavKey) => void;
}

/**
 * Left navigation.
 *
 * It expands as an OVERLAY rather than by taking layout width. Expanding in
 * flow would re-flow every rail to the right of it the instant focus enters the
 * nav, which on a TV means the thing the user was looking at slides sideways
 * because they pressed LEFT — the opposite of what pressing LEFT should do.
 * Content keeps a fixed `NAV_RAIL_WIDTH` gutter and the expanded panel floats
 * over it, dimming what it covers.
 *
 * The active item stays marked while focus is elsewhere. Focus is a cursor, not
 * a selection, and a nav that only shows where you *are* when you happen to be
 * standing in it tells you nothing while you are browsing.
 */
export function SideNav({ active, onSelect }: SideNavProps) {
  const { user, isSignedIn } = useAuth();
  const { theme } = useTvTheme();
  const focus = useFocusColors();
  const [expanded, setExpanded] = useState(false);
  const width = useRef(new Animated.Value(NAV_RAIL_WIDTH)).current;

  const animate = useCallback(
    (to: number) => {
      Animated.timing(width, {
        toValue: to,
        duration: 160,
        // Width cannot run on the native driver; the panel is small and this is
        // the only layout animation in the app.
        useNativeDriver: false,
      }).start();
    },
    [width],
  );

  const open = useCallback(() => {
    setExpanded(true);
    animate(NAV_EXPANDED_WIDTH);
  }, [animate]);

  const close = useCallback(() => {
    setExpanded(false);
    animate(NAV_RAIL_WIDTH);
  }, [animate]);

  return (
    <Animated.View style={[styles.wrapper, { width }]} pointerEvents="box-none">
      <LinearGradient
        colors={[withAlpha(theme.page, 0.98), withAlpha(theme.page, 0.92), withAlpha(theme.page, 0)]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={StyleSheet.absoluteFill}
      />

      <TVFocusGuideView autoFocus style={styles.list}>
        <View style={styles.brand}>
          {expanded ? (
            <Image
              source={require('../assets/riftn-wordmark.png')}
              style={styles.wordmark}
              resizeMode="contain"
              accessibilityLabel="Riftn TV"
            />
          ) : (
            <Image
              source={require('../assets/riftn-mark.png')}
              style={styles.mark}
              resizeMode="contain"
              accessibilityLabel="Riftn TV"
            />
          )}
        </View>

        {NAV_ITEMS.map((item) => {
          const isActive = item.key === active;
          const label =
            item.key === 'account' && isSignedIn
              ? user?.displayName || user?.username || 'Account'
              : item.label;
          return (
            <Focusable
              key={item.key}
              onPress={() => onSelect(item.key)}
              onFocus={open}
              onBlur={close}
              scaleOnFocus={false}
              ring={false}
              borderRadius={radius.pill}
            >
              {(focused) => {
                const themed = item.themeIcon && theme.icons ? theme.icons[item.themeIcon] : null;
                return (
                <View
                  style={[
                    styles.item,
                    isActive && { borderColor: focus.ring },
                    focused && { backgroundColor: focus.fill, borderColor: focus.fill },
                  ]}
                >
                  {themed ? (
                    // The theme's own icon art, full colour. Dimmed when
                    // neither focused nor active, as the glyphs are greyed.
                    <Image
                      source={themed}
                      style={[styles.themeIcon, !focused && !isActive && styles.themeIconIdle]}
                      resizeMode="contain"
                    />
                  ) : (
                    <Ionicons
                      name={item.icon}
                      size={s(24)}
                      color={
                        focused
                          ? focus.onFill
                          : isActive
                            ? colors.foreground
                            : colors.mutedForeground
                      }
                    />
                  )}
                  {expanded && (
                    <Txt
                      variant="card"
                      numberOfLines={1}
                      color={
                        focused
                          ? focus.onFill
                          : isActive
                            ? colors.foreground
                            : colors.mutedForeground
                      }
                    >
                      {label}
                    </Txt>
                  )}
                  {/* Active state is a white edge, per the house system — and
                      unlike the thin left bar it replaces, a border around the
                      whole pill has nothing an overscanning panel can crop off
                      and leave meaningless. */}
                </View>
                );
              }}
            </Focusable>
          );
        })}
      </TVFocusGuideView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    zIndex: 20,
  },
  list: {
    flex: 1,
    justifyContent: 'center',
    // Below the brand mark, which is pinned to the top safe line. Seven items
    // centred in the full height would run the first one into it.
    paddingTop: OVERSCAN.y + s(44),
    paddingBottom: OVERSCAN.y,
    // 34 + the item's own 14 puts the icon's left edge on the 48dp safe line.
    paddingLeft: s(34),
    paddingRight: spacing.md,
    gap: s(6),
  },
  brand: {
    height: s(52),
    justifyContent: 'center',
    // No extra inset — the wordmark's left edge lines up with the icons below it.
    marginBottom: spacing.xl,
    position: 'absolute',
    top: OVERSCAN.y,
    left: OVERSCAN.x,
  },
  mark: {
    // The glyph is taller than wide; this keeps it the height of a nav icon
    // and optically centred over the icon column.
    width: s(20),
    height: s(26),
    marginLeft: s(2),
  },
  wordmark: {
    width: s(92),
    height: s(27),
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    height: s(48),
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    // Reserved so the active border does not resize the row when it appears.
    borderWidth: s(2),
    borderColor: 'transparent',
  },
  themeIcon: {
    // A touch larger than the glyphs: the theme art is drawn with its own
    // padding, so at 24 it reads smaller than the Ionicons beside it.
    width: s(28),
    height: s(28),
    marginHorizontal: -s(2),
  },
  themeIconIdle: {
    opacity: 0.7,
  },
});
