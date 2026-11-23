-- MySQL dump 10.13  Distrib 8.4.13, for Linux (x86_64)
--
-- Host: localhost    Database: joy_church
-- ------------------------------------------------------
-- Server version	8.4.13

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `attendance`
--

DROP TABLE IF EXISTS `attendance`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `attendance` (
  `event_id` int unsigned NOT NULL,
  `user_id` int unsigned NOT NULL,
  `checked_in_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `method` varchar(40) COLLATE utf8mb4_unicode_ci DEFAULT 'app',
  PRIMARY KEY (`event_id`,`user_id`),
  KEY `fk_att_user` (`user_id`),
  CONSTRAINT `fk_att_event` FOREIGN KEY (`event_id`) REFERENCES `events` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_att_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `attendance`
--

/*!40000 ALTER TABLE `attendance` DISABLE KEYS */;
/*!40000 ALTER TABLE `attendance` ENABLE KEYS */;

--
-- Table structure for table `audit_log`
--

DROP TABLE IF EXISTS `audit_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `audit_log` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `actor_id` int unsigned DEFAULT NULL,
  `action` varchar(80) COLLATE utf8mb4_unicode_ci NOT NULL,
  `target` varchar(190) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ministry_id` int unsigned DEFAULT NULL,
  `meta` longtext COLLATE utf8mb4_unicode_ci,
  `ip` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_audit_created` (`created_at`),
  KEY `idx_audit_actor` (`actor_id`),
  KEY `idx_audit_ministry` (`ministry_id`),
  CONSTRAINT `fk_audit_actor` FOREIGN KEY (`actor_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_audit_ministry` FOREIGN KEY (`ministry_id`) REFERENCES `ministries` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `audit_log`
--

/*!40000 ALTER TABLE `audit_log` DISABLE KEYS */;
INSERT INTO `audit_log` VALUES (1,NULL,'user.login',NULL,NULL,'{\"method\":\"POST\",\"path\":\"/api/auth/login\",\"body\":{\"email\":\"admin@joyministries.co.za\",\"password\":\"JoyAdmin#2026\"}}','::ffff:127.0.0.1','2026-11-20 05:40:48'),(2,NULL,'user.login',NULL,NULL,'{\"method\":\"POST\",\"path\":\"/api/auth/login\",\"body\":{\"email\":\"admin@joyministries.co.za\",\"password\":\"JoyAdmin#2026\"}}','::ffff:127.0.0.1','2026-11-20 05:40:48'),(3,1,'admin.login',NULL,NULL,NULL,'::ffff:127.0.0.1','2026-11-20 05:40:52'),(4,NULL,'giving.payfast.initiate','giving:150',NULL,'{\"method\":\"POST\",\"path\":\"/api/giving/payfast\",\"body\":{\"amount\":150,\"fund\":\"tithe\"}}','::ffff:127.0.0.1','2026-11-20 05:43:09'),(5,NULL,'giving.payfast.initiate','giving:150',NULL,'{\"method\":\"POST\",\"path\":\"/api/giving/payfast\",\"body\":{\"amount\":150,\"fund\":\"tithe\"}}','::ffff:127.0.0.1','2026-11-20 05:43:09'),(6,NULL,'giving.payfast.initiate','giving:50',NULL,'{\"method\":\"POST\",\"path\":\"/api/giving/payfast\",\"body\":{\"amount\":50,\"fund\":\"offering\"}}','::ffff:127.0.0.1','2026-11-20 05:43:09'),(7,NULL,'giving.payfast.initiate','giving:50',NULL,'{\"method\":\"POST\",\"path\":\"/api/giving/payfast\",\"body\":{\"amount\":50,\"fund\":\"offering\"}}','::ffff:127.0.0.1','2026-11-20 05:43:09'),(8,1,'admin.login',NULL,NULL,NULL,'::ffff:127.0.0.1','2026-11-20 05:43:47'),(9,1,'admin.login',NULL,NULL,NULL,'::ffff:127.0.0.1','2026-11-20 05:44:21'),(10,1,'admin/media','/admin/media',NULL,'{\"method\":\"POST\",\"path\":\"/admin/media\",\"body\":{\"title\":\"Audit Check\"}}','::ffff:127.0.0.1','2026-11-20 05:44:21'),(11,1,'admin.login',NULL,NULL,NULL,'::ffff:127.0.0.1','2026-11-20 05:45:45'),(12,1,'admin.login',NULL,NULL,NULL,'::ffff:127.0.0.1','2026-11-20 05:57:02'),(13,1,'admin.login',NULL,NULL,NULL,'::ffff:127.0.0.1','2026-11-20 05:59:00'),(14,1,'admin.login',NULL,NULL,NULL,'::ffff:127.0.0.1','2026-11-20 06:03:29'),(15,1,'admin.login',NULL,NULL,NULL,'::ffff:127.0.0.1','2026-11-20 06:05:37'),(16,1,'admin.login',NULL,NULL,NULL,'::ffff:127.0.0.1','2026-11-20 06:07:28'),(17,1,'admin/prayer/:id/status','/admin/prayer/3/status',NULL,'{\"method\":\"POST\",\"path\":\"/admin/prayer/3/status\",\"body\":{\"status\":\"prayed\"}}','::ffff:127.0.0.1','2026-11-20 06:07:55'),(18,1,'admin.logout',NULL,NULL,NULL,'::ffff:127.0.0.1','2026-11-20 06:29:44'),(19,1,'admin.login',NULL,NULL,NULL,'::ffff:127.0.0.1','2026-11-20 06:41:29');
/*!40000 ALTER TABLE `audit_log` ENABLE KEYS */;

--
-- Table structure for table `campuses`
--

DROP TABLE IF EXISTS `campuses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `campuses` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL,
  `slug` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL,
  `address` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `service_times` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone` varchar(40) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_primary` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_campuses_slug` (`slug`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `campuses`
--

/*!40000 ALTER TABLE `campuses` DISABLE KEYS */;
INSERT INTO `campuses` VALUES (1,'Lambton Campus','lambton','Lambton, South Africa','Sunday 08:30 & 10:30',NULL,1,'2026-11-20 05:39:56');
/*!40000 ALTER TABLE `campuses` ENABLE KEYS */;

--
-- Table structure for table `chat_members`
--

DROP TABLE IF EXISTS `chat_members`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `chat_members` (
  `room_id` int unsigned NOT NULL,
  `user_id` int unsigned NOT NULL,
  `joined_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `is_muted` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`room_id`,`user_id`),
  KEY `fk_cm_user` (`user_id`),
  CONSTRAINT `fk_cm_room` FOREIGN KEY (`room_id`) REFERENCES `chat_rooms` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_cm_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `chat_members`
--

/*!40000 ALTER TABLE `chat_members` DISABLE KEYS */;
INSERT INTO `chat_members` VALUES (1,1,'2026-11-20 05:39:56',0),(1,4,'2026-11-20 05:39:56',0),(2,1,'2026-11-20 05:39:56',0),(3,1,'2026-11-20 05:39:56',0),(4,1,'2026-11-20 05:39:56',0),(5,1,'2026-11-20 05:39:56',0);
/*!40000 ALTER TABLE `chat_members` ENABLE KEYS */;

--
-- Table structure for table `chat_messages`
--

DROP TABLE IF EXISTS `chat_messages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `chat_messages` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `room_id` int unsigned NOT NULL,
  `user_id` int unsigned DEFAULT NULL,
  `body` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `edited_at` datetime DEFAULT NULL,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_messages_room` (`room_id`,`id`),
  KEY `fk_msg_user` (`user_id`),
  CONSTRAINT `fk_msg_room` FOREIGN KEY (`room_id`) REFERENCES `chat_rooms` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_msg_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `chat_messages`
--

/*!40000 ALTER TABLE `chat_messages` DISABLE KEYS */;
/*!40000 ALTER TABLE `chat_messages` ENABLE KEYS */;

--
-- Table structure for table `chat_reads`
--

DROP TABLE IF EXISTS `chat_reads`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `chat_reads` (
  `room_id` int unsigned NOT NULL,
  `user_id` int unsigned NOT NULL,
  `last_read_id` bigint unsigned NOT NULL DEFAULT '0',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`room_id`,`user_id`),
  KEY `fk_cr_user` (`user_id`),
  CONSTRAINT `fk_cr_room` FOREIGN KEY (`room_id`) REFERENCES `chat_rooms` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_cr_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `chat_reads`
--

/*!40000 ALTER TABLE `chat_reads` DISABLE KEYS */;
/*!40000 ALTER TABLE `chat_reads` ENABLE KEYS */;

--
-- Table structure for table `chat_rooms`
--

DROP TABLE IF EXISTS `chat_rooms`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `chat_rooms` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `kind` enum('church','ministry','team') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'church',
  `name` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL,
  `slug` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `ministry_id` int unsigned DEFAULT NULL,
  `campus_id` int unsigned DEFAULT NULL,
  `color` varchar(16) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `icon` varchar(60) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_open` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_chat_slug` (`slug`),
  KEY `idx_chat_ministry` (`ministry_id`),
  KEY `fk_chat_campus` (`campus_id`),
  CONSTRAINT `fk_chat_campus` FOREIGN KEY (`campus_id`) REFERENCES `campuses` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_chat_ministry` FOREIGN KEY (`ministry_id`) REFERENCES `ministries` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `chat_rooms`
--

/*!40000 ALTER TABLE `chat_rooms` DISABLE KEYS */;
INSERT INTO `chat_rooms` VALUES (1,'church','The Congregation','congregation','The whole church, together.',NULL,NULL,'#2C97C5','chatbubbles-outline',1,'2026-11-20 05:39:56'),(2,'ministry','Worship Team','worship-team','Worship & Creative Arts room.',1,NULL,'#2C97C5','musical-notes-outline',1,'2026-11-20 05:39:56'),(3,'ministry','Youth','youth-room','Youth Ministry room.',2,NULL,'#7FC4E0','flash-outline',1,'2026-11-20 05:39:56'),(4,'ministry','Women of Joy','women-room','Women\'s Fellowship room.',3,NULL,'#B33A2A','flower-outline',1,'2026-11-20 05:39:56'),(5,'ministry','Men of Valour','men-room','Men\'s Fellowship room.',4,NULL,'#1B6F94','shield-checkmark-outline',1,'2026-11-20 05:39:56');
/*!40000 ALTER TABLE `chat_rooms` ENABLE KEYS */;

--
-- Table structure for table `content_items`
--

DROP TABLE IF EXISTS `content_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `content_items` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `type` enum('notice','devotional','sermon','media') COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(190) COLLATE utf8mb4_unicode_ci NOT NULL,
  `slug` varchar(190) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `excerpt` varchar(400) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `body` longtext COLLATE utf8mb4_unicode_ci,
  `media_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `thumbnail_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `campus_id` int unsigned DEFAULT NULL,
  `ministry_id` int unsigned DEFAULT NULL,
  `author_id` int unsigned DEFAULT NULL,
  `is_pinned` tinyint(1) NOT NULL DEFAULT '0',
  `status` enum('draft','published','archived') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'published',
  `published_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_content_type` (`type`,`status`,`published_at`),
  KEY `idx_content_campus` (`campus_id`),
  KEY `idx_content_ministry` (`ministry_id`),
  KEY `fk_content_author` (`author_id`),
  CONSTRAINT `fk_content_author` FOREIGN KEY (`author_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_content_campus` FOREIGN KEY (`campus_id`) REFERENCES `campuses` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_content_ministry` FOREIGN KEY (`ministry_id`) REFERENCES `ministries` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `content_items`
--

/*!40000 ALTER TABLE `content_items` DISABLE KEYS */;
INSERT INTO `content_items` VALUES (1,'notice','Welcome Home',NULL,NULL,'We are glad you are with us this Sunday. Service starts at 08:30.',NULL,NULL,1,NULL,1,1,'published','2026-11-20 05:39:56','2026-11-20 05:39:56','2026-11-20 05:39:56'),(2,'devotional','Walk in Love',NULL,NULL,'Beloved, walk in love, as Christ loved us and gave himself up for us.',NULL,NULL,1,NULL,1,0,'published','2026-11-20 05:39:56','2026-11-20 05:39:56','2026-11-20 05:39:56'),(3,'notice','Youth Camp 2026',NULL,NULL,'Registrations open for the July youth camp. Speak to the youth office.',NULL,NULL,1,2,1,0,'published','2026-11-20 05:39:56','2026-11-20 05:39:56','2026-11-20 05:39:56'),(4,'devotional','Quiet Strength',NULL,NULL,'Be still, and know that I am God.',NULL,NULL,1,NULL,1,0,'published','2026-11-20 05:39:56','2026-11-20 05:39:56','2026-11-20 05:39:56');
/*!40000 ALTER TABLE `content_items` ENABLE KEYS */;

--
-- Table structure for table `donations`
--

DROP TABLE IF EXISTS `donations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `donations` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `donor_id` int unsigned DEFAULT NULL,
  `fund` varchar(60) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'tithe',
  `amount` decimal(12,2) NOT NULL,
  `currency` char(3) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ZAR',
  `method` enum('online','card','eft','cash','payfast') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'online',
  `gateway` varchar(40) COLLATE utf8mb4_unicode_ci DEFAULT 'payfast',
  `reference` varchar(80) COLLATE utf8mb4_unicode_ci NOT NULL,
  `gateway_ref` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('pending','completed','failed','cancelled','refunded') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `donor_name` varchar(160) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `donor_email` varchar(190) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `message` varchar(400) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `payload` longtext COLLATE utf8mb4_unicode_ci,
  `paid_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_donation_reference` (`reference`),
  KEY `idx_donation_status` (`status`,`created_at`),
  KEY `idx_donation_donor` (`donor_id`),
  CONSTRAINT `fk_donation_donor` FOREIGN KEY (`donor_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `donations`
--

/*!40000 ALTER TABLE `donations` DISABLE KEYS */;
INSERT INTO `donations` VALUES (1,NULL,'tithe',150.00,'ZAR','online','payfast','JM-MWOJZ8D9-8F9E35',NULL,'pending',NULL,NULL,NULL,NULL,NULL,'2026-11-20 05:43:09','2026-11-20 05:43:09'),(2,NULL,'offering',50.00,'ZAR','online','payfast','JM-MWOJZ8DV-795610',NULL,'pending',NULL,NULL,NULL,NULL,NULL,'2026-11-20 05:43:09','2026-11-20 05:43:09');
/*!40000 ALTER TABLE `donations` ENABLE KEYS */;

--
-- Table structure for table `events`
--

DROP TABLE IF EXISTS `events`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `events` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `title` varchar(190) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `campus_id` int unsigned DEFAULT NULL,
  `ministry_id` int unsigned DEFAULT NULL,
  `location` varchar(190) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `image_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `starts_at` datetime NOT NULL,
  `ends_at` datetime DEFAULT NULL,
  `rsvp_open` tinyint(1) NOT NULL DEFAULT '1',
  `capacity` int unsigned DEFAULT NULL,
  `created_by` int unsigned DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_events_starts` (`starts_at`),
  KEY `idx_events_campus` (`campus_id`),
  KEY `fk_events_ministry` (`ministry_id`),
  KEY `fk_events_creator` (`created_by`),
  CONSTRAINT `fk_events_campus` FOREIGN KEY (`campus_id`) REFERENCES `campuses` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_events_creator` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_events_ministry` FOREIGN KEY (`ministry_id`) REFERENCES `ministries` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `events`
--

/*!40000 ALTER TABLE `events` DISABLE KEYS */;
INSERT INTO `events` VALUES (1,'Sunday Service','Main worship gathering',1,NULL,'Main Auditorium',NULL,'2026-11-22 08:30:00','2026-11-22 11:30:00',1,NULL,1,'2026-11-20 05:39:56','2026-11-20 05:39:56'),(2,'Prayer Night','Corporate prayer and fasting',1,NULL,'Chapel',NULL,'2026-11-23 19:00:00','2026-11-23 21:00:00',1,NULL,1,'2026-11-20 05:39:56','2026-11-20 05:39:56'),(3,'Youth Connect','Friday fellowship',1,2,'Youth Hall',NULL,'2026-11-27 18:00:00','2026-11-27 20:00:00',1,NULL,1,'2026-11-20 05:39:56','2026-11-20 05:39:56');
/*!40000 ALTER TABLE `events` ENABLE KEYS */;

--
-- Table structure for table `growth_tracks`
--

DROP TABLE IF EXISTS `growth_tracks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `growth_tracks` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(400) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `steps` json NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `sort_order` int NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `growth_tracks`
--

/*!40000 ALTER TABLE `growth_tracks` DISABLE KEYS */;
INSERT INTO `growth_tracks` VALUES (1,'Foundations','Begin your walk with Christ.','[\"Accept Christ\", \"Pray Daily\", \"Read Scripture\", \"Serve\", \"Share\"]',1,0),(2,'Discipleship Pathway','Grow into maturity.','[\"Baptism\", \"Community\", \"Mentorship\", \"Leadership\", \"Mission\"]',1,0);
/*!40000 ALTER TABLE `growth_tracks` ENABLE KEYS */;

--
-- Table structure for table `media_assets`
--

DROP TABLE IF EXISTS `media_assets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `media_assets` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `filename` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `original_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `path` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `url` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `mime` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `size_bytes` bigint unsigned DEFAULT NULL,
  `kind` enum('image','audio','video','document','other') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'other',
  `title` varchar(190) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `uploaded_by` int unsigned DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_media_kind` (`kind`),
  KEY `fk_media_user` (`uploaded_by`),
  CONSTRAINT `fk_media_user` FOREIGN KEY (`uploaded_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `media_assets`
--

/*!40000 ALTER TABLE `media_assets` DISABLE KEYS */;
INSERT INTO `media_assets` VALUES (1,'1795153428062-4jz7hpykuy.txt','test-upload.txt','uploads/1795153428062-4jz7hpykuy.txt','https://bid-aging-loved-departments.trycloudflare.com/uploads/1795153428062-4jz7hpykuy.txt','text/plain',59,'document','Test Upload',1,'2026-11-20 05:43:48'),(2,'1795153461437-8gfd0oxw9ex.txt','u2.txt','uploads/1795153461437-8gfd0oxw9ex.txt','https://bid-aging-loved-departments.trycloudflare.com/uploads/1795153461437-8gfd0oxw9ex.txt','text/plain',3,'document','Audit Check',1,'2026-11-20 05:44:21');
/*!40000 ALTER TABLE `media_assets` ENABLE KEYS */;

--
-- Table structure for table `ministries`
--

DROP TABLE IF EXISTS `ministries`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ministries` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `campus_id` int unsigned DEFAULT NULL,
  `name` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL,
  `slug` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL,
  `eyebrow` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `gathering` varchar(190) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `leader_id` int unsigned DEFAULT NULL,
  `color` varchar(16) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `icon` varchar(60) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sort_order` int NOT NULL DEFAULT '0',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_ministries_slug` (`slug`),
  KEY `idx_ministries_campus` (`campus_id`),
  KEY `fk_ministries_leader` (`leader_id`),
  CONSTRAINT `fk_ministries_campus` FOREIGN KEY (`campus_id`) REFERENCES `campuses` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_ministries_leader` FOREIGN KEY (`leader_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ministries`
--

/*!40000 ALTER TABLE `ministries` DISABLE KEYS */;
INSERT INTO `ministries` VALUES (1,1,'Worship & Creative Arts','worship','Worship Team',NULL,'Sundays 07:30',NULL,'#2C97C5','musical-notes-outline',0,1,'2026-11-20 05:39:56'),(2,1,'Youth Ministry','youth','Young & Rooted',NULL,'Fridays 18:00',NULL,'#7FC4E0','flash-outline',1,1,'2026-11-20 05:39:56'),(3,1,'Women of Joy','women','Women\'s Fellowship',NULL,'Saturdays 09:00',NULL,'#B33A2A','flower-outline',2,1,'2026-11-20 05:39:56'),(4,1,'Men of Valour','men','Men\'s Fellowship',NULL,'Saturdays 07:00',NULL,'#1B6F94','shield-checkmark-outline',3,1,'2026-11-20 05:39:56'),(5,1,'Children Ministry','children','Sunday School',NULL,'Sundays 09:00',NULL,'#7FC4E0','happy-outline',4,1,'2026-11-20 05:39:56'),(6,1,'Outreach & Missions','outreach','Community Care',NULL,'Monthly',NULL,'#123C4F','heart-outline',5,1,'2026-11-20 05:39:56');
/*!40000 ALTER TABLE `ministries` ENABLE KEYS */;

--
-- Table structure for table `notifications`
--

DROP TABLE IF EXISTS `notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notifications` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int unsigned DEFAULT NULL,
  `type` varchar(40) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'broadcast',
  `title` varchar(190) COLLATE utf8mb4_unicode_ci NOT NULL,
  `body` text COLLATE utf8mb4_unicode_ci,
  `link` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ministry_id` int unsigned DEFAULT NULL,
  `data` longtext COLLATE utf8mb4_unicode_ci,
  `read_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_notifications_user` (`user_id`,`read_at`),
  KEY `idx_notifications_created` (`created_at`),
  KEY `idx_notifications_ministry` (`ministry_id`),
  CONSTRAINT `fk_notif_ministry` FOREIGN KEY (`ministry_id`) REFERENCES `ministries` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_notif_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notifications`
--

/*!40000 ALTER TABLE `notifications` DISABLE KEYS */;
INSERT INTO `notifications` VALUES (1,4,'broadcast','Welcome to Joy Ministries','Download the app to stay connected with the family.',NULL,NULL,NULL,NULL,'2026-11-20 05:39:56');
/*!40000 ALTER TABLE `notifications` ENABLE KEYS */;

--
-- Table structure for table `password_resets`
--

DROP TABLE IF EXISTS `password_resets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `password_resets` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int unsigned NOT NULL,
  `code_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `expires_at` datetime NOT NULL,
  `used_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_reset_user` (`user_id`),
  CONSTRAINT `fk_reset_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `password_resets`
--

/*!40000 ALTER TABLE `password_resets` DISABLE KEYS */;
/*!40000 ALTER TABLE `password_resets` ENABLE KEYS */;

--
-- Table structure for table `prayer_prayers`
--

DROP TABLE IF EXISTS `prayer_prayers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `prayer_prayers` (
  `prayer_id` int unsigned NOT NULL,
  `user_id` int unsigned NOT NULL,
  `prayed_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`prayer_id`,`user_id`),
  KEY `fk_pp_user` (`user_id`),
  CONSTRAINT `fk_pp_prayer` FOREIGN KEY (`prayer_id`) REFERENCES `prayer_requests` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_pp_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `prayer_prayers`
--

/*!40000 ALTER TABLE `prayer_prayers` DISABLE KEYS */;
/*!40000 ALTER TABLE `prayer_prayers` ENABLE KEYS */;

--
-- Table structure for table `prayer_requests`
--

DROP TABLE IF EXISTS `prayer_requests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `prayer_requests` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `author_id` int unsigned DEFAULT NULL,
  `ministry_id` int unsigned DEFAULT NULL,
  `display_name` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `text` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_anonymous` tinyint(1) NOT NULL DEFAULT '0',
  `is_private` tinyint(1) NOT NULL DEFAULT '0',
  `status` enum('open','prayed','answered','hidden') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'open',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_prayer_status` (`status`,`created_at`),
  KEY `idx_prayer_ministry` (`ministry_id`),
  KEY `fk_prayer_author` (`author_id`),
  CONSTRAINT `fk_prayer_author` FOREIGN KEY (`author_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_prayer_ministry` FOREIGN KEY (`ministry_id`) REFERENCES `ministries` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `prayer_requests`
--

/*!40000 ALTER TABLE `prayer_requests` DISABLE KEYS */;
INSERT INTO `prayer_requests` VALUES (1,4,NULL,NULL,'Healing for my mother',0,0,'open','2026-11-20 05:39:56','2026-11-20 05:39:56'),(2,4,NULL,NULL,'Wisdom for a new job',1,0,'open','2026-11-20 05:39:56','2026-11-20 05:39:56'),(3,4,2,NULL,'Strength for our youth',0,0,'prayed','2026-11-20 05:39:56','2026-11-20 06:07:55');
/*!40000 ALTER TABLE `prayer_requests` ENABLE KEYS */;

--
-- Table structure for table `resources`
--

DROP TABLE IF EXISTS `resources`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `resources` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `title` varchar(190) COLLATE utf8mb4_unicode_ci NOT NULL,
  `kind` enum('book','guide','study','form','audio','video') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'book',
  `format` varchar(40) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ministry_id` int unsigned DEFAULT NULL,
  `description` varchar(400) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `file_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `media_id` int unsigned DEFAULT NULL,
  `downloads` int unsigned NOT NULL DEFAULT '0',
  `is_published` tinyint(1) NOT NULL DEFAULT '1',
  `sort_order` int NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_resources_published` (`is_published`,`sort_order`),
  KEY `idx_resources_ministry` (`ministry_id`),
  CONSTRAINT `fk_resources_ministry` FOREIGN KEY (`ministry_id`) REFERENCES `ministries` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `resources`
--

/*!40000 ALTER TABLE `resources` DISABLE KEYS */;
INSERT INTO `resources` VALUES (1,'New Believers Guide','guide','PDF',NULL,'A short guide for new believers.',NULL,NULL,0,1,0,'2026-11-20 05:39:56');
/*!40000 ALTER TABLE `resources` ENABLE KEYS */;

--
-- Table structure for table `rsvps`
--

DROP TABLE IF EXISTS `rsvps`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `rsvps` (
  `event_id` int unsigned NOT NULL,
  `user_id` int unsigned NOT NULL,
  `status` enum('yes','no','maybe') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'yes',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`event_id`,`user_id`),
  KEY `fk_rsvp_user` (`user_id`),
  CONSTRAINT `fk_rsvp_event` FOREIGN KEY (`event_id`) REFERENCES `events` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_rsvp_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `rsvps`
--

/*!40000 ALTER TABLE `rsvps` DISABLE KEYS */;
/*!40000 ALTER TABLE `rsvps` ENABLE KEYS */;

--
-- Table structure for table `sermons`
--

DROP TABLE IF EXISTS `sermons`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sermons` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `youtube_id` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(190) COLLATE utf8mb4_unicode_ci NOT NULL,
  `speaker` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `series` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `scripture` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `published_at` datetime DEFAULT NULL,
  `is_featured` tinyint(1) NOT NULL DEFAULT '0',
  `visible` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_sermons_youtube` (`youtube_id`),
  KEY `idx_sermons_published` (`published_at`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sermons`
--

/*!40000 ALTER TABLE `sermons` DISABLE KEYS */;
INSERT INTO `sermons` VALUES (1,'dQw4w9WgXcQ','The Upper Room','Pastor Grace Mwangi','Foundations','Acts 2:1-4','A teaching on the power of the Spirit.','2026-11-20 05:39:56',1,1,'2026-11-20 05:39:56');
/*!40000 ALTER TABLE `sermons` ENABLE KEYS */;

--
-- Table structure for table `settings`
--

DROP TABLE IF EXISTS `settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `settings` (
  `key_name` varchar(80) COLLATE utf8mb4_unicode_ci NOT NULL,
  `value` text COLLATE utf8mb4_unicode_ci,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`key_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `settings`
--

/*!40000 ALTER TABLE `settings` DISABLE KEYS */;
INSERT INTO `settings` VALUES ('church_name','Joy Ministries','2026-11-20 05:39:56'),('payfast_enabled','1','2026-11-20 05:39:56'),('payfast_merchant_id','10010868','2026-11-20 05:39:56'),('payfast_merchant_key','exnibu0q9zmuz','2026-11-20 05:39:56'),('payfast_mode','sandbox','2026-11-20 05:39:56'),('payfast_passphrase','','2026-11-20 05:39:56'),('public_base_url','https://bid-aging-loved-departments.trycloudflare.com','2026-11-20 05:44:38');
/*!40000 ALTER TABLE `settings` ENABLE KEYS */;

--
-- Table structure for table `user_growth`
--

DROP TABLE IF EXISTS `user_growth`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_growth` (
  `user_id` int unsigned NOT NULL,
  `track_id` int unsigned NOT NULL,
  `step_index` int NOT NULL DEFAULT '0',
  `completed` tinyint(1) NOT NULL DEFAULT '0',
  `joined_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`,`track_id`),
  KEY `fk_ug_track` (`track_id`),
  CONSTRAINT `fk_ug_track` FOREIGN KEY (`track_id`) REFERENCES `growth_tracks` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_ug_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_growth`
--

/*!40000 ALTER TABLE `user_growth` DISABLE KEYS */;
/*!40000 ALTER TABLE `user_growth` ENABLE KEYS */;

--
-- Table structure for table `user_ministries`
--

DROP TABLE IF EXISTS `user_ministries`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_ministries` (
  `user_id` int unsigned NOT NULL,
  `ministry_id` int unsigned NOT NULL,
  `role` enum('member','admin') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'member',
  `joined_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`,`ministry_id`),
  KEY `fk_um_ministry` (`ministry_id`),
  CONSTRAINT `fk_um_ministry` FOREIGN KEY (`ministry_id`) REFERENCES `ministries` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_um_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_ministries`
--

/*!40000 ALTER TABLE `user_ministries` DISABLE KEYS */;
INSERT INTO `user_ministries` VALUES (2,2,'admin','2026-11-20 05:39:56'),(3,3,'admin','2026-11-20 05:39:56'),(4,2,'member','2026-11-20 05:39:56');
/*!40000 ALTER TABLE `user_ministries` ENABLE KEYS */;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(190) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone` varchar(40) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` enum('member','leader','ministry_admin','admin') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'member',
  `campus_id` int unsigned DEFAULT NULL,
  `avatar_url` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `last_login_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_users_email` (`email`),
  UNIQUE KEY `uq_users_phone` (`phone`),
  KEY `idx_users_campus` (`campus_id`),
  CONSTRAINT `fk_users_campus` FOREIGN KEY (`campus_id`) REFERENCES `campuses` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'Pastor Grace Mwangi','admin@joyministries.co.za',NULL,'$2b$10$sda/QVbWbu8L9rL0qRUiwelycwOCayqKGdYkHkIrwOSovcMdTde3m','admin',1,NULL,1,'2026-11-20 05:40:48','2026-11-20 05:39:56','2026-11-20 05:40:48'),(2,'Youth Pastor','youth@joyministries.co.za',NULL,'$2b$10$EH53nASVRYq5iH4KeVn0fupgZFoTEq2m7OY7St08gfK3x622Q5Nxu','ministry_admin',1,NULL,1,NULL,'2026-11-20 05:39:56','2026-11-20 05:39:56'),(3,'Women Ministry Lead','women@joyministries.co.za',NULL,'$2b$10$hR2UXj7FryeWaXpbf84W6.4NhHjwpVXCbShFYZlxinRA.l0g0mzUK','ministry_admin',1,NULL,1,NULL,'2026-11-20 05:39:56','2026-11-20 05:39:56'),(4,'Amina Member','amina@joyministries.co.za',NULL,'$2b$10$A1rmOcc9J56vgwK6KQBfguQ4hySv2A7Noc/KoyR8ovW6eNxYzJ/Zy','member',1,NULL,1,NULL,'2026-11-20 05:39:56','2026-11-20 05:39:56');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-11-20  7:09:13
