import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useNavigation, type NavigationProp } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { Grid } from '../components/Grid';
import { PosterCard } from '../components/PosterCard';
import { Txt } from '../components/Txt';
import { Badge } from '../components/Badge';
import { Loading, ErrorState, EmptyState } from '../components/States';
import { getStreamBuckets, type LiveStream, type LiveReplay } from '../services/live.service';
import { cdnPath, liveThumbnail } from '../lib/media';
import { openStream, openReplay } from '../lib/open';
import { creatorName, postTitle, resolveViewCount } from '../services/feed.service';
import { useGrid } from '../lib/useGrid';
import { timeAgo, scheduleLabel } from '../lib/format';
import { colors, spacing, OVERSCAN, STAGE_INSET } from '../config/theme';
import type { RootStackParamList } from '../navigation/types';

const COLUMNS = 4;

type Tile =
  | { kind: 'live'; key: string; stream: LiveStream }
  | { kind: 'upcoming'; key: string; stream: LiveStream }
  | { kind: 'replay'; key: string; replay: LiveReplay };

/**
 * Livestreams: live now first, then what is coming up, then recordings of
 * lives that already happened.
 *
 * Nobody being live is the common case, so that state reads as deliberate and
 * still offers the replays: a screen that says "nothing" while holding
 * watchable recordings is just wrong.
 */
export function LiveScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { cellWidth, cellHeight } = useGrid(COLUMNS, 16 / 9);

  const query = useQuery({
    queryKey: ['live', 'buckets'],
    queryFn: getStreamBuckets,
    staleTime: 60_000,
  });

  if (query.isLoading) return <Loading label="Checking who is live" />;
  if (query.isError) {
    return (
      <ErrorState detail={(query.error as Error)?.message} onRetry={() => void query.refetch()} />
    );
  }

  const live = query.data?.live ?? [];
  const upcoming = query.data?.upcoming ?? [];
  const replay = query.data?.replay ?? [];

  const tiles: Tile[] = [
    ...live.map((stream) => ({ kind: 'live' as const, key: `l${stream._id}`, stream })),
    ...upcoming.map((stream) => ({ kind: 'upcoming' as const, key: `u${stream._id}`, stream })),
    ...replay.map((r) => ({ kind: 'replay' as const, key: `r${r.stream._id}`, replay: r })),
  ];

  if (!tiles.length) {
    return (
      <EmptyState
        icon="radio-outline"
        title="No streams yet"
        detail="When a Riftn creator goes live, their stream shows up here."
      />
    );
  }

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Txt variant="title">Live</Txt>
          {live.length > 0 && <Badge label={`${live.length} live now`} tone="live" />}
        </View>
        {!live.length && (
          <Txt variant="body" color={colors.mutedForeground}>
            {replay.length
              ? 'Nobody is live right now. Catch up on recent lives below.'
              : 'Nobody is live right now.'}
          </Txt>
        )}
      </View>

      <Grid
        data={tiles}
        columns={COLUMNS}
        itemWidth={cellWidth}
        itemHeight={cellHeight}
        keyExtractor={(t) => t.key}
        renderItem={(tile, _index, autoFocus) => {
          if (tile.kind === 'replay') {
            const { item, stream } = tile.replay;
            return (
              <PosterCard
                title={postTitle(item, stream.title || 'Live replay')}
                imageUrl={liveThumbnail(stream) || (item.imageUrl ? cdnPath(item.imageUrl) : '')}
                durationSeconds={tile.replay.durationSeconds}
                subtitle={`${creatorName(item)} · ${timeAgo(stream.startedAt || item.createdAt)}`}
                views={stream.totalViews ?? resolveViewCount(item)}
                width={cellWidth}
                height={cellHeight}
                onPress={() => openReplay(navigation, tile.replay)}
                autoFocus={autoFocus}
              />
            );
          }
          const { stream } = tile;
          const isLive = tile.kind === 'live';
          return (
            <PosterCard
              title={stream.title || 'Untitled stream'}
              imageUrl={liveThumbnail(stream)}
              live={isLive}
              subtitle={
                isLive
                  ? stream.account?.displayName || stream.account?.username
                  : `${stream.account?.displayName || stream.account?.username || 'Coming up'} · ${scheduleLabel(stream.scheduledFor)}`
              }
              views={isLive ? stream.totalViews : undefined}
              width={cellWidth}
              height={cellHeight}
              // Scheduled streams have nothing to play yet; the tile is there
              // so people know to come back, and pressing it does nothing.
              onPress={isLive ? () => openStream(navigation, stream) : () => {}}
              // No filter row on this screen, so the first tile is where a
              // remote should land. Leaving it to Android's default picks
              // whatever is first in the view tree, which is not always this.
              autoFocus={autoFocus}
            />
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    // Transparent: BrowseScreen paints the theme behind every section.
    backgroundColor: 'transparent',
  },
  header: {
    paddingTop: OVERSCAN.y,
    paddingLeft: STAGE_INSET,
    paddingBottom: spacing.md,
    gap: spacing.xs,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
});
