import { apiClient } from '../lib/api.client';
import { getFeed, type FeedItem } from './feed.service';

/**
 * Livestream reads.
 *
 * `GET /live` is public and returns the whole roster — every stream ever
 * created, most of them long finished — as a bare array with no pagination and
 * no server-side status filter. Twenty rows on 2026-08-24, all `OFFLINE`.
 *
 * That shape drives two decisions on this client:
 *
 * 1. The split into live / replayable happens here, once, rather than in each
 *    screen. A "Live now" rail that is empty most of the day is correct; a
 *    "Live now" rail full of streams that ended in February is not.
 * 2. Nothing here assumes the rail is non-empty. `LIVE` is genuinely rare, so
 *    the empty case is the common case and the home screen drops the rail
 *    entirely rather than rendering a header over nothing.
 */

export enum StreamStatus {
  OFFLINE = 'OFFLINE',
  LIVE = 'LIVE',
  PAUSED = 'PAUSED',
  ENDED = 'ENDED',
  SCHEDULED = 'SCHEDULED',
}

export interface LiveAccount {
  address?: string;
  username?: string;
  displayName?: string;
  avatarImageUrl?: string;
  followers?: number;
  badgeBalance?: number;
}

export interface LiveStream {
  _id: string;
  title?: string;
  description?: string;
  playbackId?: string;
  playbackUrl?: string;
  status?: string;
  categories?: string[];
  peakViewers?: number;
  totalViews?: number;
  likes?: number;
  totalTips?: number;
  /** Seconds. Present on finished streams. */
  duration?: number;
  address?: string;
  tokenId?: number;
  /** CDN-relative, e.g. `live/thumbnails/<id>.jpg`. */
  thumbnail?: string;
  /** `'mediamtx'` for Riftn's own live server; absent or `'livepeer'` otherwise. */
  provider?: string;
  /** Present once a finished broadcast has been saved to the CDN. */
  recording?: LiveRecording;
  createdAt?: string;
  startedAt?: string;
  scheduledFor?: string;
  account?: LiveAccount;
  [key: string]: any;
}

export interface LiveRecording {
  status?: string;
  url?: string;
  durationSec?: number;
}

/** `PAUSED` is a host who stepped away mid-broadcast, not a stream that ended —
 *  it stays on the live rail, which is what web and the phone app both do. */
export function isLiveNow(stream: LiveStream): boolean {
  return stream.status === StreamStatus.LIVE || stream.status === StreamStatus.PAUSED;
}

/** A finished stream is only worth a tile if Livepeer still has something to
 *  play; without a playbackId the card is a dead end. */
export function isReplayable(stream: LiveStream): boolean {
  return !isLiveNow(stream) && !!stream.playbackId && stream.status !== StreamStatus.SCHEDULED;
}

export async function getStreams(): Promise<LiveStream[]> {
  // The route defaults to twenty and sorts live first, then scheduled, then
  // recent; fifty is comfortably more than are ever on air at once.
  const res = await apiClient.get<LiveStream[] | { result?: LiveStream[] }>('/live', {
    params: { limit: 50 },
    withAuth: false,
  });
  if (Array.isArray(res)) return res;
  return Array.isArray(res?.result) ? res.result : [];
}

/**
 * A finished live, as a playable recording.
 *
 * Ended broadcasts drop off `/live` entirely; what remains of them is the live
 * POST in the feed, whose `stream.recording` points at an MP4 the server saved
 * to the CDN. Only those are worth a tile: a live post without a ready
 * recording is a poster for something that can no longer be watched.
 */
export interface LiveReplay {
  item: FeedItem;
  stream: LiveStream;
  url: string;
  durationSeconds?: number;
}

export function replayOf(item: FeedItem): LiveReplay | null {
  const stream = item.stream as LiveStream | undefined;
  const rec = stream?.recording;
  if (!stream || rec?.status !== 'ready' || !rec.url) return null;
  if (item.streamInfo?.isPayPerView || item.streamInfo?.isLockContent) return null;
  return { item, stream, url: rec.url, durationSeconds: rec.durationSec ?? stream.duration };
}

export async function getReplays(limit = 40): Promise<LiveReplay[]> {
  const res = await getFeed({ postType: 'live', sortBy: 'createdAt', limit });
  return res.result.map(replayOf).filter((r): r is LiveReplay => !!r);
}

export interface StreamBuckets {
  live: LiveStream[];
  /** Announced and not yet on air. Shown, not playable. */
  upcoming: LiveStream[];
  replay: LiveReplay[];
}

function newestFirst(a: LiveStream, b: LiveStream): number {
  const at = Date.parse(a.startedAt || a.createdAt || '') || 0;
  const bt = Date.parse(b.startedAt || b.createdAt || '') || 0;
  return bt - at;
}

function soonestFirst(a: LiveStream, b: LiveStream): number {
  return (Date.parse(a.scheduledFor || '') || 0) - (Date.parse(b.scheduledFor || '') || 0);
}

export async function getStreamBuckets(): Promise<StreamBuckets> {
  // Replays failing must not take the live list down with them, and vice
  // versa: a Live screen that can show either is better than an error.
  const [streams, replays] = await Promise.allSettled([getStreams(), getReplays()]);
  const all = streams.status === 'fulfilled' ? streams.value : [];
  const replay = replays.status === 'fulfilled' ? replays.value : [];
  if (streams.status === 'rejected' && replays.status === 'rejected') throw streams.reason;
  const now = Date.now();
  return {
    live: all.filter(isLiveNow).sort(newestFirst),
    upcoming: all
      .filter(
        (s) =>
          s.status === StreamStatus.SCHEDULED &&
          (Date.parse(s.scheduledFor || '') || 0) > now - 60 * 60 * 1000,
      )
      .sort(soonestFirst),
    replay,
  };
}

export async function getStream(streamId: string): Promise<LiveStream | null> {
  const res = await apiClient.get<LiveStream | { result?: LiveStream }>(
    `/live/${encodeURIComponent(streamId)}`,
  );
  if (!res) return null;
  return (res as any).result ?? (res as LiveStream);
}
