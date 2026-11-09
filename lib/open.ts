import type { NavigationProp } from '@react-navigation/native';
import { videoUrl, cdnPath, liveHlsCandidates, liveThumbnail } from './media';
import { compactNumber } from './format';
import { creatorName, postTitle, resolveViewCount, type FeedItem } from '../services/feed.service';
import type { LiveStream, LiveReplay } from '../services/live.service';
import type { TVChannel } from '../services/liveTv.service';
import type { RootStackParamList } from '../navigation/types';

type Nav = NavigationProp<RootStackParamList>;

/**
 * The three ways into the player, in one place.
 *
 * Each content type resolves its playable URL differently and each gets it
 * wrong differently — a feed post is a progressive MP4 derived from its
 * tokenId, a stream is HLS on Riftn's own live server or on Livepeer
 * depending on `provider`, a finished live is an MP4 recording, and a channel already carries an absolute URL. Scattering that across
 * six call sites is how a rail ends up navigating to a player with an empty
 * source, which renders as a black screen with no error.
 */

export function openFeedItem(navigation: Nav, item: FeedItem) {
  const url = item.videoUrl ? cdnPath(item.videoUrl) : videoUrl(item.tokenId);
  if (!url) return;

  navigation.navigate('Player', {
    kind: 'video',
    title: item.name || 'Untitled',
    subtitle: `${creatorName(item)}  ·  ${compactNumber(resolveViewCount(item))} views`,
    sources: [url],
    poster: item.imageUrl ? cdnPath(item.imageUrl) : undefined,
    durationSeconds: item.videoDuration,
    tokenId: item.tokenId,
    isLiked: item.isLiked,
    isSaved: item.isSaved,
    creatorAddress: item.minter ?? item.minterUser?.address,
    creatorName: creatorName(item),
  });
}

export function openCreator(
  navigation: Nav,
  creator: { handle?: string; address?: string; name?: string },
) {
  // Prefer the username: it is what `/account_info` indexes fastest and what a
  // person recognises if the screen ever shows the raw handle.
  const handle = creator.handle || creator.address;
  if (!handle) return;
  navigation.navigate('Creator', {
    handle,
    address: creator.address,
    name: creator.name,
  });
}

/** Same as `openCreator`, from a feed item, so call sites do not re-derive the
 *  three fields the creator's identity is spread across. */
export function openCreatorFromItem(navigation: Nav, item: FeedItem) {
  openCreator(navigation, {
    handle: item.minterUsername ?? item.minterUser?.username,
    address: item.minter ?? item.minterUser?.address,
    name: creatorName(item),
  });
}

export function openStream(navigation: Nav, stream: LiveStream) {
  const sources = liveHlsCandidates(stream);
  if (!sources.length) return;

  navigation.navigate('Player', {
    kind: 'live',
    title: stream.title || 'Untitled stream',
    subtitle: stream.account?.displayName || stream.account?.username || undefined,
    sources,
    poster: liveThumbnail(stream) || undefined,
    streamId: stream._id,
    tokenId: stream.tokenId,
    creatorAddress: stream.account?.address ?? stream.address,
    creatorName: stream.account?.displayName || stream.account?.username,
  });
}

/** A finished live plays like any other video: the recording is an MP4. */
export function openReplay(navigation: Nav, replay: LiveReplay) {
  const { item, stream } = replay;
  navigation.navigate('Player', {
    kind: 'video',
    title: postTitle(item, stream.title || 'Live replay'),
    subtitle: `${creatorName(item)}  ·  Live replay`,
    sources: [replay.url],
    poster: liveThumbnail(stream) || (item.imageUrl ? cdnPath(item.imageUrl) : undefined),
    durationSeconds: replay.durationSeconds,
    tokenId: item.tokenId,
    isLiked: item.isLiked,
    isSaved: item.isSaved,
    creatorAddress: item.minter ?? item.minterUser?.address,
    creatorName: creatorName(item),
  });
}

export function openChannel(navigation: Nav, channel: TVChannel) {
  if (!channel.streamUrl) return;

  navigation.navigate('Player', {
    kind: 'channel',
    title: channel.name,
    subtitle: channel.country,
    sources: [channel.streamUrl],
    poster: channel.logo ?? undefined,
    channelId: channel.id,
  });
}
