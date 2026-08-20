-- MySQL dump 10.13  Distrib 5.7.44, for Linux (x86_64)
--
-- Host: localhost    Database: trackflow
-- ------------------------------------------------------
-- Server version	5.7.44

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `attachment`
--

DROP TABLE IF EXISTS `attachment`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `attachment` (
  `attachment_id` int(11) NOT NULL AUTO_INCREMENT,
  `ticket_id` int(11) NOT NULL,
  `file_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_path` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_size` int(10) unsigned DEFAULT NULL,
  `mime_type` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `uploaded_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`attachment_id`),
  KEY `fk_attachment_ticket` (`ticket_id`),
  CONSTRAINT `fk_attachment_ticket` FOREIGN KEY (`ticket_id`) REFERENCES `ticket` (`ticket_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `attachment`
--

LOCK TABLES `attachment` WRITE;
/*!40000 ALTER TABLE `attachment` DISABLE KEYS */;
/*!40000 ALTER TABLE `attachment` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `category`
--

DROP TABLE IF EXISTS `category`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `category` (
  `category_id` int(11) NOT NULL AUTO_INCREMENT,
  `category_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `department_id` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`category_id`),
  UNIQUE KEY `uq_category_name` (`category_name`),
  KEY `fk_category_department` (`department_id`),
  CONSTRAINT `fk_category_department` FOREIGN KEY (`department_id`) REFERENCES `department` (`department_id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `category`
--

LOCK TABLES `category` WRITE;
/*!40000 ALTER TABLE `category` DISABLE KEYS */;
INSERT INTO `category` VALUES (1,'Physical',13,'2026-04-23 14:40:56'),(2,'Hardware',2,'2026-04-23 14:40:56'),(3,'Software',9,'2026-04-23 14:40:56'),(4,'Other',NULL,'2026-04-23 14:40:56');
/*!40000 ALTER TABLE `category` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `department`
--

DROP TABLE IF EXISTS `department`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `department` (
  `department_id` int(11) NOT NULL AUTO_INCREMENT,
  `department_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `department_status` enum('active','inactive') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`department_id`),
  UNIQUE KEY `uq_department_name` (`department_name`)
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `department`
--

LOCK TABLES `department` WRITE;
/*!40000 ALTER TABLE `department` DISABLE KEYS */;
INSERT INTO `department` VALUES (1,'Physical','active','2026-04-23 14:40:56'),(2,'Hardware','active','2026-04-23 14:40:56'),(3,'Software','active','2026-04-23 14:40:56'),(7,'BCDR','active','2026-04-29 11:28:19'),(8,'Welcoming Team','active','2026-04-29 11:28:19'),(9,'Collection Center','active','2026-04-29 11:28:19'),(10,'Scientific Research Support','active','2026-04-29 11:28:19'),(11,'Building Management','active','2026-04-29 11:28:19'),(12,'Multimedia','active','2026-04-29 11:28:19'),(13,'BSRD','active','2026-04-29 11:28:19'),(14,'Interest Group Research & Development','active','2026-04-29 11:28:19'),(15,'Museum','active','2026-04-29 11:28:19'),(16,'Fabrication Lab','active','2026-04-29 11:28:19'),(17,'Competitive Interest Groups','active','2026-04-29 11:28:19'),(18,'Special Event Support','active','2026-04-29 11:28:19');
/*!40000 ALTER TABLE `department` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `escalation_log`
--

DROP TABLE IF EXISTS `escalation_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `escalation_log` (
  `escalation_id` int(11) NOT NULL AUTO_INCREMENT,
  `ticket_id` int(11) NOT NULL,
  `escalated_by` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `escalated_to` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `reason` text COLLATE utf8mb4_unicode_ci,
  `escalated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`escalation_id`),
  KEY `fk_escalation_ticket` (`ticket_id`),
  KEY `fk_escalation_by` (`escalated_by`),
  KEY `fk_escalation_to` (`escalated_to`),
  CONSTRAINT `fk_escalation_by` FOREIGN KEY (`escalated_by`) REFERENCES `user` (`user_id`) ON UPDATE CASCADE,
  CONSTRAINT `fk_escalation_ticket` FOREIGN KEY (`ticket_id`) REFERENCES `ticket` (`ticket_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_escalation_to` FOREIGN KEY (`escalated_to`) REFERENCES `user` (`user_id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `escalation_log`
--

LOCK TABLES `escalation_log` WRITE;
/*!40000 ALTER TABLE `escalation_log` DISABLE KEYS */;
/*!40000 ALTER TABLE `escalation_log` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `feedback`
--

DROP TABLE IF EXISTS `feedback`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `feedback` (
  `feedback_id` int(11) NOT NULL AUTO_INCREMENT,
  `ticket_id` int(11) NOT NULL,
  `user_id` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `rating` tinyint(3) unsigned NOT NULL,
  `comment` text COLLATE utf8mb4_unicode_ci,
  `submitted_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`feedback_id`),
  UNIQUE KEY `uq_feedback_ticket` (`ticket_id`),
  KEY `fk_feedback_user` (`user_id`),
  CONSTRAINT `fk_feedback_ticket` FOREIGN KEY (`ticket_id`) REFERENCES `ticket` (`ticket_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_feedback_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`user_id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `feedback`
--

LOCK TABLES `feedback` WRITE;
/*!40000 ALTER TABLE `feedback` DISABLE KEYS */;
/*!40000 ALTER TABLE `feedback` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notification`
--

DROP TABLE IF EXISTS `notification`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `notification` (
  `notification_id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `ticket_id` int(11) DEFAULT NULL,
  `message` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_read` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`notification_id`),
  KEY `fk_notification_user` (`user_id`),
  KEY `fk_notification_ticket` (`ticket_id`),
  CONSTRAINT `fk_notification_ticket` FOREIGN KEY (`ticket_id`) REFERENCES `ticket` (`ticket_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_notification_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notification`
--

LOCK TABLES `notification` WRITE;
/*!40000 ALTER TABLE `notification` DISABLE KEYS */;
INSERT INTO `notification` VALUES (1,'Atest',43,'Your ticket #43 has been submitted successfully. Reference: TKT-0043.',1,'2026-08-20 18:49:01'),(2,'A1235',43,'New ticket #43 in your queue: \"Broke the claims site\".',0,'2026-08-20 18:49:01'),(3,'ATLA',43,'New ticket #43 in your queue: \"Broke the claims site\".',1,'2026-08-20 18:49:01'),(4,'A00874',23,'Your ticket #23 status has been updated to: closed.',0,'2026-08-20 18:49:23'),(5,'A00873',19,'Your ticket #19 status has been updated to: closed.',0,'2026-08-20 18:49:23'),(6,'A00873',42,'Your ticket #42 has been assigned and is being worked on.',0,'2026-08-20 18:49:42'),(7,'ATLA',42,'You\'ve been assigned ticket #42: \"Microscope stage motor unresponsive\".',1,'2026-08-20 18:49:42'),(8,'ATLA',43,'You\'ve been assigned ticket #43: \"Broke the claims site\".',0,'2026-08-20 18:52:25'),(9,'Atest',43,'Your ticket #43 has been assigned and is being worked on.',1,'2026-08-20 18:52:25');
/*!40000 ALTER TABLE `notification` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ticket`
--

DROP TABLE IF EXISTS `ticket`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `ticket` (
  `ticket_id` int(11) NOT NULL AUTO_INCREMENT,
  `ticket_title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `ticket_description` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `ticket_status` enum('open','in_progress','struggling','resolved','closed') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'open',
  `ticket_escalated` tinyint(1) NOT NULL DEFAULT '0',
  `ticket_sla_deadline` timestamp NULL DEFAULT NULL,
  `resolution_note` text COLLATE utf8mb4_unicode_ci,
  `ticket_created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `ticket_updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `user_id` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `assigned_user_id` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `category_id` int(11) DEFAULT NULL,
  `department_id` int(11) DEFAULT NULL,
  `resolved_at` datetime DEFAULT NULL,
  PRIMARY KEY (`ticket_id`),
  KEY `fk_ticket_user` (`user_id`),
  KEY `fk_ticket_assigned_user` (`assigned_user_id`),
  KEY `fk_ticket_category` (`category_id`),
  KEY `fk_ticket_department` (`department_id`),
  CONSTRAINT `fk_ticket_assigned_user` FOREIGN KEY (`assigned_user_id`) REFERENCES `user` (`user_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_ticket_category` FOREIGN KEY (`category_id`) REFERENCES `category` (`category_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_ticket_department` FOREIGN KEY (`department_id`) REFERENCES `department` (`department_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_ticket_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`user_id`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=44 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ticket`
--

LOCK TABLES `ticket` WRITE;
/*!40000 ALTER TABLE `ticket` DISABLE KEYS */;
INSERT INTO `ticket` VALUES (1,'Keyboard input lag on shared workstation','Keyboard input lag on shared workstation. Reported by end user, routed to department 13.','closed',0,NULL,'Issue diagnosed and fixed. Verified working with the reporting user.','2026-08-04 17:17:12','2026-08-06 07:42:52','A00874','2695831',1,13,'2026-08-05 07:42:52'),(2,'Database query timing out during peak hours','Database query timing out during peak hours. Reported by end user, routed to department 9.','closed',0,NULL,'Issue diagnosed and fixed. Verified working with the reporting user.','2026-08-02 02:30:53','2026-08-03 18:58:50','A00873','A1235',3,9,'2026-08-02 18:58:50'),(3,'Access card not unlocking lab door','Access card not unlocking lab door. Reported by end user, routed to department 13.','closed',0,NULL,'Issue diagnosed and fixed. Verified working with the reporting user.','2026-08-01 23:27:29','2026-08-03 01:05:01','A00873','A1235',1,13,'2026-08-02 01:05:01'),(4,'New starter account not provisioned','New starter account not provisioned. Reported by end user, routed to department 9.','closed',0,NULL,'Issue diagnosed and fixed. Verified working with the reporting user.','2026-08-15 15:16:19','2026-08-17 04:03:29','A00874','2695831',3,9,'2026-08-16 04:03:29'),(5,'Database query timing out during peak hours','Database query timing out during peak hours. Reported by end user, routed to department 13.','closed',0,NULL,'Issue diagnosed and fixed. Verified working with the reporting user.','2026-08-09 14:12:37','2026-08-10 21:03:08','A00873','A1235',1,13,'2026-08-09 21:03:08'),(6,'Printer jammed and showing error code','Printer jammed and showing error code. Reported by end user, routed to department 13.','closed',0,NULL,'Issue diagnosed and fixed. Verified working with the reporting user.','2026-08-10 13:19:25','2026-08-11 20:09:32','A00874','2695831',1,13,'2026-08-10 20:09:32'),(7,'New starter account not provisioned','New starter account not provisioned. Reported by end user, routed to department 2.','closed',0,NULL,'Issue diagnosed and fixed. Verified working with the reporting user.','2026-08-14 08:22:31','2026-08-15 11:24:22','A00874','2695831',2,2,'2026-08-14 11:24:22'),(8,'VPN disconnecting every few minutes','VPN disconnecting every few minutes. Reported by end user, routed to department 2.','closed',0,NULL,'Issue diagnosed and fixed. Verified working with the reporting user.','2026-08-10 02:40:03','2026-08-11 06:17:19','A00873','A1235',2,2,'2026-08-10 06:17:19'),(9,'Keyboard input lag on shared workstation','Keyboard input lag on shared workstation. Reported by end user, routed to department 9.','closed',0,NULL,'Issue diagnosed and fixed. Verified working with the reporting user.','2026-08-08 08:34:50','2026-08-09 21:42:17','A00873','2695831',3,9,'2026-08-08 21:42:17'),(10,'Backup job failed overnight','Backup job failed overnight. Reported by end user, routed to department 13.','closed',0,NULL,'Issue diagnosed and fixed. Verified working with the reporting user.','2026-08-12 08:07:50','2026-08-14 05:49:12','A00873','A12345',1,13,'2026-08-13 05:49:12'),(11,'Storage room shelving unit damaged','Storage room shelving unit damaged. Reported by end user, routed to department 2.','closed',0,NULL,'Issue diagnosed and fixed. Verified working with the reporting user.','2026-08-06 10:02:48','2026-08-08 00:23:45','A00873','A12345',2,2,'2026-08-07 00:23:45'),(12,'Monitor flickering during long sessions','Monitor flickering during long sessions. Reported by end user, routed to department 9.','closed',0,NULL,'Issue diagnosed and fixed. Verified working with the reporting user.','2026-08-14 07:09:32','2026-08-15 22:13:57','A00873','A1235',3,9,'2026-08-14 22:13:57'),(13,'Backup job failed overnight','Backup job failed overnight. Reported by end user, routed to department 13.','closed',0,NULL,'Issue diagnosed and fixed. Verified working with the reporting user.','2026-08-14 20:26:48','2026-08-16 12:45:29','A00874','A12345',1,13,'2026-08-15 12:45:29'),(14,'Wi-Fi dropping intermittently in lab','Wi-Fi dropping intermittently in lab. Reported by end user, routed to department 2.','closed',0,NULL,'Issue diagnosed and fixed. Verified working with the reporting user.','2026-08-08 23:45:52','2026-08-11 09:13:52','A00873','2695831',2,2,'2026-08-10 09:13:52'),(15,'Audio system feedback during event setup','Audio system feedback during event setup. Reported by end user, routed to department 13.','closed',0,NULL,'Issue diagnosed and fixed. Verified working with the reporting user.','2026-08-06 11:51:50','2026-08-09 03:30:12','A00873','A1235',1,13,'2026-08-08 03:30:12'),(16,'Backup job failed overnight','Backup job failed overnight. Reported by end user, routed to department 2.','closed',0,NULL,'Issue diagnosed and fixed. Verified working with the reporting user.','2026-08-04 17:20:26','2026-08-07 17:37:31','A00874','2695831',2,2,'2026-08-06 17:37:31'),(17,'Whiteboard screen calibration off','Whiteboard screen calibration off. Reported by end user, routed to department 9.','closed',0,NULL,'Issue diagnosed and fixed. Verified working with the reporting user.','2026-08-11 17:34:50','2026-08-14 03:57:57','A00874','A1235',3,9,'2026-08-13 03:57:57'),(18,'Login failing after password reset','Login failing after password reset. Reported by end user, routed to department 2.','closed',0,NULL,'Issue diagnosed and fixed. Verified working with the reporting user.','2026-08-13 16:49:14','2026-08-17 01:20:47','A00874','2695831',2,2,'2026-08-16 01:20:47'),(19,'Monitor flickering during long sessions','Monitor flickering during long sessions. Reported by end user, routed to department 13.','closed',0,NULL,'Auto-closed by frontend timer (3s after resolution)','2026-08-17 21:28:53','2026-08-20 18:49:23','A00873','2695831',1,13,'2026-08-18 07:51:29'),(20,'New starter account not provisioned','New starter account not provisioned. Reported by end user, routed to department 2.','resolved',0,NULL,'Issue diagnosed and fixed. Verified working with the reporting user.','2026-08-18 13:03:28','2026-08-19 01:23:22','A00874','A1235',2,2,'2026-08-19 01:23:22'),(21,'Software licence expired for design suite','Software licence expired for design suite. Reported by end user, routed to department 9.','resolved',0,NULL,'Issue diagnosed and fixed. Verified working with the reporting user.','2026-08-18 14:12:07','2026-08-18 19:58:43','A00873','A1235',3,9,'2026-08-18 19:58:43'),(22,'VPN disconnecting every few minutes','VPN disconnecting every few minutes. Reported by end user, routed to department 9.','resolved',0,NULL,'Issue diagnosed and fixed. Verified working with the reporting user.','2026-08-17 23:19:02','2026-08-18 14:35:02','A00874','2695831',3,9,'2026-08-18 14:35:02'),(23,'Monitor flickering during long sessions','Monitor flickering during long sessions. Reported by end user, routed to department 13.','closed',0,NULL,'Auto-closed by frontend timer (3s after resolution)','2026-08-18 09:56:11','2026-08-20 18:49:23','A00874','A1235',1,13,'2026-08-18 13:56:28'),(24,'Email distribution list misconfigured','Email distribution list misconfigured. Reported by end user, routed to department 9.','resolved',0,NULL,'Issue diagnosed and fixed. Verified working with the reporting user.','2026-08-19 00:41:15','2026-08-19 19:01:38','A00874','A1235',3,9,'2026-08-19 19:01:38'),(25,'Email distribution list misconfigured','Email distribution list misconfigured. Reported by end user, routed to department 2.','resolved',0,NULL,'Issue diagnosed and fixed. Verified working with the reporting user.','2026-08-15 08:04:59','2026-08-16 12:52:04','A00873','A1235',2,2,'2026-08-16 12:52:04'),(26,'Storage room shelving unit damaged','Storage room shelving unit damaged. Reported by end user, routed to department 2.','resolved',0,NULL,'Issue diagnosed and fixed. Verified working with the reporting user.','2026-08-17 04:47:05','2026-08-18 15:10:11','A00873','2695831',2,2,'2026-08-18 15:10:11'),(27,'Whiteboard screen calibration off','Whiteboard screen calibration off. Reported by end user, routed to department 13.','in_progress',0,NULL,NULL,'2026-08-20 04:57:17','2026-08-20 05:43:49','A00873','2695831',1,13,NULL),(28,'Microscope stage motor unresponsive','Microscope stage motor unresponsive. Reported by end user, routed to department 9.','in_progress',0,NULL,NULL,'2026-08-19 15:45:58','2026-08-19 16:42:22','A00874','2695831',3,9,NULL),(29,'Monitor flickering during long sessions','Monitor flickering during long sessions. Reported by end user, routed to department 9.','in_progress',0,NULL,NULL,'2026-08-18 03:18:03','2026-08-18 05:38:51','A00874','A1235',3,9,NULL),(30,'Microscope stage motor unresponsive','Microscope stage motor unresponsive. Reported by end user, routed to department 9.','in_progress',0,NULL,NULL,'2026-08-19 14:59:48','2026-08-19 18:03:05','A00874','2695831',3,9,NULL),(31,'Storage room shelving unit damaged','Storage room shelving unit damaged. Reported by end user, routed to department 13.','in_progress',0,NULL,NULL,'2026-08-18 15:54:05','2026-08-18 19:33:00','A00874','A12345',1,13,NULL),(32,'Keyboard input lag on shared workstation','Keyboard input lag on shared workstation. Reported by end user, routed to department 2.','in_progress',0,NULL,NULL,'2026-08-17 12:39:44','2026-08-17 14:20:43','A00873','2695831',2,2,NULL),(33,'Keyboard input lag on shared workstation','Keyboard input lag on shared workstation. Reported by end user, routed to department 9.','struggling',1,NULL,'Stuck  waiting on replacement part / vendor support.','2026-08-11 09:02:50','2026-08-11 16:50:40','A00873','A1235',3,9,NULL),(34,'Audio system feedback during event setup','Audio system feedback during event setup. Reported by end user, routed to department 13.','struggling',1,NULL,'Stuck  waiting on replacement part / vendor support.','2026-08-11 18:19:09','2026-08-12 00:50:47','A00873','2695831',1,13,NULL),(35,'Login failing after password reset','Login failing after password reset. Reported by end user, routed to department 2.','struggling',1,NULL,'Stuck  waiting on replacement part / vendor support.','2026-08-15 17:20:45','2026-08-16 03:41:18','A00873','A1235',2,2,NULL),(36,'Database query timing out during peak hours','Database query timing out during peak hours. Reported by end user, routed to department 2.','struggling',1,NULL,'Stuck  waiting on replacement part / vendor support.','2026-08-12 11:43:49','2026-08-12 19:49:56','A00873','A12345',2,2,NULL),(37,'New starter account not provisioned','New starter account not provisioned. Reported by end user, routed to department 2.','open',0,NULL,NULL,'2026-08-19 11:56:40','2026-08-19 11:56:40','A00874',NULL,2,2,NULL),(38,'Air conditioning not cooling in server room','Air conditioning not cooling in server room. Reported by end user, routed to department 9.','open',0,NULL,NULL,'2026-08-20 08:42:26','2026-08-20 08:42:26','A00873',NULL,3,9,NULL),(39,'Network drive not mounting on lab PCs','Network drive not mounting on lab PCs. Reported by end user, routed to department 13.','open',0,NULL,NULL,'2026-08-20 23:03:04','2026-08-20 23:03:04','A00873',NULL,1,13,NULL),(40,'Monitor flickering during long sessions','Monitor flickering during long sessions. Reported by end user, routed to department 2.','open',0,NULL,NULL,'2026-08-20 04:16:58','2026-08-20 04:16:58','A00873',NULL,2,2,NULL),(41,'New starter account not provisioned','New starter account not provisioned. Reported by end user, routed to department 2.','open',0,NULL,NULL,'2026-08-21 00:04:24','2026-08-21 00:04:24','A00873',NULL,2,2,NULL),(42,'Microscope stage motor unresponsive','Microscope stage motor unresponsive. Reported by end user, routed to department 13.','in_progress',0,NULL,NULL,'2026-08-19 09:04:28','2026-08-20 18:49:42','A00873','ATLA',1,13,NULL),(43,'Broke the claims site','the claims site is giving me 403 forbidden error','in_progress',0,NULL,NULL,'2026-08-20 18:49:01','2026-08-20 18:52:25','Atest','ATLA',1,13,NULL);
/*!40000 ALTER TABLE `ticket` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ticket_status_log`
--

DROP TABLE IF EXISTS `ticket_status_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `ticket_status_log` (
  `log_id` int(11) NOT NULL AUTO_INCREMENT,
  `ticket_id` int(11) NOT NULL,
  `old_status` enum('open','in_progress','struggling','resolved','closed') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `new_status` enum('open','in_progress','struggling','resolved','closed') COLLATE utf8mb4_unicode_ci NOT NULL,
  `changed_by` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `note` text COLLATE utf8mb4_unicode_ci,
  `changed_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`log_id`),
  KEY `fk_log_ticket` (`ticket_id`),
  KEY `fk_log_user` (`changed_by`),
  CONSTRAINT `fk_log_ticket` FOREIGN KEY (`ticket_id`) REFERENCES `ticket` (`ticket_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_log_user` FOREIGN KEY (`changed_by`) REFERENCES `user` (`user_id`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=89 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ticket_status_log`
--

LOCK TABLES `ticket_status_log` WRITE;
/*!40000 ALTER TABLE `ticket_status_log` DISABLE KEYS */;
INSERT INTO `ticket_status_log` VALUES (1,1,'open','in_progress','2695831','Claimed by 2695831','2026-08-04 17:32:12'),(2,1,'in_progress','resolved','2695831','Issue diagnosed and fixed. Verified working with the reporting user.','2026-08-05 07:42:52'),(3,1,'resolved','closed','2695831','Auto-closed 24h after resolution','2026-08-06 07:42:52'),(4,2,'open','in_progress','A1235','Claimed by A1235','2026-08-02 02:45:53'),(5,2,'in_progress','resolved','A1235','Issue diagnosed and fixed. Verified working with the reporting user.','2026-08-02 18:58:50'),(6,2,'resolved','closed','A1235','Auto-closed 24h after resolution','2026-08-03 18:58:50'),(7,3,'open','in_progress','A1235','Claimed by A1235','2026-08-01 23:42:29'),(8,3,'in_progress','resolved','A1235','Issue diagnosed and fixed. Verified working with the reporting user.','2026-08-02 01:05:01'),(9,3,'resolved','closed','A1235','Auto-closed 24h after resolution','2026-08-03 01:05:01'),(10,4,'open','in_progress','2695831','Claimed by 2695831','2026-08-15 15:31:19'),(11,4,'in_progress','resolved','2695831','Issue diagnosed and fixed. Verified working with the reporting user.','2026-08-16 04:03:29'),(12,4,'resolved','closed','2695831','Auto-closed 24h after resolution','2026-08-17 04:03:29'),(13,5,'open','in_progress','A1235','Claimed by A1235','2026-08-09 14:27:37'),(14,5,'in_progress','resolved','A1235','Issue diagnosed and fixed. Verified working with the reporting user.','2026-08-09 21:03:08'),(15,5,'resolved','closed','A1235','Auto-closed 24h after resolution','2026-08-10 21:03:08'),(16,6,'open','in_progress','2695831','Claimed by 2695831','2026-08-10 13:34:25'),(17,6,'in_progress','resolved','2695831','Issue diagnosed and fixed. Verified working with the reporting user.','2026-08-10 20:09:32'),(18,6,'resolved','closed','2695831','Auto-closed 24h after resolution','2026-08-11 20:09:32'),(19,7,'open','in_progress','2695831','Claimed by 2695831','2026-08-14 08:37:31'),(20,7,'in_progress','resolved','2695831','Issue diagnosed and fixed. Verified working with the reporting user.','2026-08-14 11:24:22'),(21,7,'resolved','closed','2695831','Auto-closed 24h after resolution','2026-08-15 11:24:22'),(22,8,'open','in_progress','A1235','Claimed by A1235','2026-08-10 02:55:03'),(23,8,'in_progress','resolved','A1235','Issue diagnosed and fixed. Verified working with the reporting user.','2026-08-10 06:17:19'),(24,8,'resolved','closed','A1235','Auto-closed 24h after resolution','2026-08-11 06:17:19'),(25,9,'open','in_progress','2695831','Claimed by 2695831','2026-08-08 08:49:50'),(26,9,'in_progress','resolved','2695831','Issue diagnosed and fixed. Verified working with the reporting user.','2026-08-08 21:42:17'),(27,9,'resolved','closed','2695831','Auto-closed 24h after resolution','2026-08-09 21:42:17'),(28,10,'open','in_progress','A12345','Claimed by A12345','2026-08-12 08:22:50'),(29,10,'in_progress','resolved','A12345','Issue diagnosed and fixed. Verified working with the reporting user.','2026-08-13 05:49:12'),(30,10,'resolved','closed','A12345','Auto-closed 24h after resolution','2026-08-14 05:49:12'),(31,11,'open','in_progress','A12345','Claimed by A12345','2026-08-06 10:17:48'),(32,11,'in_progress','resolved','A12345','Issue diagnosed and fixed. Verified working with the reporting user.','2026-08-07 00:23:45'),(33,11,'resolved','closed','A12345','Auto-closed 24h after resolution','2026-08-08 00:23:45'),(34,12,'open','in_progress','A1235','Claimed by A1235','2026-08-14 07:24:32'),(35,12,'in_progress','resolved','A1235','Issue diagnosed and fixed. Verified working with the reporting user.','2026-08-14 22:13:57'),(36,12,'resolved','closed','A1235','Auto-closed 24h after resolution','2026-08-15 22:13:57'),(37,13,'open','in_progress','A12345','Claimed by A12345','2026-08-14 20:41:48'),(38,13,'in_progress','resolved','A12345','Issue diagnosed and fixed. Verified working with the reporting user.','2026-08-15 12:45:29'),(39,13,'resolved','closed','A12345','Auto-closed 24h after resolution','2026-08-16 12:45:29'),(40,14,'open','in_progress','2695831','Claimed by 2695831','2026-08-09 00:00:52'),(41,14,'in_progress','resolved','2695831','Issue diagnosed and fixed. Verified working with the reporting user.','2026-08-10 09:13:52'),(42,14,'resolved','closed','2695831','Auto-closed 24h after resolution','2026-08-11 09:13:52'),(43,15,'open','in_progress','A1235','Claimed by A1235','2026-08-06 12:06:50'),(44,15,'in_progress','resolved','A1235','Issue diagnosed and fixed. Verified working with the reporting user.','2026-08-08 03:30:12'),(45,15,'resolved','closed','A1235','Auto-closed 24h after resolution','2026-08-09 03:30:12'),(46,16,'open','in_progress','2695831','Claimed by 2695831','2026-08-04 17:35:26'),(47,16,'in_progress','resolved','2695831','Issue diagnosed and fixed. Verified working with the reporting user.','2026-08-06 17:37:31'),(48,16,'resolved','closed','2695831','Auto-closed 24h after resolution','2026-08-07 17:37:31'),(49,17,'open','in_progress','A1235','Claimed by A1235','2026-08-11 17:49:50'),(50,17,'in_progress','resolved','A1235','Issue diagnosed and fixed. Verified working with the reporting user.','2026-08-13 03:57:57'),(51,17,'resolved','closed','A1235','Auto-closed 24h after resolution','2026-08-14 03:57:57'),(52,18,'open','in_progress','2695831','Claimed by 2695831','2026-08-13 17:04:14'),(53,18,'in_progress','resolved','2695831','Issue diagnosed and fixed. Verified working with the reporting user.','2026-08-16 01:20:47'),(54,18,'resolved','closed','2695831','Auto-closed 24h after resolution','2026-08-17 01:20:47'),(55,19,'open','in_progress','2695831','Claimed by 2695831','2026-08-17 21:43:53'),(56,19,'in_progress','resolved','2695831','Issue diagnosed and fixed. Verified working with the reporting user.','2026-08-18 07:51:29'),(57,20,'open','in_progress','A1235','Claimed by A1235','2026-08-18 13:18:28'),(58,20,'in_progress','resolved','A1235','Issue diagnosed and fixed. Verified working with the reporting user.','2026-08-19 01:23:22'),(59,21,'open','in_progress','A1235','Claimed by A1235','2026-08-18 14:27:07'),(60,21,'in_progress','resolved','A1235','Issue diagnosed and fixed. Verified working with the reporting user.','2026-08-18 19:58:43'),(61,22,'open','in_progress','2695831','Claimed by 2695831','2026-08-17 23:34:02'),(62,22,'in_progress','resolved','2695831','Issue diagnosed and fixed. Verified working with the reporting user.','2026-08-18 14:35:02'),(63,23,'open','in_progress','A1235','Claimed by A1235','2026-08-18 10:11:11'),(64,23,'in_progress','resolved','A1235','Issue diagnosed and fixed. Verified working with the reporting user.','2026-08-18 13:56:28'),(65,24,'open','in_progress','A1235','Claimed by A1235','2026-08-19 00:56:15'),(66,24,'in_progress','resolved','A1235','Issue diagnosed and fixed. Verified working with the reporting user.','2026-08-19 19:01:38'),(67,25,'open','in_progress','A1235','Claimed by A1235','2026-08-15 08:19:59'),(68,25,'in_progress','resolved','A1235','Issue diagnosed and fixed. Verified working with the reporting user.','2026-08-16 12:52:04'),(69,26,'open','in_progress','2695831','Claimed by 2695831','2026-08-17 05:02:05'),(70,26,'in_progress','resolved','2695831','Issue diagnosed and fixed. Verified working with the reporting user.','2026-08-18 15:10:11'),(71,27,'open','in_progress','2695831','Claimed by 2695831','2026-08-20 05:43:49'),(72,28,'open','in_progress','2695831','Claimed by 2695831','2026-08-19 16:42:22'),(73,29,'open','in_progress','A1235','Claimed by A1235','2026-08-18 05:38:51'),(74,30,'open','in_progress','2695831','Claimed by 2695831','2026-08-19 18:03:05'),(75,31,'open','in_progress','A12345','Claimed by A12345','2026-08-18 19:33:00'),(76,32,'open','in_progress','2695831','Claimed by 2695831','2026-08-17 14:20:43'),(77,33,'open','in_progress','A1235','Claimed by A1235','2026-08-11 09:47:44'),(78,33,'in_progress','struggling','A1235','Stuck  waiting on replacement part / vendor support.','2026-08-11 16:50:40'),(79,34,'open','in_progress','2695831','Claimed by 2695831','2026-08-11 20:37:07'),(80,34,'in_progress','struggling','2695831','Stuck  waiting on replacement part / vendor support.','2026-08-12 00:50:47'),(81,35,'open','in_progress','A1235','Claimed by A1235','2026-08-15 21:07:12'),(82,35,'in_progress','struggling','A1235','Stuck  waiting on replacement part / vendor support.','2026-08-16 03:41:18'),(83,36,'open','in_progress','A12345','Claimed by A12345','2026-08-12 12:33:37'),(84,36,'in_progress','struggling','A12345','Stuck  waiting on replacement part / vendor support.','2026-08-12 19:49:56'),(85,23,'resolved','closed','ATLA','Auto-closed by frontend timer (3s after resolution)','2026-08-20 18:49:23'),(86,19,'resolved','closed','ATLA','Auto-closed by frontend timer (3s after resolution)','2026-08-20 18:49:23'),(87,42,'open','in_progress','ATLA','Claimed by ATLA','2026-08-20 18:49:42'),(88,43,'open','in_progress','ATLA','Claimed by ATLA','2026-08-20 18:52:25');
/*!40000 ALTER TABLE `ticket_status_log` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user`
--

DROP TABLE IF EXISTS `user`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `user` (
  `user_id` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_password_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_role` enum('end_user','tla','mss_manager','admin') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'end_user',
  `user_status` enum('active','inactive') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `department_id` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `uq_user_email` (`user_email`),
  KEY `fk_user_department` (`department_id`),
  CONSTRAINT `fk_user_department` FOREIGN KEY (`department_id`) REFERENCES `department` (`department_id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user`
--

LOCK TABLES `user` WRITE;
/*!40000 ALTER TABLE `user` DISABLE KEYS */;
INSERT INTO `user` VALUES ('2695831','Test user','rakhivhanithembu@gmail.com','$2b$10$Z6LmnPB0ff6ztOkJWSc./ePd0Pn1lqiVlRsmMqGjtpV/xm4jRxcPi','tla','active',9,'2026-04-25 16:18:17','2026-04-29 18:33:43'),('A0086767','Thembuluwo Rakhivhani','2695831@students.wits.ac.za','$2b$10$qxekOH5yEHp00AZKy4N8IOd7oiZgkSWLhZk9cD.RrXqKCz2BB71vW','admin','active',NULL,'2026-04-25 13:34:02','2026-04-26 13:56:33'),('A00873','John Student','john.student@wits.ac.za','$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi','end_user','active',NULL,'2026-04-23 14:54:59','2026-04-23 14:54:59'),('A00874','Jane Lecturer','jane.lecturer@wits.ac.za','$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi','end_user','active',NULL,'2026-04-23 14:54:59','2026-04-23 14:54:59'),('A12345','thendo test','ttest@gmail.com','$2b$10$fjh20a6iLEF2JJ0AA2zvzOTJMJC47z7weJWY5UNgl5mkJ5YCCUnEq','tla','active',7,'2026-04-29 18:32:02','2026-04-29 18:32:02'),('A1235','Emihle test','emitest@gmail.com','$2b$10$MAOztfkFlxLm5nF2sRz7seEtFJ8dcCQ9kTheHJ1liT9rw3u382ada','tla','active',13,'2026-04-29 18:32:58','2026-04-29 18:32:58'),('ADM001','Dave Admin','dave.admin@mss.ac.za','$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi','admin','active',NULL,'2026-04-23 14:54:59','2026-04-23 14:54:59'),('AMAN','TEST MANAGER','aman@gmail.com','$2b$10$EH.fFZWm6Q.yZYnI9NuxneybOl0JqWm1GrqcwverZ2m0ZNiMuY3Jq','mss_manager','active',13,'2026-04-29 10:16:03','2026-08-20 11:04:44'),('Atest','test user','test@gmail.com','$2b$10$IhTbZMRCI.sRAsMSLkojauWqFzKGAFPHoaT.0leT8G5lquPCcklHa','end_user','active',NULL,'2026-04-29 06:29:48','2026-04-29 06:29:48'),('ATLA','test TLA','atla@gmail.com','$2b$10$RltPYeGSkVz/QzpkrLjUtupTLVPxXFJFzHvtBWJz8kRPo4LlWLS7G','tla','active',13,'2026-04-29 06:32:16','2026-04-29 18:33:34'),('EMP001','Alice Technician','alice.tech@mss.ac.za','$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi','tla','active',18,'2026-04-23 14:54:59','2026-04-29 18:34:47'),('EMP002','Bob Hardware','bob.hardware@mss.ac.za','$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi','tla','active',10,'2026-04-23 14:54:59','2026-04-29 18:34:43'),('EMP003','Carol Software','carol.software@mss.ac.za','$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi','tla','active',16,'2026-04-23 14:54:59','2026-04-29 18:34:35'),('MGR001','Eve Manager','eve.manager@mss.ac.za','$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi','mss_manager','active',NULL,'2026-04-23 14:54:59','2026-04-25 16:11:41');
/*!40000 ALTER TABLE `user` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-08-20 18:56:48
