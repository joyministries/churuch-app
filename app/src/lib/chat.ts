import type { ComponentProps } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { palette } from './theme';
import { ministries } from './brand';

type IconName = ComponentProps<typeof Ionicons>['name'];

export type RoomKind = 'church' | 'ministry' | 'team';

export interface ChatRoom {
  id: string;
  kind: RoomKind;
  name: string;
  /** One line shown under the name in the hub. */
  short: string;
  description: string;
  leader: string;
  meeting: string;
  members: string[];
  memberCount: number;
  ministryId?: string;
  color: string;
  icon: IconName;
  joinedByDefault: boolean;
  /** What this room is for — shown at the top of the thread. */
  pinned: string;
}

export interface ChatMessage {
  id: string;
  roomId: string;
  author: string;
  body: string;
  /** epoch ms */
  at: number;
  mine?: boolean;
}

const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;
const now = Date.now();

const memberNames: Record<string, string[]> = {
  'church-family': [
    'Church office',
    'Nomsa M.',
    'Thabo D.',
    'Sis Anna',
    'Lerato K.',
    'Johan V.',
    'Grace P.',
    'Sipho M.',
  ],
  'prayer-chain': ['Sis Anna', 'Nomsa M.', 'Thabo D.', 'Grace P.', 'Lerato K.'],
  'ministry-youth': ['Sipho M.', 'Thabo D.', 'Lerato K.', 'Kabelo N.', 'Zanele S.'],
  'ministry-young-adults': ['Johan V.', 'Grace P.', 'Nomsa M.'],
  'ministry-women': ['Sis Anna', 'Nomsa M.', 'Grace P.', 'Zanele S.'],
  'ministry-men': ['Thabo D.', 'Johan V.', 'Sipho M.', 'Kabelo N.'],
  'ministry-children': ['Grace P.', 'Lerato K.', 'Zanele S.'],
  'ministry-intercessors': ['Sis Anna', 'Grace P.', 'Nomsa M.'],
};

function ministryRoom(id: string): ChatRoom {
  const ministry = ministries.find((m) => m.id === id)!;
  const members = memberNames[`ministry-${id}`] ?? [ministry.name];
  return {
    id: `ministry-${id}`,
    kind: 'ministry',
    name: ministry.name,
    short: ministry.gathering,
    description: ministry.blurb,
    leader: members[0],
    meeting: ministry.gathering,
    members,
    memberCount: 9 + members.length * 3,
    ministryId: id,
    color: ministry.color,
    icon: ministry.icon,
    // Youth, women and intercessors are "already in" so the hub shows both states.
    joinedByDefault: ['youth', 'women', 'intercessors'].includes(id),
    pinned: ministry.rhythm,
  };
}

export const chatRooms: ChatRoom[] = [
  {
    id: 'church-family',
    kind: 'church',
    name: 'Church family',
    short: 'Everyone at Joy Lambton',
    description:
      'The main room for the whole congregation — service reminders, announcements from the office, and encouragement through the week.',
    leader: 'Church office',
    meeting: 'Open all week',
    members: memberNames['church-family'],
    memberCount: 214,
    color: palette.brandBlue,
    icon: 'people-outline',
    joinedByDefault: true,
    pinned: 'Be kind, be clear, and keep prayer requests in the prayer chain.',
  },
  {
    id: 'prayer-chain',
    kind: 'team',
    name: 'Prayer chain',
    short: 'Watchmen & intercessors',
    description:
      'The engine room. Requests that need covering, night watch rotas, and testimony of what God has done.',
    leader: 'Sis Anna',
    meeting: 'Night watch · Wednesdays 22:00',
    members: memberNames['prayer-chain'],
    memberCount: 38,
    color: palette.violet,
    icon: 'flame-outline',
    joinedByDefault: true,
    pinned: 'Everything shared here stays here. Pray first, reply second.',
  },
  ...ministries.map((m) => ministryRoom(m.id)),
];

export function roomById(id?: string | null) {
  if (!id) return null;
  return chatRooms.find((r) => r.id === id) ?? null;
}

/* ------------------------------------------------------------------ */
/* Seed conversation                                                   */
/* ------------------------------------------------------------------ */

export const seedMessages: ChatMessage[] = [
  // Church family
  {
    id: 'cf-1',
    roomId: 'church-family',
    author: 'Church office',
    body: 'Good morning family. Sunday service starts at 10:00, doors open at 09:15 — coffee is on us before the meeting.',
    at: now - 2 * DAY - 3 * HOUR,
  },
  {
    id: 'cf-2',
    roomId: 'church-family',
    author: 'Nomsa M.',
    body: 'Thank you for the reminder. Bringing a visitor with me this week 🙏',
    at: now - 2 * DAY - 2 * HOUR,
  },
  {
    id: 'cf-3',
    roomId: 'church-family',
    author: 'Thabo D.',
    body: 'The youth worship night was unreal. Still thinking about that last song.',
    at: now - DAY - 5 * HOUR,
  },
  {
    id: 'cf-4',
    roomId: 'church-family',
    author: 'You',
    body: 'Grateful for the prayer support last week — really felt it. See you Sunday.',
    at: now - DAY - 90 * MIN,
    mine: true,
  },
  {
    id: 'cf-5',
    roomId: 'church-family',
    author: 'Sis Anna',
    body: 'Amen. Please keep the Germiston outreach in prayer this Saturday.',
    at: now - 6 * HOUR,
  },
  {
    id: 'cf-6',
    roomId: 'church-family',
    author: 'Church office',
    body: 'Reminder: the notice board is updated with this month’s roster and the outreach sign-up.',
    at: now - 2 * HOUR,
  },

  // Prayer chain
  {
    id: 'pc-1',
    roomId: 'prayer-chain',
    author: 'Sis Anna',
    body: 'Night watch tonight 22:00–00:00. We are standing in the gap for the outreach and for the families still waiting on work.',
    at: now - DAY - 8 * HOUR,
  },
  {
    id: 'pc-2',
    roomId: 'prayer-chain',
    author: 'Grace P.',
    body: 'Standing in agreement. I will take the last hour.',
    at: now - DAY - 7 * HOUR,
  },
  {
    id: 'pc-3',
    roomId: 'prayer-chain',
    author: 'Nomsa M.',
    body: 'Please pray for my mother — she is in hospital in Germiston. Believing for strength for her and for the family.',
    at: now - 9 * HOUR,
  },
  {
    id: 'pc-4',
    roomId: 'prayer-chain',
    author: 'Sis Anna',
    body: 'We have you, Nomsa. Praying tonight and will check in tomorrow.',
    at: now - 8 * HOUR,
  },

  // Youth
  {
    id: 'y-1',
    roomId: 'ministry-youth',
    author: 'Sipho M.',
    body: 'Friday 18:30, as usual. Theme for the night is “identity” — bring a friend and your Bible.',
    at: now - 2 * DAY,
  },
  {
    id: 'y-2',
    roomId: 'ministry-youth',
    author: 'Lerato K.',
    body: 'Can we do small groups before the message this time? The group I was in last week really opened up.',
    at: now - 2 * DAY + 40 * MIN,
  },
  {
    id: 'y-3',
    roomId: 'ministry-youth',
    author: 'Sipho M.',
    body: 'Yes — 20 minutes of groups, then worship. I will send the questions in the morning.',
    at: now - 2 * DAY + 55 * MIN,
  },
  {
    id: 'y-4',
    roomId: 'ministry-youth',
    author: 'Kabelo N.',
    body: 'I can help set up from 17:30.',
    at: now - DAY - 4 * HOUR,
  },
  {
    id: 'y-5',
    roomId: 'ministry-youth',
    author: 'Sipho M.',
    body: 'Thank you Kabelo. See you all Friday.',
    at: now - 5 * HOUR,
  },

  // Women
  {
    id: 'w-1',
    roomId: 'ministry-women',
    author: 'Sis Anna',
    body: 'Ladies, Saturday breakfast at 08:30 in the hall. Bring something small to share if you can.',
    at: now - 3 * DAY,
  },
  {
    id: 'w-2',
    roomId: 'ministry-women',
    author: 'Grace P.',
    body: 'I will bring the tea and a tray of sandwiches.',
    at: now - 3 * DAY + 25 * MIN,
  },
  {
    id: 'w-3',
    roomId: 'ministry-women',
    author: 'Nomsa M.',
    body: 'Count me in. Can I bring my sister? She has been wanting to come for weeks.',
    at: now - 2 * DAY - 2 * HOUR,
  },

  // Intercessors
  {
    id: 'i-1',
    roomId: 'ministry-intercessors',
    author: 'Sis Anna',
    body: 'This week we cover the leadership, the children’s classes, and every family in the outreach.',
    at: now - DAY - 10 * HOUR,
  },
  {
    id: 'i-2',
    roomId: 'ministry-intercessors',
    author: 'Grace P.',
    body: 'Added the roster for the night watch to the pinned note.',
    at: now - DAY - 9 * HOUR,
  },

  // Men (not joined by default — shows the discover state)
  {
    id: 'm-1',
    roomId: 'ministry-men',
    author: 'Thabo D.',
    body: 'Breakfast Saturday 07:00 at the church. Bring a man who needs the room.',
    at: now - 2 * DAY - 5 * HOUR,
  },
  {
    id: 'm-2',
    roomId: 'ministry-men',
    author: 'Johan V.',
    body: 'I will be there. Can someone bring the study notes from last month?',
    at: now - 2 * DAY - 4 * HOUR,
  },

  // Children (not joined)
  {
    id: 'c-1',
    roomId: 'ministry-children',
    author: 'Grace P.',
    body: 'Sunday’s lesson is on the Good Shepherd. We need two extra hands for the 4–6 class.',
    at: now - DAY - 3 * HOUR,
  },

  // Young adults (not joined)
  {
    id: 'ya-1',
    roomId: 'ministry-young-adults',
    author: 'Johan V.',
    body: 'Midweek is at the church this Wednesday, 18:30 — we are working through vocation and calling.',
    at: now - 2 * DAY - HOUR,
  },
  {
    id: 'ya-2',
    roomId: 'ministry-young-adults',
    author: 'Grace P.',
    body: 'Bringing a colleague who is asking the same questions.',
    at: now - 2 * DAY - 30 * MIN,
  },
];

/* ------------------------------------------------------------------ */
/* Formatting helpers                                                  */
/* ------------------------------------------------------------------ */

export function formatClock(at: number) {
  return new Date(at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

export function formatWhen(at: number) {
  const diff = Date.now() - at;
  if (diff < MIN) return 'now';
  if (diff < HOUR) return `${Math.floor(diff / MIN)}m`;
  if (diff < DAY) return `${Math.floor(diff / HOUR)}h`;
  if (diff < 7 * DAY) return `${Math.floor(diff / DAY)}d`;
  return new Date(at).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

export function dayLabel(at: number) {
  const d = new Date(at);
  const today = new Date();
  const yesterday = new Date(today.getTime() - DAY);
  const same = (a: Date, b: Date) => a.toDateString() === b.toDateString();
  if (same(d, today)) return 'Today';
  if (same(d, yesterday)) return 'Yesterday';
  return d.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'short' });
}

export function lastMessage(thread: ChatMessage[] = []) {
  return thread.length ? thread[thread.length - 1] : null;
}

export function unreadCount(thread: ChatMessage[] = [], lastRead?: number) {
  if (!lastRead) return thread.filter((m) => !m.mine).length;
  return thread.filter((m) => !m.mine && m.at > lastRead).length;
}
