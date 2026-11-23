import type { ComponentProps } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { palette } from './theme';

type IconName = ComponentProps<typeof Ionicons>['name'];

/**
 * Brand identity for Joy Ministries.
 * Static on purpose — this content must render with no network and no auth.
 */
export const brand = {
  name: 'Joy Ministries',
  fullName: 'Joy Ministries Family of Churches',
  tagline: 'Family of Churches',
  email: 'info@joyministries.co.za',
  phone: '+27 11 824 0735',
  whatsapp: 'https://wa.me/27712215120',
  location: 'Joy Lambton, Germiston',
  serviceTime: 'Sundays · 10:00',
  site: 'https://joyministries.co.za',
  copyright: `© ${new Date().getFullYear()} Joy Ministries. Designed with care and purpose.`,
};

export interface SocialLink {
  id: 'youtube' | 'instagram' | 'tiktok';
  label: string;
  icon: IconName;
  url: string;
  tint: string;
}

/** Only the three platforms the church runs: TikTok, YouTube, Instagram. */
export const socialLinks: SocialLink[] = [
  {
    id: 'youtube',
    label: 'YouTube',
    icon: 'logo-youtube',
    url: 'https://youtube.com/@joyministrieslambton6672',
    tint: palette.danger,
  },
  {
    id: 'instagram',
    label: 'Instagram',
    icon: 'logo-instagram',
    url: 'https://www.instagram.com/joymistrieslambton/',
    tint: palette.plum,
  },
  {
    id: 'tiktok',
    label: 'TikTok',
    icon: 'logo-tiktok',
    url: 'https://www.tiktok.com/@joyministrieslambton',
    tint: palette.ink,
  },
];

export interface Ministry {
  id: string;
  /** Editorial kicker shown above the name. */
  eyebrow: string;
  name: string;
  blurb: string;
  /** One line on what the group actually does week to week. */
  rhythm: string;
  gathering: string;
  cta: string;
  icon: IconName;
  color: string;
  /** Where the CTA points: a mailto: for enquiries, or a tab name. */
  action: { type: 'email'; subject: string } | { type: 'tab'; tab: string };
}

export const ministriesIntro =
  'The gates of our spiritual house. Designed to nurture every age, life stage, and calling within our community.';

export const ministries: Ministry[] = [
  {
    id: 'youth',
    eyebrow: 'Next Generation',
    name: 'Youth Ministry',
    blurb:
      'Empowering teenagers to stand firm in their faith, discover their God-given identity, and navigate culture with biblical truth and bold passion.',
    rhythm: 'Teens from Grade 7 upward, gathering weekly to worship, wrestle with real questions, and grow together.',
    gathering: 'Weekly Gatherings',
    cta: 'Get Involved',
    icon: 'flash-outline',
    color: palette.orange,
    action: { type: 'email', subject: 'Youth Ministry' },
  },
  {
    id: 'young-adults',
    eyebrow: 'Purpose & Transition',
    name: 'Young Adults Ministry',
    blurb:
      'A dynamic community for university students and young professionals navigating careers, relationships, and major life decisions anchored in faith.',
    rhythm: 'Students and working adults meeting mid-week for teaching, honest conversation, and prayer.',
    gathering: 'Mid-Week Fellowships',
    cta: 'Get Involved',
    icon: 'compass-outline',
    color: palette.teal,
    action: { type: 'email', subject: 'Young Adults Ministry' },
  },
  {
    id: 'women',
    eyebrow: 'Sisterhood & Grace',
    name: "Women's Ministry",
    blurb:
      'A supportive community of women cultivating deep spiritual roots, building lasting relationships, and encouraging one another in homes, careers, and families.',
    rhythm: 'Women of every season sharing prayer, testimony, and practical care across homes and workplaces.',
    gathering: 'Fellowship & Prayer',
    cta: 'Get Involved',
    icon: 'flower-outline',
    color: palette.plum,
    action: { type: 'email', subject: "Women's Ministry" },
  },
  {
    id: 'men',
    eyebrow: 'Strength & Integrity',
    name: "Men's Ministry",
    blurb:
      'Building men of godly character, accountability, and strong leadership to serve as pillars of strength in their homes, workplaces, and local church communities.',
    rhythm: 'Men gathering over breakfast and mentorship to sharpen one another in character and calling.',
    gathering: 'Men’s Breakfasts & Mentorship',
    cta: 'Get Involved',
    icon: 'shield-outline',
    color: palette.steel,
    action: { type: 'email', subject: "Men's Ministry" },
  },
  {
    id: 'children',
    eyebrow: 'Little Believers',
    name: "Children's Ministry",
    blurb:
      'Providing a safe, fun, and spiritually engaging environment where children learn foundational biblical truths through creative teaching and interactive care.',
    rhythm: 'Age-appropriate classes every Sunday morning, led by screened and trained volunteers.',
    gathering: 'Sunday Classes',
    cta: 'Get Involved',
    icon: 'happy-outline',
    color: palette.amber,
    action: { type: 'email', subject: "Children's Ministry" },
  },
  {
    id: 'intercessors',
    eyebrow: 'Spiritual Watchmen',
    name: 'Intercessory Ministry',
    blurb:
      'The spiritual engine room of Joy Ministries. A dedicated group of watchmen committed to standing in the gap in prayer, covering the leadership, campuses, services, and community needs.',
    rhythm: 'Watchmen covering the church in prayer through set sessions and night watches.',
    gathering: 'Prayer Sessions & Watch Nights',
    cta: 'Join Prayer Team',
    icon: 'flame-outline',
    color: palette.violet,
    action: { type: 'tab', tab: 'Pray' },
  },
  {
    id: 'outreach',
    eyebrow: 'Beyond The Walls',
    name: 'Community Outreach',
    blurb:
      'Carrying the love of Christ into Lambton and the wider Germiston community through food parcels, home visits, school support, and practical care for families doing it hard.',
    rhythm: 'Volunteers serving the neighbourhood on weekends and following up with families through the week.',
    gathering: 'Saturday Serve & Home Visits',
    cta: 'Serve With Us',
    icon: 'hand-left-outline',
    color: palette.outreach,
    action: { type: 'email', subject: 'Community Outreach' },
  },
  {
    id: 'worship',
    eyebrow: 'Sound & Sanctuary',
    name: 'Worship Ministry',
    blurb:
      'The sound of the house. Singers and musicians who lead the congregation into the presence of God with reverence, craft, and a life that matches the song.',
    rhythm: 'Vocalists, instrumentalists, and sound carrying the Sunday services and special gatherings.',
    gathering: 'Thursday Rehearsal & Sunday Soundcheck',
    cta: 'Audition With Us',
    icon: 'musical-notes-outline',
    color: palette.worship,
    action: { type: 'email', subject: 'Worship Ministry' },
  },
  {
    id: 'media',
    eyebrow: 'Behind The Scenes',
    name: 'Media Team',
    blurb:
      'Cameras, sound desk, livestream, and socials — the crew that makes sure nobody misses a service, whether they are in the room or watching from home.',
    rhythm: 'Operators rotating across sound, screens, livestream, and photography every Sunday.',
    gathering: 'Sunday Production & Livestream',
    cta: 'Join The Crew',
    icon: 'videocam-outline',
    color: palette.media,
    action: { type: 'email', subject: 'Media Team' },
  },
];

export function ministryById(id?: string | null) {
  return ministries.find((m) => m.id === id) ?? null;
}

export function ministryMailto(subject: string) {
  return `mailto:${brand.email}?subject=${encodeURIComponent(`${subject} — Joy Ministries`)}`;
}
