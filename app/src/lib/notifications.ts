import type { ComponentProps } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { palette } from './theme';

type IconName = ComponentProps<typeof Ionicons>['name'];

export type NotificationKind = 'chat' | 'prayer' | 'event' | 'notice' | 'service' | 'ministry';

export interface AppNotification {
  id: string;
  kind: NotificationKind;
  title: string;
  body: string;
  at: number;
  read: boolean;
  /** Where the row goes when tapped. */
  screen?: string;
  params?: Record<string, unknown>;
  /** Small label shown on the right of the row. */
  cue?: string;
}

export const notificationStyle: Record<
  NotificationKind,
  { icon: IconName; color: string; label: string }
> = {
  chat: { icon: 'chatbubbles-outline', color: palette.brandBlue, label: 'CHAT' },
  prayer: { icon: 'heart-outline', color: palette.danger, label: 'PRAYER' },
  event: { icon: 'calendar-outline', color: palette.teal, label: 'EVENT' },
  notice: { icon: 'megaphone-outline', color: palette.navy, label: 'NOTICE' },
  service: { icon: 'sunny-outline', color: palette.amber, label: 'SERVICE' },
  ministry: { icon: 'people-outline', color: palette.plum, label: 'MINISTRY' },
};

const MIN = 60_000;
const HOUR = 60 * MIN;
const now = Date.now();

export const seedNotifications: AppNotification[] = [
  {
    id: 'n-1',
    kind: 'chat',
    title: 'Sipho M. in Youth Ministry',
    body: '“Friday 18:30, as usual. Theme for the night is identity — bring a friend.”',
    at: now - 34 * MIN,
    read: false,
    screen: 'ChatRoom',
    params: { roomId: 'ministry-youth' },
    cue: 'Open room',
  },
  {
    id: 'n-2',
    kind: 'prayer',
    title: 'Nomsa asked for prayer',
    body: 'Her mother is in hospital in Germiston. The prayer chain is standing in agreement.',
    at: now - 2 * HOUR,
    read: false,
    screen: 'Pray',
    cue: 'Pray',
  },
  {
    id: 'n-3',
    kind: 'notice',
    title: 'New notice from the office',
    body: 'This month’s roster and the Saturday outreach sign-up are on the notice board.',
    at: now - 5 * HOUR,
    read: false,
    screen: 'NoticeBoard',
    cue: 'Read',
  },
  {
    id: 'n-4',
    kind: 'event',
    title: 'Youth night · Friday 18:30',
    body: 'Worship, small groups, and a message on identity. RSVP so the team can plan.',
    at: now - 9 * HOUR,
    read: false,
    screen: 'Events',
    cue: 'RSVP',
  },
  {
    id: 'n-5',
    kind: 'ministry',
    title: "Women's Ministry breakfast",
    body: 'Saturday 08:30 in the hall. Bring something small to share if you can.',
    at: now - 26 * HOUR,
    read: true,
    screen: 'Ministries',
    params: { screen: 'MinistryDetail', params: { id: 'women' } },
    cue: 'Details',
  },
  {
    id: 'n-6',
    kind: 'service',
    title: 'Sunday service · 10:00',
    body: 'Doors open at 09:15. Coffee before the meeting, children’s classes run during the service.',
    at: now - 30 * HOUR,
    read: true,
    screen: 'Home',
    cue: 'Home',
  },
  {
    id: 'n-7',
    kind: 'chat',
    title: 'Sis Anna in Prayer chain',
    body: '“We have you, Nomsa. Praying tonight and will check in tomorrow.”',
    at: now - 33 * HOUR,
    read: true,
    screen: 'ChatRoom',
    params: { roomId: 'prayer-chain' },
    cue: 'Open room',
  },
];

export function notificationDay(at: number) {
  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 24 * HOUR).toDateString();
  const day = new Date(at).toDateString();
  if (day === today) return 'Today';
  if (day === yesterday) return 'Yesterday';
  return new Date(at).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'short' });
}
