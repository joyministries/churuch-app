/**
 * Sermon video source of truth.
 *
 * Pulled from the church's own channel — JoyMinistries Lambton
 * (UC0cKTSmyHVMEPHrmu6hqvUg). Update `sermons` when new messages are posted;
 * the newest entry becomes the player at the top of the Sermons screen.
 */

export const youtubeChannelUrl = 'https://youtube.com/@joyministrieslambton6672';
export const youtubeChannelId = 'UC0cKTSmyHVMEPHrmu6hqvUg';
export const youtubeLiveUrl = 'https://www.youtube.com/@joyministrieslambton6672/streams';

export interface Sermon {
  /** YouTube video id — also used as the note/recents key. */
  id: string;
  title: string;
  speaker: string;
  /** ISO date (upload). */
  published: string;
}

export const sermons: Sermon[] = [
  {
    id: 'MJWo0titr7E',
    title: 'Watch and Pray, Lest You Fall into Temptation',
    speaker: 'Ps Rakesh & Reshen Ramdas',
    published: '2026-11-08',
  },
  {
    id: 'd7lvu4WLHsk',
    title: 'Praying in the Will of God',
    speaker: 'Ps Rakesh & Reshen Ramdas',
    published: '2026-11-01',
  },
  {
    id: 'cR1MoaRnbug',
    title: 'The Abiding Presence of the Holy Spirit — Holiness',
    speaker: 'Ps Rakesh & Reshen Ramdas',
    published: '2026-10-25',
  },
  {
    id: 'djLlJj60fyE',
    title: 'Living Under the Veil of the Spirit',
    speaker: 'Ps Rakesh & Reshen Ramdas',
    published: '2026-10-18',
  },
  {
    id: 'SCn1jUsRY3M',
    title: 'Enter Boldly to the Throne of Grace',
    speaker: 'Ps Rakesh & Reshen Ramdas',
    published: '2026-10-11',
  },
  {
    id: '3fuB6WpN2yc',
    title: 'Sunday Service',
    speaker: 'Joy Ministries Lambton',
    published: '2026-10-04',
  },
  {
    id: 'gKeC3ICD4z0',
    title: 'Sunday Service',
    speaker: 'Joy Ministries Lambton',
    published: '2026-09-27',
  },
  {
    id: 'TqI2CLqQN40',
    title: 'Living With the Anointing',
    speaker: 'Ps Rakesh & Reshen Ramdas',
    published: '2026-09-20',
  },
];

export const featuredSermon = sermons[0];

export function sermonById(id?: string | null) {
  return sermons.find((s) => s.id === id) ?? null;
}

export function youtubeWatchUrl(id: string) {
  return `https://www.youtube.com/watch?v=${id}`;
}

export function youtubeThumb(id: string) {
  return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
}

const EMBED_PARAMS =
  'rel=0&modestbranding=1&playsinline=1&color=white&fs=1&enablejsapi=0';

/** Embed URL shared by the native WebView and the web iframe. */
export function youtubeEmbedUrl(videoId: string) {
  return `https://www.youtube-nocookie.com/embed/${videoId}?${EMBED_PARAMS}`;
}

/**
 * Self-contained player document for the WebView. Uses youtube-nocookie and
 * fills the frame edge to edge so the card reads as a video, not an iframe.
 */
export function youtubePlayerHtml(videoId: string) {
  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
    <style>
      html, body { margin: 0; padding: 0; height: 100%; background: #0B0B12; overflow: hidden; }
      .frame { position: relative; width: 100%; height: 100%; }
      iframe { position: absolute; inset: 0; width: 100%; height: 100%; border: 0; }
    </style>
  </head>
  <body>
    <div class="frame">
      <iframe
        src="${youtubeEmbedUrl(videoId)}"
        title="Sermon"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowfullscreen
        referrerpolicy="strict-origin-when-cross-origin"
      ></iframe>
    </div>
  </body>
</html>`;
}

export function formatSermonDate(iso: string) {
  const d = new Date(`${iso}T00:00:00`);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' });
}

export function daysAgo(iso: string) {
  const d = new Date(`${iso}T00:00:00`).getTime();
  if (isNaN(d)) return '';
  const days = Math.max(0, Math.round((Date.now() - d) / 86_400_000));
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  if (days < 35) return `${Math.round(days / 7)} weeks ago`;
  return `${Math.round(days / 30)} months ago`;
}
