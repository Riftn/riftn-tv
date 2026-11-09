import { chatRoomFor, toChatLines } from '../services/liveChat.service';

describe('live chat lines', () => {
  it('uses the stream post id as the room', () => {
    expect(chatRoomFor(7550)).toBe('stream:7550');
  });

  it('keeps text messages, oldest first, and drops media', () => {
    const lines = toChatLines([
      {
        id: 'b',
        content: 'second',
        messageType: 'text',
        createdAt: '2026-11-08T15:39:31.000Z',
        sender: { username: 'bob', badgeLock: { tier: 'King Cobra' } },
      },
      { id: 'g', content: 'https://gif', messageType: 'gif', createdAt: '2026-11-08T15:39:32.000Z' },
      { id: 'e', content: '   ', messageType: 'text', createdAt: '2026-11-08T15:39:33.000Z' },
      {
        id: 'a',
        content: ' first ',
        messageType: 'text',
        createdAt: '2026-11-08T15:39:30.000Z',
        sender: { displayName: 'Ann', username: 'ann', isModerator: true },
      },
    ]);
    expect(lines.map((l) => l.id)).toEqual(['a', 'b']);
    expect(lines[0]).toMatchObject({ name: 'Ann', text: 'first', moderator: true, tier: null });
    expect(lines[1]).toMatchObject({ name: 'bob', tier: 'King Cobra', moderator: false });
  });
});
