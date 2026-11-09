import { apiClient } from '../lib/api.client';
import { avatarUrl } from '../lib/media';

/**
 * A stream's chat, read over REST.
 *
 * The site and the phone app take chat over the `/livechat` socket. A TV only
 * reads it (typing on a remote is not a thing anyone wants), and polling the
 * public history endpoint every few seconds gets the same messages without a
 * socket connection, its reconnect logic, or a second auth path. It answers
 * signed out, so chat shows on a signed-out TV too.
 *
 * Room ids are `stream:<tokenId>`, the post id of the live, so a finished
 * live's replay can show the chat that ran alongside it.
 */

interface RawChatMessage {
  id?: string;
  _id?: string;
  content?: string;
  messageType?: string;
  createdAt?: string;
  sender?: {
    address?: string;
    username?: string;
    displayName?: string;
    avatarUrl?: string;
    isModerator?: boolean;
    badgeLock?: { tier?: string } | null;
  };
}

export interface ChatLine {
  id: string;
  name: string;
  avatar: string;
  text: string;
  /** Badge tier name, e.g. "King Cobra", or null. */
  tier: string | null;
  moderator: boolean;
  at: number;
}

export function chatRoomFor(tokenId: string | number): string {
  return `stream:${tokenId}`;
}

/** Text messages, oldest first, so the newest sits at the bottom like every chat. */
export function toChatLines(raw: RawChatMessage[]): ChatLine[] {
  const lines: ChatLine[] = [];
  for (const m of raw) {
    const id = String(m.id ?? m._id ?? '');
    const text = typeof m.content === 'string' ? m.content.trim() : '';
    // Images, GIFs and voice notes have nothing to show as a line of text.
    if (!id || !text || (m.messageType && m.messageType !== 'text')) continue;
    const sender = m.sender ?? {};
    lines.push({
      id,
      name: sender.displayName || sender.username || 'Someone',
      avatar: sender.avatarUrl ? avatarUrl(sender.avatarUrl, 48) : '',
      text,
      tier: sender.badgeLock?.tier ?? null,
      moderator: !!sender.isModerator,
      at: m.createdAt ? Date.parse(m.createdAt) || 0 : 0,
    });
  }
  return lines.sort((a, b) => a.at - b.at);
}

export async function getChat(room: string, limit = 30): Promise<ChatLine[]> {
  const res = await apiClient.get<{ messages?: RawChatMessage[] }>('/livechat/messages', {
    params: { roomId: room, limit },
  });
  return toChatLines(res?.messages ?? []);
}

/**
 * A finished live's whole chat, for replaying it in step with the recording.
 * Pages back 100 at a time (the server's cap) up to `maxPages`; a five-hundred
 * line chat is a very busy live.
 */
export async function getChatHistory(room: string, maxPages = 5): Promise<ChatLine[]> {
  const raw: RawChatMessage[] = [];
  let before: string | undefined;
  for (let page = 0; page < maxPages; page++) {
    const res = await apiClient.get<{ messages?: RawChatMessage[]; hasMore?: boolean }>(
      '/livechat/messages',
      { params: before ? { roomId: room, limit: 100, before } : { roomId: room, limit: 100 } },
    );
    const batch = res?.messages ?? [];
    raw.push(...batch);
    const oldest = batch[batch.length - 1];
    before = oldest ? String(oldest.id ?? oldest._id ?? '') : undefined;
    if (!res?.hasMore || !before) break;
  }
  return toChatLines(raw);
}
