import type { ComponentProps } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { brand } from './brand';

type IconName = ComponentProps<typeof Ionicons>['name'];

export interface Resource {
  id: string;
  title: string;
  /** Shelf label shown above the title. */
  kind: string;
  format: 'PDF' | 'EPUB' | 'AUDIO';
  icon: IconName;
  /**
   * Direct file link. When set, the card downloads it. When absent the card
   * requests the resource from the church office by email — the site does not
   * publish files yet, so no fake download links.
   */
  url?: string;
}

export const libraryIntro =
  'Books, study guides and forms from the church office. Request any title and the office sends it to you.';

export const resources: Resource[] = [
  {
    id: 'foundations',
    title: 'Foundations of Faith',
    kind: 'New believers',
    format: 'PDF',
    icon: 'book-outline',
  },
  {
    id: 'prayer',
    title: 'Prayer That Moves Mountains',
    kind: 'Prayer',
    format: 'PDF',
    icon: 'flame-outline',
  },
  {
    id: 'spirit',
    title: 'Walking in the Spirit',
    kind: '7-day devotional',
    format: 'PDF',
    icon: 'sunny-outline',
  },
  {
    id: 'kids',
    title: 'Joy Kids Activity Book',
    kind: 'Children',
    format: 'PDF',
    icon: 'color-palette-outline',
  },
  {
    id: 'membership',
    title: 'Membership & Baptism Pack',
    kind: 'Forms',
    format: 'PDF',
    icon: 'document-text-outline',
  },
];

export function resourceRequestMailto(title: string) {
  return `mailto:${brand.email}?subject=${encodeURIComponent(
    `Resource request — ${title}`
  )}&body=${encodeURIComponent(
    `Hi Joy Ministries,\n\nPlease could you send me “${title}”.\n\nThank you.`
  )}`;
}
