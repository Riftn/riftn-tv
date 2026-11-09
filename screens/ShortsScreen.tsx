import React, { useCallback, useEffect, useRef, useState } from 'react';
import { BackHandler, StyleSheet, View, useWindowDimensions } from 'react-native';
import {
  useNavigation,
  useRoute,
  type NavigationProp,
  type RouteProp,
} from '@react-navigation/native';
import { Image } from 'expo-image';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useEvent, useEventListener } from 'expo';
import { useKeepAwake } from 'expo-keep-awake';
import { Ionicons } from '@expo/vector-icons';
import { Txt } from '../components/Txt';
import { Focusable } from '../components/Focusable';
import { CommentsPanel } from '../components/CommentsPanel';
import { useTVEventHandler } from '../lib/tv';
import { compactNumber } from '../lib/format';
import { openCreator, toShortClip } from '../lib/open';
import { useFocusColors } from '../lib/useFocusColors';
import { getFeed, isPlayableOnTv } from '../services/feed.service';
import { react, toggleSave } from '../services/engagement.service';
import { useAuth } from '../contexts/AuthContext';
import { colors, radius, spacing, OVERSCAN, s } from '../config/theme';
import type { RootStackParamList, ShortClip } from '../navigation/types';

/** Load the next page this many clips before the end, so it is there in time. */
const PREFETCH_AT = 3;

/**
 * Shorts, the way the phone shows them: one vertical clip at a time, full
 * height, centred, with the poster blurred out to the edges of the panel.
 *
 * Up and down on the remote are the swipe. That only works because nothing
 * focusable sits above or below the controls: the buttons are one horizontal
 * row, so the focus engine has nowhere to move on up/down and the press is
 * free to mean "next clip". A clip that finishes rolls into the next one.
 */
export function ShortsScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'Shorts'>>();
  const { isSignedIn } = useAuth();
  const { height } = useWindowDimensions();
  const focus = useFocusColors();
  useKeepAwake();

  const [clips, setClips] = useState<ShortClip[]>(route.params.clips);
  const [index, setIndex] = useState(route.params.index);
  const nextPage = useRef(route.params.nextPage);
  const loadingMore = useRef(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const clip = clips[index];

  // Likes and saves the viewer changed here, by clip, so moving away and back
  // shows what they did rather than what the feed said before.
  const [liked, setLiked] = useState<Record<string, boolean>>({});
  const [saved, setSaved] = useState<Record<string, boolean>>({});
  const id = clip ? String(clip.tokenId) : '';
  const isLiked = liked[id] ?? !!clip?.isLiked;
  const isSaved = saved[id] ?? !!clip?.isSaved;

  const player = useVideoPlayer(clip?.url ?? null, (p) => {
    p.loop = false;
    p.play();
  });
  const { status } = useEvent(player, 'statusChange', { status: player.status, error: undefined });

  // Swap the source when the clip changes. The first clip is already loading
  // from the hook above, so the first run is skipped.
  const firstUrl = useRef<string | undefined>(clip?.url);
  useEffect(() => {
    if (!clip || clip.url === firstUrl.current) return;
    firstUrl.current = undefined;
    void player.replaceAsync(clip.url).then(() => player.play());
  }, [clip?.url]);

  const go = useCallback(
    (delta: number) => {
      setCommentsOpen(false);
      setIndex((i) => Math.min(Math.max(i + delta, 0), clips.length - 1));
    },
    [clips.length],
  );

  useEventListener(player, 'playToEnd', () => {
    if (index < clips.length - 1) go(1);
    else player.replay();
  });

  // A clip that will not play is skipped rather than shown as an error: in a
  // stream of shorts the next one is what the viewer wants anyway.
  useEffect(() => {
    if (status === 'error' && index < clips.length - 1) go(1);
  }, [status, index, clips.length, go]);

  // More clips before the viewer runs out.
  useEffect(() => {
    if (nextPage.current == null || loadingMore.current) return;
    if (index < clips.length - PREFETCH_AT) return;
    loadingMore.current = true;
    const page = nextPage.current;
    getFeed({ postType: 'short', sortBy: 'createdAt', page, limit: 20 })
      .then((res) => {
        const seen = new Set(clips.map((c) => String(c.tokenId)));
        const more = res.result
          .filter(isPlayableOnTv)
          .map(toShortClip)
          .filter((c): c is ShortClip => !!c && !seen.has(String(c.tokenId)));
        setClips((prev) => [...prev, ...more]);
        nextPage.current = res.pagination?.hasMore ? page + 1 : undefined;
      })
      .catch(() => undefined)
      .finally(() => {
        loadingMore.current = false;
      });
  }, [index, clips]);

  useTVEventHandler(
    useCallback(
      (evt: { eventType: string }) => {
        if (commentsOpen) return;
        if (evt.eventType === 'up') go(-1);
        else if (evt.eventType === 'down') go(1);
        else if (evt.eventType === 'playPause') {
          if (player.playing) player.pause();
          else player.play();
        }
      },
      [commentsOpen, go, player],
    ),
  );

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (commentsOpen) {
        setCommentsOpen(false);
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [commentsOpen]);

  const onLike = useCallback(async () => {
    if (!clip) return;
    const key = String(clip.tokenId);
    setLiked((m) => ({ ...m, [key]: !isLiked }));
    try {
      await react(clip.tokenId, 'like');
    } catch {
      setLiked((m) => ({ ...m, [key]: isLiked }));
    }
  }, [clip, isLiked]);

  const onSave = useCallback(async () => {
    if (!clip) return;
    const key = String(clip.tokenId);
    setSaved((m) => ({ ...m, [key]: !isSaved }));
    try {
      await toggleSave(clip.tokenId);
    } catch {
      setSaved((m) => ({ ...m, [key]: isSaved }));
    }
  }, [clip, isSaved]);

  if (!clip) return null;

  const videoHeight = height;
  const videoWidth = Math.round((height * 9) / 16);

  return (
    <View style={styles.root}>
      {!!clip.poster && (
        <Image source={{ uri: clip.poster }} style={StyleSheet.absoluteFill} contentFit="cover" blurRadius={40} />
      )}
      <View style={styles.dim} />

      <View style={[styles.stage, { width: videoWidth, height: videoHeight }]}>
        <VideoView
          player={player}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          nativeControls={false}
          fullscreenOptions={{ enable: false }}
          allowsPictureInPicture={false}
        />
        {status === 'loading' && !!clip.poster && (
          <Image source={{ uri: clip.poster }} style={StyleSheet.absoluteFill} contentFit="cover" />
        )}
      </View>

      <View style={styles.left} pointerEvents="none">
        <Txt variant="rail">Quick clips</Txt>
        <Txt variant="meta" color={colors.neutrals[300]}>
          {index + 1} of {clips.length}
          {nextPage.current != null ? '+' : ''}
        </Txt>
        <View style={styles.hint}>
          <Ionicons name="chevron-up" size={s(18)} color={colors.neutrals[300]} />
          <Txt variant="meta" color={colors.neutrals[300]}>
            Previous
          </Txt>
        </View>
        <View style={styles.hint}>
          <Ionicons name="chevron-down" size={s(18)} color={colors.neutrals[300]} />
          <Txt variant="meta" color={colors.neutrals[300]}>
            Next
          </Txt>
        </View>
      </View>

      <View style={styles.right}>
        {!!clip.title && (
          <Txt variant="title" numberOfLines={3}>
            {clip.title}
          </Txt>
        )}
        <Txt variant="body" color={colors.neutrals[300]} numberOfLines={1}>
          {clip.creatorName}  ·  {compactNumber(clip.views)} views
        </Txt>

        <View style={styles.buttons}>
          {isSignedIn && (
            <>
              <RoundButton
                icon={isLiked ? 'heart' : 'heart-outline'}
                label={isLiked ? 'Liked' : 'Like'}
                onPress={onLike}
                autoFocus
                focus={focus}
              />
              <RoundButton
                icon={isSaved ? 'bookmark' : 'bookmark-outline'}
                label={isSaved ? 'Saved' : 'Save'}
                onPress={onSave}
                focus={focus}
              />
            </>
          )}
          <RoundButton
            icon={commentsOpen ? 'chatbubble' : 'chatbubble-outline'}
            label="Comments"
            onPress={() => setCommentsOpen((v) => !v)}
            autoFocus={!isSignedIn}
            focus={focus}
          />
          {(!!clip.creatorAddress || !!clip.creatorHandle) && (
            <RoundButton
              icon="person-outline"
              label="Creator"
              onPress={() =>
                openCreator(navigation, {
                  handle: clip.creatorHandle,
                  address: clip.creatorAddress,
                  name: clip.creatorName,
                })
              }
              focus={focus}
            />
          )}
        </View>
      </View>

      <CommentsPanel tokenId={clip.tokenId} visible={commentsOpen} />
    </View>
  );
}

function RoundButton({
  icon,
  label,
  onPress,
  autoFocus,
  focus,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  autoFocus?: boolean;
  focus: ReturnType<typeof useFocusColors>;
}) {
  return (
    <Focusable onPress={onPress} autoFocus={autoFocus} scaleOnFocus={false} ring={false} borderRadius={radius.pill}>
      {(focused) => (
        <View style={styles.roundWrap}>
          <View style={[styles.round, focused && { backgroundColor: focus.fill, borderColor: focus.fill }]}>
            <Ionicons name={icon} size={s(22)} color={focused ? focus.onFill : colors.foreground} />
          </View>
          <Txt variant="meta" color={focused ? colors.foreground : colors.neutrals[300]}>
            {label}
          </Txt>
        </View>
      )}
    </Focusable>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.62)',
  },
  stage: {
    backgroundColor: '#000',
    overflow: 'hidden',
  },
  left: {
    position: 'absolute',
    left: OVERSCAN.x,
    top: OVERSCAN.y + spacing.md,
    gap: spacing.xs,
  },
  hint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  right: {
    position: 'absolute',
    right: OVERSCAN.x,
    bottom: OVERSCAN.y + spacing.md,
    // Clear of the centred 9:16 video on a 960dp panel.
    width: s(270),
    gap: spacing.sm,
  },
  buttons: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  roundWrap: {
    alignItems: 'center',
    gap: s(4),
  },
  round: {
    width: s(56),
    height: s(56),
    borderRadius: s(28),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: s(2),
    borderColor: 'rgba(255,255,255,0.18)',
  },
});
