import { colors } from '../config/theme';
import { useTvTheme } from '../contexts/ThemeContext';

/**
 * The focus look for the current theme.
 *
 * Focus is the cursor, so it takes the theme's accent: Osaka's pink, War's
 * HUD cyan, Hacker's green. The glass themes and System keep the white fill
 * the house system uses. Text on the fill flips to the theme's ink so it stays
 * readable on any accent.
 */
export function useFocusColors() {
  const { theme } = useTvTheme();
  return {
    /** Fill of a focused pill or button. */
    fill: theme.accent,
    /** Text and icons on that fill. */
    onFill: theme.accentForeground,
    /** The ring around a focused tile, and the edge of the active pill. */
    ring: theme.key === 'system' ? colors.borderFocused : theme.accent,
  };
}
