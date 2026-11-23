-- =====================================================================
-- Joy Ministries — application database
-- MySQL 5.7+ / 8.x / MariaDB 10.4+ (cPanel compatible)
--
-- Import:  mysql -u USER -p DBNAME < server/src/db/schema.sql
-- or cPanel > MySQL Databases > phpMyAdmin > Import.
-- =====================================================================

SET NAMES utf8mb4;
SET time_zone = '+00:00';

-- ---------------------------------------------------------------------
-- People and structure
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS campuses (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name          VARCHAR(120) NOT NULL,
  slug          VARCHAR(120) NOT NULL,
  address       VARCHAR(255) DEFAULT NULL,
  service_times VARCHAR(255) DEFAULT NULL,
  phone         VARCHAR(40) DEFAULT NULL,
  is_primary    TINYINT(1) NOT NULL DEFAULT 0,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_campuses_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS users (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name          VARCHAR(120) NOT NULL,
  email         VARCHAR(190) DEFAULT NULL,
  phone         VARCHAR(40) DEFAULT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role          ENUM('member','leader','ministry_admin','admin') NOT NULL DEFAULT 'member',
  campus_id     INT UNSIGNED DEFAULT NULL,
  avatar_url    VARCHAR(255) DEFAULT NULL,
  is_active     TINYINT(1) NOT NULL DEFAULT 1,
  last_login_at DATETIME DEFAULT NULL,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email),
  UNIQUE KEY uq_users_phone (phone),
  KEY idx_users_campus (campus_id),
  CONSTRAINT fk_users_campus FOREIGN KEY (campus_id) REFERENCES campuses(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS ministries (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  campus_id   INT UNSIGNED DEFAULT NULL,
  name        VARCHAR(120) NOT NULL,
  slug        VARCHAR(120) NOT NULL,
  eyebrow     VARCHAR(120) DEFAULT NULL,
  description TEXT,
  gathering   VARCHAR(190) DEFAULT NULL,
  leader_id   INT UNSIGNED DEFAULT NULL,
  color       VARCHAR(16) DEFAULT NULL,
  icon        VARCHAR(60) DEFAULT NULL,
  sort_order  INT NOT NULL DEFAULT 0,
  is_active   TINYINT(1) NOT NULL DEFAULT 1,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_ministries_slug (slug),
  KEY idx_ministries_campus (campus_id),
  CONSTRAINT fk_ministries_campus FOREIGN KEY (campus_id) REFERENCES campuses(id) ON DELETE SET NULL,
  CONSTRAINT fk_ministries_leader FOREIGN KEY (leader_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS user_ministries (
  user_id     INT UNSIGNED NOT NULL,
  ministry_id INT UNSIGNED NOT NULL,
  role        ENUM('member','admin') NOT NULL DEFAULT 'member',
  joined_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, ministry_id),
  CONSTRAINT fk_um_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_um_ministry FOREIGN KEY (ministry_id) REFERENCES ministries(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Content, sermons, library
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS content_items (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  type          ENUM('notice','devotional','sermon','media') NOT NULL,
  title         VARCHAR(190) NOT NULL,
  slug          VARCHAR(190) DEFAULT NULL,
  excerpt       VARCHAR(400) DEFAULT NULL,
  body          LONGTEXT,
  media_url     VARCHAR(500) DEFAULT NULL,
  thumbnail_url VARCHAR(500) DEFAULT NULL,
  campus_id     INT UNSIGNED DEFAULT NULL,
  ministry_id   INT UNSIGNED DEFAULT NULL,
  author_id     INT UNSIGNED DEFAULT NULL,
  is_pinned     TINYINT(1) NOT NULL DEFAULT 0,
  status        ENUM('draft','published','archived') NOT NULL DEFAULT 'published',
  published_at  DATETIME DEFAULT NULL,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_content_type (type, status, published_at),
  KEY idx_content_campus (campus_id),
  KEY idx_content_ministry (ministry_id),
  CONSTRAINT fk_content_campus FOREIGN KEY (campus_id) REFERENCES campuses(id) ON DELETE SET NULL,
  CONSTRAINT fk_content_ministry FOREIGN KEY (ministry_id) REFERENCES ministries(id) ON DELETE SET NULL,
  CONSTRAINT fk_content_author FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS sermons (
  id           INT UNSIGNED NOT NULL AUTO_INCREMENT,
  youtube_id   VARCHAR(32) NOT NULL,
  title        VARCHAR(190) NOT NULL,
  speaker      VARCHAR(120) DEFAULT NULL,
  series       VARCHAR(120) DEFAULT NULL,
  scripture    VARCHAR(120) DEFAULT NULL,
  description  TEXT,
  published_at DATETIME DEFAULT NULL,
  is_featured  TINYINT(1) NOT NULL DEFAULT 0,
  visible      TINYINT(1) NOT NULL DEFAULT 1,
  created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_sermons_youtube (youtube_id),
  KEY idx_sermons_published (published_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS resources (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  title       VARCHAR(190) NOT NULL,
  kind        ENUM('book','guide','study','form','audio','video') NOT NULL DEFAULT 'book',
  format      VARCHAR(40) DEFAULT NULL,
  ministry_id INT UNSIGNED DEFAULT NULL,
  description VARCHAR(400) DEFAULT NULL,
  file_url    VARCHAR(500) DEFAULT NULL,
  media_id    INT UNSIGNED DEFAULT NULL,
  downloads   INT UNSIGNED NOT NULL DEFAULT 0,
  is_published TINYINT(1) NOT NULL DEFAULT 1,
  sort_order  INT NOT NULL DEFAULT 0,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_resources_published (is_published, sort_order),
  KEY idx_resources_ministry (ministry_id),
  CONSTRAINT fk_resources_ministry FOREIGN KEY (ministry_id) REFERENCES ministries(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS media_assets (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  filename    VARCHAR(255) NOT NULL,
  original_name VARCHAR(255) DEFAULT NULL,
  path        VARCHAR(500) NOT NULL,
  url         VARCHAR(500) NOT NULL,
  mime        VARCHAR(120) DEFAULT NULL,
  size_bytes  BIGINT UNSIGNED DEFAULT NULL,
  kind        ENUM('image','audio','video','document','other') NOT NULL DEFAULT 'other',
  title       VARCHAR(190) DEFAULT NULL,
  uploaded_by INT UNSIGNED DEFAULT NULL,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_media_kind (kind),
  CONSTRAINT fk_media_user FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Events and attendance
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS events (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  title       VARCHAR(190) NOT NULL,
  description TEXT,
  campus_id   INT UNSIGNED DEFAULT NULL,
  ministry_id INT UNSIGNED DEFAULT NULL,
  location    VARCHAR(190) DEFAULT NULL,
  image_url   VARCHAR(500) DEFAULT NULL,
  starts_at   DATETIME NOT NULL,
  ends_at     DATETIME DEFAULT NULL,
  rsvp_open   TINYINT(1) NOT NULL DEFAULT 1,
  capacity    INT UNSIGNED DEFAULT NULL,
  created_by  INT UNSIGNED DEFAULT NULL,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_events_starts (starts_at),
  KEY idx_events_campus (campus_id),
  CONSTRAINT fk_events_campus FOREIGN KEY (campus_id) REFERENCES campuses(id) ON DELETE SET NULL,
  CONSTRAINT fk_events_ministry FOREIGN KEY (ministry_id) REFERENCES ministries(id) ON DELETE SET NULL,
  CONSTRAINT fk_events_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS rsvps (
  event_id   INT UNSIGNED NOT NULL,
  user_id    INT UNSIGNED NOT NULL,
  status     ENUM('yes','no','maybe') NOT NULL DEFAULT 'yes',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (event_id, user_id),
  CONSTRAINT fk_rsvp_event FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
  CONSTRAINT fk_rsvp_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS attendance (
  event_id      INT UNSIGNED NOT NULL,
  user_id       INT UNSIGNED NOT NULL,
  checked_in_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  method        VARCHAR(40) DEFAULT 'app',
  PRIMARY KEY (event_id, user_id),
  CONSTRAINT fk_att_event FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
  CONSTRAINT fk_att_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Prayer wall
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS prayer_requests (
  id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  author_id  INT UNSIGNED DEFAULT NULL,
  ministry_id INT UNSIGNED DEFAULT NULL,
  display_name VARCHAR(120) DEFAULT NULL,
  text       TEXT NOT NULL,
  is_anonymous TINYINT(1) NOT NULL DEFAULT 0,
  is_private TINYINT(1) NOT NULL DEFAULT 0,
  status     ENUM('open','prayed','answered','hidden') NOT NULL DEFAULT 'open',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_prayer_status (status, created_at),
  KEY idx_prayer_ministry (ministry_id),
  CONSTRAINT fk_prayer_author FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_prayer_ministry FOREIGN KEY (ministry_id) REFERENCES ministries(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS prayer_prayers (
  prayer_id  INT UNSIGNED NOT NULL,
  user_id    INT UNSIGNED NOT NULL,
  prayed_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (prayer_id, user_id),
  CONSTRAINT fk_pp_prayer FOREIGN KEY (prayer_id) REFERENCES prayer_requests(id) ON DELETE CASCADE,
  CONSTRAINT fk_pp_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Chat
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS chat_rooms (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  kind        ENUM('church','ministry','team') NOT NULL DEFAULT 'church',
  name        VARCHAR(120) NOT NULL,
  slug        VARCHAR(120) NOT NULL,
  description TEXT,
  ministry_id INT UNSIGNED DEFAULT NULL,
  campus_id   INT UNSIGNED DEFAULT NULL,
  color       VARCHAR(16) DEFAULT NULL,
  icon        VARCHAR(60) DEFAULT NULL,
  is_open     TINYINT(1) NOT NULL DEFAULT 1,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_chat_slug (slug),
  KEY idx_chat_ministry (ministry_id),
  CONSTRAINT fk_chat_ministry FOREIGN KEY (ministry_id) REFERENCES ministries(id) ON DELETE CASCADE,
  CONSTRAINT fk_chat_campus FOREIGN KEY (campus_id) REFERENCES campuses(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS chat_members (
  room_id   INT UNSIGNED NOT NULL,
  user_id   INT UNSIGNED NOT NULL,
  joined_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  is_muted  TINYINT(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (room_id, user_id),
  CONSTRAINT fk_cm_room FOREIGN KEY (room_id) REFERENCES chat_rooms(id) ON DELETE CASCADE,
  CONSTRAINT fk_cm_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS chat_messages (
  id         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  room_id    INT UNSIGNED NOT NULL,
  user_id    INT UNSIGNED DEFAULT NULL,
  body       TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  edited_at  DATETIME DEFAULT NULL,
  deleted_at DATETIME DEFAULT NULL,
  PRIMARY KEY (id),
  KEY idx_messages_room (room_id, id),
  CONSTRAINT fk_msg_room FOREIGN KEY (room_id) REFERENCES chat_rooms(id) ON DELETE CASCADE,
  CONSTRAINT fk_msg_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS chat_reads (
  room_id      INT UNSIGNED NOT NULL,
  user_id      INT UNSIGNED NOT NULL,
  last_read_id BIGINT UNSIGNED NOT NULL DEFAULT 0,
  updated_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (room_id, user_id),
  CONSTRAINT fk_cr_room FOREIGN KEY (room_id) REFERENCES chat_rooms(id) ON DELETE CASCADE,
  CONSTRAINT fk_cr_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Growth tracks
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS growth_tracks (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name        VARCHAR(120) NOT NULL,
  description VARCHAR(400) DEFAULT NULL,
  steps       JSON NOT NULL,
  is_active   TINYINT(1) NOT NULL DEFAULT 1,
  sort_order  INT NOT NULL DEFAULT 0,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS user_growth (
  user_id    INT UNSIGNED NOT NULL,
  track_id   INT UNSIGNED NOT NULL,
  step_index INT NOT NULL DEFAULT 0,
  completed  TINYINT(1) NOT NULL DEFAULT 0,
  joined_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, track_id),
  CONSTRAINT fk_ug_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_ug_track FOREIGN KEY (track_id) REFERENCES growth_tracks(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Money (giving) + PayFast
-- ---------------------------------------------------------------------

-- What a giver can give towards. The office adds rows here and they appear
-- as pills in the app; donations.fund stores the slug.
CREATE TABLE IF NOT EXISTS giving_funds (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name        VARCHAR(80) NOT NULL,
  slug        VARCHAR(80) NOT NULL,
  blurb       VARCHAR(190) DEFAULT NULL,
  kind        ENUM('tithe','offering','project','charity') NOT NULL DEFAULT 'project',
  goal_amount DECIMAL(12,2) DEFAULT NULL,
  is_active   TINYINT(1) NOT NULL DEFAULT 1,
  sort_order  INT NOT NULL DEFAULT 0,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_giving_funds_slug (slug),
  KEY idx_giving_funds_active (is_active, sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS donations (
  id             INT UNSIGNED NOT NULL AUTO_INCREMENT,
  donor_id       INT UNSIGNED DEFAULT NULL,
  fund           VARCHAR(60) NOT NULL DEFAULT 'tithe',
  amount         DECIMAL(12,2) NOT NULL,
  currency       CHAR(3) NOT NULL DEFAULT 'ZAR',
  method         ENUM('online','card','eft','cash','payfast') NOT NULL DEFAULT 'online',
  gateway        VARCHAR(40) DEFAULT 'payfast',
  reference      VARCHAR(80) NOT NULL,
  gateway_ref    VARCHAR(120) DEFAULT NULL,
  status         ENUM('pending','completed','failed','cancelled','refunded') NOT NULL DEFAULT 'pending',
  donor_name     VARCHAR(160) DEFAULT NULL,
  donor_email    VARCHAR(190) DEFAULT NULL,
  message        VARCHAR(400) DEFAULT NULL,
  payload        LONGTEXT,
  paid_at        DATETIME DEFAULT NULL,
  created_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_donation_reference (reference),
  KEY idx_donation_status (status, created_at),
  KEY idx_donation_donor (donor_id),
  CONSTRAINT fk_donation_donor FOREIGN KEY (donor_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Notifications
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS notifications (
  id         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id    INT UNSIGNED DEFAULT NULL,
  type       VARCHAR(40) NOT NULL DEFAULT 'broadcast',
  title      VARCHAR(190) NOT NULL,
  body       TEXT,
  link       VARCHAR(255) DEFAULT NULL,
  ministry_id INT UNSIGNED DEFAULT NULL,
  data       LONGTEXT,
  read_at    DATETIME DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_notifications_user (user_id, read_at),
  KEY idx_notifications_created (created_at),
  KEY idx_notifications_ministry (ministry_id),
  CONSTRAINT fk_notif_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_notif_ministry FOREIGN KEY (ministry_id) REFERENCES ministries(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Auth support + operations
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS password_resets (
  id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id    INT UNSIGNED NOT NULL,
  code_hash  VARCHAR(255) NOT NULL,
  expires_at DATETIME NOT NULL,
  used_at    DATETIME DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_reset_user (user_id),
  CONSTRAINT fk_reset_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS settings (
  key_name   VARCHAR(80) NOT NULL,
  value      TEXT,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (key_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS audit_log (
  id         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  actor_id   INT UNSIGNED DEFAULT NULL,
  action     VARCHAR(80) NOT NULL,
  target     VARCHAR(190) DEFAULT NULL,
  ministry_id INT UNSIGNED DEFAULT NULL,
  meta       LONGTEXT,
  ip         VARCHAR(45) DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_audit_created (created_at),
  KEY idx_audit_actor (actor_id),
  KEY idx_audit_ministry (ministry_id),
  CONSTRAINT fk_audit_actor FOREIGN KEY (actor_id) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_audit_ministry FOREIGN KEY (ministry_id) REFERENCES ministries(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
