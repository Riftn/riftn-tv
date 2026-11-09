import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useQuery } from '@tanstack/react-query';
import { Txt } from './Txt';
import { getChat, getChatHistory, type ChatLine } from '../services/liveChat.service';
import { colors, spacing, OVERSCAN, s } from '../config/theme';

/** Lines on screen. More than this and the column climbs over the picture. */
const VISIBLE_LINES = 7;
const POLL_MS = 3_000;

/**
 * The stream's chat, down the right edge of the picture.
 *
 * Passive on purpose: nothing in it takes focus, so it never steals the
 * remote from the player controls, and it is toggled from the control bar.
 * Live, it polls the room every few seconds. On a replay it loads the whole
 * chat once and plays it back in step with the recording: a line shows when
 * the video reaches the moment it was sent, so the room reacts on cue.
 */
export function LiveChatOverlay({
  room,
  visible,
  replayStartedAt,
  positionSeconds,
  raised,
}: {
  room: string;
  visible: boolean;
  /** Set for a replay: when the live started (ms), to line chat up with playback. */
  replayStartedAt?: number;
  positionSeconds?: number;
  /** The control bar is up; sit above it. */
  raised?: boolean;
}) {
  const isReplay = typeof replayStartedAt === 'number';

  const live = useQuery({
    queryKey: ['livechat', room],
    queryFn: () => getChat(room),
    enabled: visible && !isReplay,
    refetchInterval: visible && !isReplay ? POLL_MS : false,
    staleTime: 0,
  });

  const history = useQuery({
    queryKey: ['livechat', 'history', room],
    queryFn: () => getChatHistory(room),
    enabled: visible && isReplay,
    staleTime: 10 * 60 * 1000,
  });

  const lines = useMemo<ChatLine[]>(() => {
    if (!isReplay) return (live.data ?? []).slice(-VISIBLE_LINES);
    const now = (replayStartedAt ?? 0) + (positionSeconds ?? 0) * 1000;
    const shown = (history.data ?? []).filter((l) => l.at <= now);
    return shown.slice(-VISIBLE_LINES);
  }, [isReplay, live.data, history.data, replayStartedAt, positionSeconds]);

  if (!visible) return null;
  const empty = lines.length === 0;
  const loading = isReplay ? history.isLoading : live.isLoading;

  return (
    <View style={[styles.column, raised && styles.columnRaised]} pointerEvents="none">
      <LinearGradient
        colors={['rgba(1,3,5,0)', 'rgba(1,3,5,0.72)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 0.35 }}
        style={styles.scrim}
      />
      <Txt variant="meta" color={colors.neutrals[300]} style={styles.heading}>
        {isReplay ? 'Chat replay' : 'Live chat'}
      </Txt>
      {empty ? (
        <Txt variant="meta" color={colors.neutrals[400]}>
          {loading ? 'Loading chat…' : isReplay ? 'No chat yet at this point.' : 'Nobody has said anything yet.'}
        </Txt>
      ) : (
        lines.map((line) => (
          <View key={line.id} style={styles.line}>
            {line.avatar ? (
              <Image source={{ uri: line.avatar }} style={avatarStyle} contentFit="cover" cachePolicy="memory-disk" />
            ) : (
              <View style={avatarStyle} />
            )}
            <View style={styles.lineBody}>
              <Txt variant="meta" numberOfLines={1} color={line.moderator ? '#4FE3E0' : colors.neutrals[300]}>
                {line.name}
                {line.tier ? `  ·  ${line.tier}` : ''}
              </Txt>
              <Txt variant="card" numberOfLines={3}>
                {line.text}
              </Txt>
            </View>
          </View>
        ))
      )}
    </View>
  );
}

const avatarStyle = {
  width: s(30),
  height: s(30),
  borderRadius: s(15),
  backgroundColor: colors.neutrals[800],
} as const;

const styles = StyleSheet.create({
  column: {
    position: 'absolute',
    right: OVERSCAN.x,
    bottom: OVERSCAN.y,
    width: s(330),
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    gap: spacing.sm,
    justifyContent: 'flex-end',
  },
  columnRaised: {
    // Clear of the control bar (buttons plus the progress row).
    bottom: OVERSCAN.y + s(150),
  },
  scrim: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: s(14),
  },
  heading: {
    marginBottom: s(2),
  },
  line: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'flex-start',
  },
  lineBody: {
    flex: 1,
    gap: s(1),
  },
});
