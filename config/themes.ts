import type { ImageSourcePropType } from 'react-native';

/**
 * Riftn's themes, on the television.
 *
 * The same twelve dark themes the site and the phone app offer, with the same
 * page colours and accents (dehub-mobile theme/colors.ts). What differs is the
 * backdrop. The site and the phone run each theme's scene live (Three.js and
 * canvas); a TV box has a phone-class GPU from five years ago and is also
 * decoding 1080p video, so here the backdrop is one still frame of that same
 * scene, rendered at 1280x720 from the web code and shipped in the APK. It is
 * dimmed under the content, so the art reads as a mood, not a wallpaper
 * competing with the posters.
 *
 * Nav icons are the theme's own icon set from the site (theme-icons), so a
 * themed TV looks like the themed site instead of a recoloured System.
 */

export type TvThemeKey =
  | 'system'
  | 'hazy'
  | 'osaka'
  | 'war'
  | 'jungle'
  | 'island'
  | 'hacker'
  | 'horror'
  | 'cosmic'
  | 'swarms'
  | 'lavalamp'
  | 'winter';

export type ThemeIconKey = 'home' | 'videos' | 'live' | 'tv' | 'search' | 'paint' | 'profile';

export interface TvTheme {
  key: TvThemeKey;
  name: string;
  /** Page colour: under the backdrop, and what every fade ends in. */
  page: string;
  /** Focus fill and the active edge. White on the glass themes, as on web. */
  accent: string;
  /** Text and icons on an accent fill. */
  accentForeground: string;
  backdrop: ImageSourcePropType | null;
  icons: Record<ThemeIconKey, ImageSourcePropType> | null;
}

const WHITE = '#F4F4F5';
const INK = '#09090B';

/* eslint-disable @typescript-eslint/no-require-imports */
const ICONS: Record<Exclude<TvThemeKey, 'system'>, Record<ThemeIconKey, ImageSourcePropType>> = {
  hazy: {
    home: require('../assets/themes/hazy/home.webp'),
    videos: require('../assets/themes/hazy/videos.webp'),
    live: require('../assets/themes/hazy/live.webp'),
    tv: require('../assets/themes/hazy/tv.webp'),
    search: require('../assets/themes/hazy/search.webp'),
    paint: require('../assets/themes/hazy/paint.webp'),
    profile: require('../assets/themes/hazy/profile.webp'),
  },
  osaka: {
    home: require('../assets/themes/osaka/home.webp'),
    videos: require('../assets/themes/osaka/videos.webp'),
    live: require('../assets/themes/osaka/live.webp'),
    tv: require('../assets/themes/osaka/tv.webp'),
    search: require('../assets/themes/osaka/search.webp'),
    paint: require('../assets/themes/osaka/paint.webp'),
    profile: require('../assets/themes/osaka/profile.webp'),
  },
  war: {
    home: require('../assets/themes/war/home.webp'),
    videos: require('../assets/themes/war/videos.webp'),
    live: require('../assets/themes/war/live.webp'),
    tv: require('../assets/themes/war/tv.webp'),
    search: require('../assets/themes/war/search.webp'),
    paint: require('../assets/themes/war/paint.webp'),
    profile: require('../assets/themes/war/profile.webp'),
  },
  jungle: {
    home: require('../assets/themes/jungle/home.webp'),
    videos: require('../assets/themes/jungle/videos.webp'),
    live: require('../assets/themes/jungle/live.webp'),
    tv: require('../assets/themes/jungle/tv.webp'),
    search: require('../assets/themes/jungle/search.webp'),
    paint: require('../assets/themes/jungle/paint.webp'),
    profile: require('../assets/themes/jungle/profile.webp'),
  },
  island: {
    home: require('../assets/themes/island/home.webp'),
    videos: require('../assets/themes/island/videos.webp'),
    live: require('../assets/themes/island/live.webp'),
    tv: require('../assets/themes/island/tv.webp'),
    search: require('../assets/themes/island/search.webp'),
    paint: require('../assets/themes/island/paint.webp'),
    profile: require('../assets/themes/island/profile.webp'),
  },
  hacker: {
    home: require('../assets/themes/hacker/home.webp'),
    videos: require('../assets/themes/hacker/videos.webp'),
    live: require('../assets/themes/hacker/live.webp'),
    tv: require('../assets/themes/hacker/tv.webp'),
    search: require('../assets/themes/hacker/search.webp'),
    paint: require('../assets/themes/hacker/paint.webp'),
    profile: require('../assets/themes/hacker/profile.webp'),
  },
  horror: {
    home: require('../assets/themes/horror/home.webp'),
    videos: require('../assets/themes/horror/videos.webp'),
    live: require('../assets/themes/horror/live.webp'),
    tv: require('../assets/themes/horror/tv.webp'),
    search: require('../assets/themes/horror/search.webp'),
    paint: require('../assets/themes/horror/paint.webp'),
    profile: require('../assets/themes/horror/profile.webp'),
  },
  cosmic: {
    home: require('../assets/themes/cosmic/home.webp'),
    videos: require('../assets/themes/cosmic/videos.webp'),
    live: require('../assets/themes/cosmic/live.webp'),
    tv: require('../assets/themes/cosmic/tv.webp'),
    search: require('../assets/themes/cosmic/search.webp'),
    paint: require('../assets/themes/cosmic/paint.webp'),
    profile: require('../assets/themes/cosmic/profile.webp'),
  },
  swarms: {
    home: require('../assets/themes/swarms/home.webp'),
    videos: require('../assets/themes/swarms/videos.webp'),
    live: require('../assets/themes/swarms/live.webp'),
    tv: require('../assets/themes/swarms/tv.webp'),
    search: require('../assets/themes/swarms/search.webp'),
    paint: require('../assets/themes/swarms/paint.webp'),
    profile: require('../assets/themes/swarms/profile.webp'),
  },
  lavalamp: {
    home: require('../assets/themes/lavalamp/home.webp'),
    videos: require('../assets/themes/lavalamp/videos.webp'),
    live: require('../assets/themes/lavalamp/live.webp'),
    tv: require('../assets/themes/lavalamp/tv.webp'),
    search: require('../assets/themes/lavalamp/search.webp'),
    paint: require('../assets/themes/lavalamp/paint.webp'),
    profile: require('../assets/themes/lavalamp/profile.webp'),
  },
  winter: {
    home: require('../assets/themes/winter/home.webp'),
    videos: require('../assets/themes/winter/videos.webp'),
    live: require('../assets/themes/winter/live.webp'),
    tv: require('../assets/themes/winter/tv.webp'),
    search: require('../assets/themes/winter/search.webp'),
    paint: require('../assets/themes/winter/paint.webp'),
    profile: require('../assets/themes/winter/profile.webp'),
  },
};

const BACKDROPS: Record<Exclude<TvThemeKey, 'system'>, ImageSourcePropType> = {
  hazy: require('../assets/themes/hazy/backdrop.jpg'),
  osaka: require('../assets/themes/osaka/backdrop.jpg'),
  war: require('../assets/themes/war/backdrop.jpg'),
  jungle: require('../assets/themes/jungle/backdrop.jpg'),
  island: require('../assets/themes/island/backdrop.jpg'),
  hacker: require('../assets/themes/hacker/backdrop.jpg'),
  horror: require('../assets/themes/horror/backdrop.jpg'),
  cosmic: require('../assets/themes/cosmic/backdrop.jpg'),
  swarms: require('../assets/themes/swarms/backdrop.jpg'),
  lavalamp: require('../assets/themes/lavalamp/backdrop.jpg'),
  winter: require('../assets/themes/winter/backdrop.jpg'),
};
/* eslint-enable @typescript-eslint/no-require-imports */

function canvas(
  key: Exclude<TvThemeKey, 'system'>,
  name: string,
  page: string,
  accent = WHITE,
  accentForeground = INK,
): TvTheme {
  return { key, name, page, accent, accentForeground, backdrop: BACKDROPS[key], icons: ICONS[key] };
}

/** In the order the site's theme picker lists them. */
export const TV_THEMES: TvTheme[] = [
  { key: 'system', name: 'System', page: '#010305', accent: WHITE, accentForeground: INK, backdrop: null, icons: null },
  canvas('hazy', 'Hazy Nights', '#0A0714'),
  canvas('osaka', 'Osaka', '#0A0812', '#FF6FB5', '#0A0812'),
  canvas('war', 'War', '#060A09', '#4FE3E0', '#060A09'),
  canvas('jungle', 'Jungle', '#16110C', '#E2B060', '#16110C'),
  canvas('island', 'Island', '#1A2A4A', '#FF7A8A', '#1A2A4A'),
  canvas('hacker', 'Hacker', '#000000', '#39FF88', '#000000'),
  canvas('horror', 'Horror', '#070506', '#FF2B2B', '#FFFFFF'),
  canvas('cosmic', 'Cosmic', '#040407'),
  canvas('swarms', 'Swarms', '#03080D'),
  canvas('lavalamp', 'Lava Lamp', '#120704'),
  canvas('winter', 'Winter', '#05070A'),
];

export const DEFAULT_THEME = TV_THEMES[0];

export function findTheme(key: string | null | undefined): TvTheme {
  return TV_THEMES.find((t) => t.key === key) ?? DEFAULT_THEME;
}

/** `#RRGGBB` at an alpha, for fades that end in the page colour. */
export function withAlpha(hex: string, alpha: number): string {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
}
