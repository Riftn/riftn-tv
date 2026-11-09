/**
 * Finished lives.
 *
 * Ended broadcasts leave `/live`; what is left is the live post in the feed,
 * and only a post whose recording is saved is worth a tile.
 */
import { replayOf } from '../services/live.service';
import type { FeedItem } from '../services/feed.service';

const post = (stream: any, extra: Partial<FeedItem> = {}): FeedItem => ({
  tokenId: 7550,
  postType: 'live',
  name: 'Late night stream',
  stream,
  ...extra,
});

describe('replayOf', () => {
  it('plays the saved recording', () => {
    const r = replayOf(
      post({
        _id: 's1',
        provider: 'mediamtx',
        status: 'ENDED',
        duration: 15212,
        recording: { status: 'ready', url: 'https://cdn.example/replays/s1.mp4', durationSec: 4243 },
      }),
    );
    expect(r?.url).toBe('https://cdn.example/replays/s1.mp4');
    // The saved file can be shorter than the broadcast (storage allowance);
    // the player's scrubber must match the file, not the broadcast.
    expect(r?.durationSeconds).toBe(4243);
  });

  it('skips a live with no saved recording', () => {
    expect(replayOf(post({ _id: 's2', status: 'ENDED' }))).toBeNull();
    expect(replayOf(post({ _id: 's3', recording: { status: 'processing' } }))).toBeNull();
    expect(replayOf(post(undefined))).toBeNull();
  });

  it('skips paid or locked lives, which a TV cannot unlock', () => {
    const stream = { _id: 's4', recording: { status: 'ready', url: 'https://cdn.example/x.mp4' } };
    expect(replayOf(post(stream, { streamInfo: { isPayPerView: true } }))).toBeNull();
    expect(replayOf(post(stream, { streamInfo: { isLockContent: true } }))).toBeNull();
  });
});
