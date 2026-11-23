import { q } from './index.js';
import { hashPassword } from '../services/auth.js';

export async function seed() {
  const existing = await q('SELECT COUNT(*) AS c FROM users');
  if (existing[0].c > 0) {
    console.log('[seed] database already populated, skipping.');
    return;
  }

  const admin = await q(
    `INSERT INTO users (name, email, phone, password_hash, role) VALUES (?, ?, ?, ?, 'admin')`,
    ['Pastor Grace Mwangi', 'admin@joyministries.co.za', null, hashPassword('JoyAdmin#2026')]
  );
  const youthLeader = await q(
    `INSERT INTO users (name, email, phone, password_hash, role) VALUES (?, ?, ?, ?, 'ministry_admin')`,
    ['Youth Pastor', 'youth@joyministries.co.za', null, hashPassword('JoyYouth#2026')]
  );
  const womenLeader = await q(
    `INSERT INTO users (name, email, phone, password_hash, role) VALUES (?, ?, ?, ?, 'ministry_admin')`,
    ['Women Ministry Lead', 'women@joyministries.co.za', null, hashPassword('JoyWomen#2026')]
  );
  const member = await q(
    `INSERT INTO users (name, email, phone, password_hash, role) VALUES (?, ?, ?, ?, 'member')`,
    ['Amina Member', 'amina@joyministries.co.za', null, hashPassword('JoyMember#2026')]
  );

  const campus = await q(
    `INSERT INTO campuses (name, slug, address, service_times, is_primary) VALUES (?, ?, ?, ?, 1)`,
    ['Lambton Campus', 'lambton', 'Lambton, South Africa', 'Sunday 08:30 & 10:30']
  );
  const campusId = campus.insertId;

  const ministries = [
    ['Worship & Creative Arts', 'worship', 'Worship Team', 'Sundays 07:30', '#2C97C5', 'musical-notes-outline'],
    ['Youth Ministry', 'youth', 'Young & Rooted', 'Fridays 18:00', '#7FC4E0', 'flash-outline'],
    ['Women of Joy', 'women', "Women's Fellowship", 'Saturdays 09:00', '#B33A2A', 'flower-outline'],
    ['Men of Valour', 'men', "Men's Fellowship", 'Saturdays 07:00', '#1B6F94', 'shield-checkmark-outline'],
    ['Children Ministry', 'children', 'Sunday School', 'Sundays 09:00', '#7FC4E0', 'happy-outline'],
    ['Outreach & Missions', 'outreach', 'Community Care', 'Monthly', '#123C4F', 'heart-outline'],
  ];
  const ministryIds = {};
  for (const [name, slug, eyebrow, gathering, color, icon] of ministries) {
    const r = await q(
      `INSERT INTO ministries (campus_id, name, slug, eyebrow, gathering, color, icon, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [campusId, name, slug, eyebrow, gathering, color, icon, Object.keys(ministryIds).length]
    );
    ministryIds[slug] = r.insertId;
  }

  await q('INSERT IGNORE INTO user_ministries (user_id, ministry_id, role) VALUES (?, ?, "admin")', [youthLeader.insertId, ministryIds.youth]);
  await q('INSERT IGNORE INTO user_ministries (user_id, ministry_id, role) VALUES (?, ?, "admin")', [womenLeader.insertId, ministryIds.women]);
  await q('INSERT IGNORE INTO user_ministries (user_id, ministry_id, role) VALUES (?, ?, "member")', [member.insertId, ministryIds.youth]);

  await q('UPDATE users SET campus_id = ? WHERE id IN (?, ?, ?, ?)', [campusId, admin.insertId, youthLeader.insertId, womenLeader.insertId, member.insertId]);

  const content = [
    ['notice', 'Welcome Home', 'We are glad you are with us this Sunday. Service starts at 08:30.', null, null, 1],
    ['devotional', 'Walk in Love', 'Beloved, walk in love, as Christ loved us and gave himself up for us.', null, null, 0],
    ['notice', 'Youth Camp 2026', 'Registrations open for the July youth camp. Speak to the youth office.', null, ministryIds.youth, 0],
    ['devotional', 'Quiet Strength', 'Be still, and know that I am God.', null, null, 0],
  ];
  for (const [type, title, body, media, ministry, pinned] of content) {
    await q(
      `INSERT INTO content_items (type, title, body, media_url, ministry_id, campus_id, author_id, is_pinned, status, published_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'published', UTC_TIMESTAMP())`,
      [type, title, body, media, ministry, campusId, admin.insertId, pinned]
    );
  }

  const events = [
    ['Sunday Service', 'Main worship gathering', campusId, null, '2026-11-22 08:30:00', '2026-11-22 11:30:00', 'Main Auditorium'],
    ['Prayer Night', 'Corporate prayer and fasting', campusId, null, '2026-11-23 19:00:00', '2026-11-23 21:00:00', 'Chapel'],
    ['Youth Connect', 'Friday fellowship', campusId, ministryIds.youth, '2026-11-27 18:00:00', '2026-11-27 20:00:00', 'Youth Hall'],
  ];
  for (const [title, desc, c, m, s, e, loc] of events) {
    await q(
      `INSERT INTO events (title, description, campus_id, ministry_id, starts_at, ends_at, location, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [title, desc, c, m, s, e, loc, admin.insertId]
    );
  }

  const rooms = [
    ['church', 'The Congregation', 'congregation', 'The whole church, together.', null, '#2C97C5', 'chatbubbles-outline'],
    ['ministry', 'Worship Team', 'worship-team', 'Worship & Creative Arts room.', ministryIds.worship, '#2C97C5', 'musical-notes-outline'],
    ['ministry', 'Youth', 'youth-room', 'Youth Ministry room.', ministryIds.youth, '#7FC4E0', 'flash-outline'],
    ['ministry', "Women of Joy", 'women-room', "Women's Fellowship room.", ministryIds.women, '#B33A2A', 'flower-outline'],
    ['ministry', 'Men of Valour', 'men-room', "Men's Fellowship room.", ministryIds.men, '#1B6F94', 'shield-checkmark-outline'],
  ];
  for (const [kind, name, slug, desc, ministry, color, icon] of rooms) {
    await q(
      `INSERT INTO chat_rooms (kind, name, slug, description, ministry_id, color, icon) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [kind, name, slug, desc, ministry, color, icon]
    );
  }
  await q('INSERT IGNORE INTO chat_members (room_id, user_id) SELECT id, ? FROM chat_rooms', [admin.insertId]);
  await q('INSERT IGNORE INTO chat_members (room_id, user_id) SELECT id, ? FROM chat_rooms WHERE kind="church"', [member.insertId]);

  const tracks = [
    ['Foundations', 'Begin your walk with Christ.', ['Accept Christ', 'Pray Daily', 'Read Scripture', 'Serve', 'Share']],
    ['Discipleship Pathway', 'Grow into maturity.', ['Baptism', 'Community', 'Mentorship', 'Leadership', 'Mission']],
  ];
  for (const [name, desc, steps] of tracks) {
    await q('INSERT INTO growth_tracks (name, description, steps) VALUES (?, ?, ?)', [name, desc, JSON.stringify(steps)]);
  }

  const prayers = [
    ['Healing for my mother', 0, 0, null],
    ['Wisdom for a new job', 1, 0, null],
    ['Strength for our youth', 0, 0, ministryIds.youth],
  ];
  for (const [text, anon, priv, ministry] of prayers) {
    await q(
      `INSERT INTO prayer_requests (author_id, ministry_id, text, is_anonymous, is_private, status) VALUES (?, ?, ?, ?, ?, 'open')`,
      [member.insertId, ministry, text, anon, priv]
    );
  }

  await q(
    `INSERT INTO sermons (youtube_id, title, speaker, series, scripture, description, published_at, is_featured, visible) VALUES (?, ?, ?, ?, ?, ?, UTC_TIMESTAMP(), 1, 1)`,
    ['dQw4w9WgXcQ', 'The Upper Room', 'Pastor Grace Mwangi', 'Foundations', 'Acts 2:1-4', 'A teaching on the power of the Spirit.']
  );

  await q(
    `INSERT INTO resources (title, kind, format, description, file_url, is_published, sort_order) VALUES (?, ?, ?, ?, ?, 1, 0)`,
    ['New Believers Guide', 'guide', 'PDF', 'A short guide for new believers.', null]
  );

  await q(
    `INSERT INTO notifications (user_id, type, title, body) VALUES (?, 'broadcast', ?, ?)`,
    [member.insertId, 'Welcome to Joy Ministries', 'Download the app to stay connected with the family.']
  );

  const settings = [
    ['payfast_merchant_id', '10010868'],
    ['payfast_merchant_key', 'exnibu0q9zmuz'],
    ['payfast_passphrase', ''],
    ['payfast_mode', 'sandbox'],
    ['payfast_enabled', '1'],
    ['church_name', 'Joy Ministries'],
    ['public_base_url', 'http://localhost:38799'],
  ];
  for (const [k, v] of settings) {
    await q('INSERT INTO settings (key_name, value) VALUES (?, ?)', [k, v]);
  }

  console.log('[seed] complete.');
}

export default seed;
