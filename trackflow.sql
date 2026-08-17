-- MySQL dump 10.13  Distrib 8.0.41, for Win64 (x86_64)
--
-- Host: localhost    Database: trackflow
-- ------------------------------------------------------
-- Server version	8.0.41

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
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
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `attachment` (
  `attachment_id` int NOT NULL AUTO_INCREMENT,
  `ticket_id` int NOT NULL,
  `file_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_path` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_size` int unsigned DEFAULT NULL,
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
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `category` (
  `category_id` int NOT NULL AUTO_INCREMENT,
  `category_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `department_id` int DEFAULT NULL,
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
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `department` (
  `department_id` int NOT NULL AUTO_INCREMENT,
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
INSERT INTO `department` VALUES (1,'Physical','active','2026-04-23 14:40:56'),(2,'Hardware','active','2026-04-23 14:40:56'),(3,'Software','active','2026-04-23 14:40:56'),(7,'Business Continuity & Disaster Recovery','active','2026-04-29 11:28:19'),(8,'Welcoming Team','active','2026-04-29 11:28:19'),(9,'Collection Center','active','2026-04-29 11:28:19'),(10,'Scientific Research Support','active','2026-04-29 11:28:19'),(11,'Building Management','active','2026-04-29 11:28:19'),(12,'Multimedia','active','2026-04-29 11:28:19'),(13,'Business Solutions Research & Development','active','2026-04-29 11:28:19'),(14,'Interest Group Research & Development','active','2026-04-29 11:28:19'),(15,'Museum','active','2026-04-29 11:28:19'),(16,'Fabrication Lab','active','2026-04-29 11:28:19'),(17,'Competitive Interest Groups','active','2026-04-29 11:28:19'),(18,'Special Event Support','active','2026-04-29 11:28:19');
/*!40000 ALTER TABLE `department` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `escalation_log`
--

DROP TABLE IF EXISTS `escalation_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `escalation_log` (
  `escalation_id` int NOT NULL AUTO_INCREMENT,
  `ticket_id` int NOT NULL,
  `escalated_by` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `escalated_to` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `reason` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `escalated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`escalation_id`),
  KEY `fk_escalation_ticket` (`ticket_id`),
  KEY `fk_escalation_by` (`escalated_by`),
  KEY `fk_escalation_to` (`escalated_to`),
  CONSTRAINT `fk_escalation_by` FOREIGN KEY (`escalated_by`) REFERENCES `user` (`user_id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_escalation_ticket` FOREIGN KEY (`ticket_id`) REFERENCES `ticket` (`ticket_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_escalation_to` FOREIGN KEY (`escalated_to`) REFERENCES `user` (`user_id`) ON DELETE RESTRICT ON UPDATE CASCADE
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
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `feedback` (
  `feedback_id` int NOT NULL AUTO_INCREMENT,
  `ticket_id` int NOT NULL,
  `user_id` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `rating` tinyint unsigned NOT NULL,
  `comment` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `submitted_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`feedback_id`),
  UNIQUE KEY `uq_feedback_ticket` (`ticket_id`),
  KEY `fk_feedback_user` (`user_id`),
  CONSTRAINT `fk_feedback_ticket` FOREIGN KEY (`ticket_id`) REFERENCES `ticket` (`ticket_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_feedback_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`user_id`) ON DELETE RESTRICT ON UPDATE CASCADE
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
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notification` (
  `notification_id` int NOT NULL AUTO_INCREMENT,
  `user_id` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `ticket_id` int DEFAULT NULL,
  `message` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_read` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`notification_id`),
  KEY `fk_notification_user` (`user_id`),
  KEY `fk_notification_ticket` (`ticket_id`),
  CONSTRAINT `fk_notification_ticket` FOREIGN KEY (`ticket_id`) REFERENCES `ticket` (`ticket_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_notification_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notification`
--

LOCK TABLES `notification` WRITE;
/*!40000 ALTER TABLE `notification` DISABLE KEYS */;
INSERT INTO `notification` VALUES (1,'A00873',1,'Your ticket #1 has been submitted successfully. Reference: TKT-0001.',0,'2026-04-23 14:55:00'),(2,'A00874',2,'Your ticket #2 has been submitted successfully. Reference: TKT-0002.',0,'2026-04-23 14:55:00'),(3,'A00873',3,'Your ticket #3 has been submitted successfully. Reference: TKT-0003.',0,'2026-04-23 14:55:00'),(4,'A00874',4,'Your ticket #4 has been submitted successfully. Reference: TKT-0004.',1,'2026-04-23 14:55:00'),(5,'A00873',5,'Your ticket #5 has been submitted successfully. Reference: TKT-0005.',0,'2026-04-23 14:55:00'),(6,'A00874',6,'Your ticket #6 has been submitted successfully. Reference: TKT-0006.',1,'2026-04-23 14:55:00'),(7,'A00874',2,'Your ticket #2 status has been updated to: In Progress.',0,'2026-04-23 14:55:00'),(8,'A00874',4,'Your ticket #4 status has been updated to: In Progress.',1,'2026-04-23 14:55:00'),(9,'A00874',4,'Your ticket #4 status has been updated to: Pending. Awaiting stock delivery.',0,'2026-04-23 14:55:00'),(10,'A00874',6,'Your ticket #6 has been resolved. Please review the resolution note.',1,'2026-04-23 14:55:00'),(11,'ADM001',3,'URGENT: Ticket #3 has breached its SLA deadline and requires immediate attention.',0,'2026-04-23 14:55:00');
/*!40000 ALTER TABLE `notification` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ticket`
--

DROP TABLE IF EXISTS `ticket`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ticket` (
  `ticket_id` int NOT NULL AUTO_INCREMENT,
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
  `category_id` int DEFAULT NULL,
  `department_id` int DEFAULT NULL,
  `resolved_at` datetime DEFAULT NULL,
  PRIMARY KEY (`ticket_id`),
  KEY `fk_ticket_user` (`user_id`),
  KEY `fk_ticket_assigned_user` (`assigned_user_id`),
  KEY `fk_ticket_category` (`category_id`),
  KEY `fk_ticket_department` (`department_id`),
  CONSTRAINT `fk_ticket_assigned_user` FOREIGN KEY (`assigned_user_id`) REFERENCES `user` (`user_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_ticket_category` FOREIGN KEY (`category_id`) REFERENCES `category` (`category_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_ticket_department` FOREIGN KEY (`department_id`) REFERENCES `department` (`department_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_ticket_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`user_id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=44 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ticket`
--

LOCK TABLES `ticket` WRITE;
/*!40000 ALTER TABLE `ticket` DISABLE KEYS */;
INSERT INTO `ticket` VALUES (1,'PA system feedback on channel 2 during Graduation rehearsal','Loud feedback on channel 2 of the main PA system could not be resolved during rehearsal. Audio tech suspects a grounding issue. Ceremony is tomorrow at 09:00.','open',1,NULL,NULL,'2026-04-29 17:10:28','2026-04-29 17:10:28','A00873','EMP001',4,18,NULL),(2,'Wireless microphone battery packs missing before evening event','Four of the six wireless microphone battery packs are unaccounted for ahead of tonight\'s setup. Searching equipment room and liaising with last team to use them.','in_progress',0,NULL,NULL,'2026-04-29 14:10:28','2026-04-29 18:10:28','A00873','EMP001',4,18,NULL),(3,'Event QR scanner not holding charge during check-in','Handheld QR scanner drops to 0% within 10 minutes despite showing full charge. Waiting for replacement unit to arrive from stores before next event.','struggling',0,NULL,NULL,'2026-04-28 19:10:28','2026-08-15 16:34:57','A00873','EMP001',4,18,NULL),(4,'Stage lighting control board unresponsive before conference','DMX lighting controller froze during conference setup. Could not trigger any scenes manually.','resolved',0,NULL,'Power-cycled the DMX controller and reinstalled the control software. Ran a full scene test — all lights confirmed working 45 minutes before the event.','2026-04-26 19:10:28','2026-04-26 19:10:28','A00873','EMP001',4,18,'2026-04-27 23:10:28'),(5,'Venue Wi-Fi not broadcasting in main hall during Saturday event','Guest Wi-Fi SSID not visible in the main hall. Guests unable to connect for event app check-in.','resolved',0,NULL,'Coordinated with building management to identify the affected access point in the ceiling. Reset it remotely via the Ubiquiti controller. SSID restored within 20 minutes.','2026-04-24 19:10:28','2026-04-24 19:10:28','A00873','EMP001',4,18,'2026-04-25 21:55:28'),(6,'Projector remote missing in Auditorium B','Projector remote for Auditorium B is missing. Cannot change inputs or power off without physically reaching the ceiling-mounted unit.','struggling',0,NULL,NULL,'2026-04-27 19:10:28','2026-08-15 16:34:57','A00873','EMP001',4,18,NULL),(7,'Centrifuge error E-04 on startup in Lab 3.12','The Eppendorf centrifuge shows error E-04 every startup. Two researchers have time-sensitive biological samples waiting and cannot proceed.','open',1,NULL,NULL,'2026-04-29 15:10:28','2026-04-29 15:10:28','A00873','EMP002',4,10,NULL),(8,'Fume hood airflow alarm active in Chemistry Lab 3.08','Fume hood 2 has been alarming since morning. Sash cannot be safely lowered past 30cm. All volatile reagent experiments paused.','in_progress',0,NULL,NULL,'2026-04-28 19:10:28','2026-04-29 17:10:28','A00873','EMP002',4,10,NULL),(9,'Microscope motorised stage not responding on Olympus BX53','XY stage does not respond to joystick input. Manual movement works but automated tile imaging for the cell study is completely blocked.','in_progress',0,NULL,NULL,'2026-04-27 19:10:28','2026-04-29 14:10:28','A00873','EMP002',4,10,NULL),(10,'Lab management system login failing for 3 new research assistants','Three new RAs cannot authenticate. Accounts created last week. Internal logins work fine. OAuth callback may be misconfigured.','struggling',0,NULL,NULL,'2026-04-26 19:10:28','2026-08-15 16:34:57','A00873','EMP002',4,10,NULL),(11,'Gas cylinder pressure alarm triggered in Lab 2.04','CO2 cylinder pressure alarm triggered during an active experiment. Lab evacuated as precaution.','resolved',0,NULL,'Inspected the regulator and found a faulty pressure valve. Replaced the regulator from stores stock. Pressure confirmed stable. Lab re-opened after safety check.','2026-04-23 19:10:28','2026-04-23 19:10:28','A00873','EMP002',4,10,'2026-04-25 00:10:28'),(12,'Autoclave not reaching target sterilisation temperature','The bench-top autoclave in Lab 3.05 is only reaching 118°C instead of the required 121°C. All sterilisation runs since Monday are potentially invalid.','resolved',0,NULL,'Found the door gasket had degraded and was allowing pressure to bleed. Replaced gasket with spare from the maintenance kit. Ran two validation cycles — both reached 121°C.','2026-04-21 19:10:28','2026-04-21 19:10:28','A00873','EMP002',4,10,'2026-04-23 02:10:28'),(13,'Filament jam on Prusa MK4 bench 2 mid-print','Prusa MK4 jammed halfway through a 6-hour print. Extruder making grinding noise. Student submission due Friday.','open',0,NULL,NULL,'2026-04-29 16:10:28','2026-04-29 16:10:28','A00873','EMP003',4,16,NULL),(14,'Laser cutter exhaust fan stopped during live session','Exhaust fan on the Epilog Zing stopped mid-session. Lab cleared as precaution. Cannot be used until fan inspected.','in_progress',1,NULL,NULL,'2026-04-28 19:10:28','2026-04-29 16:10:28','A00873','EMP003',4,16,NULL),(15,'Vinyl cutter blade not cutting through 120gsm+ stock','Roland vinyl cutter leaves partial cuts on thicker stock. Replacement blades ordered. Waiting for delivery.','struggling',0,NULL,NULL,'2026-04-27 19:10:28','2026-08-15 16:34:57','A00873','EMP003',4,16,NULL),(16,'Soldering station 3 temperature inconsistent','Station 3 burns components at temperatures far higher than the display shows. Students avoiding it and queuing for other stations.','resolved',0,NULL,'Used a calibrated reference probe to measure actual tip temperature versus display. Found a 28°C offset. Recalibrated via the station\'s internal calibration menu. Verified accurate across three set points.','2026-04-25 19:10:28','2026-04-25 19:10:28','A00873','EMP003',4,16,'2026-04-25 22:10:28'),(17,'3D printer bed levelling failed on Bambu X1','Bambu X1 auto-bed-levelling failing, causing first-layer adhesion issues on every print.','resolved',0,NULL,'Reflashed firmware to latest stable version and re-ran the full calibration sequence including vibration compensation. First layer adhesion confirmed on three consecutive test prints.','2026-04-22 19:10:28','2026-04-22 19:10:28','A00873','EMP003',4,16,'2026-04-24 01:10:28'),(18,'Resin printer FEP film cloudy — prints failing','The FEP film on the Elegoo Saturn is heavily clouded from extended use. Prints are delaminating mid-print.','resolved',0,NULL,'Replaced the FEP film with new stock from supplies. Re-levelled the build plate. Ran three test prints at different exposure settings. All prints successful.','2026-04-19 19:10:28','2026-04-19 19:10:28','A00873','EMP003',4,16,'2026-04-20 23:10:28'),(19,'CRM system response time degraded after server migration','CRM page loads taking 8-12 seconds since last week\'s migration. Affects all 14 users on the sales floor.','open',0,NULL,NULL,'2026-04-29 13:10:28','2026-04-29 13:10:28','A00873','A1235',4,13,NULL),(20,'Monthly reporting Excel macro broken after Office 365 update','Finance macro throws #REF errors across 6 sheets after the O365 update. Month-end reporting due Friday.','in_progress',0,NULL,NULL,'2026-04-27 19:10:28','2026-04-29 15:10:28','A00873','A1235',4,13,NULL),(21,'VPN dropping every 15 minutes for remote staff','Eight remote employees report VPN disconnecting every 10-15 minutes since Tuesday. Forces full reconnection during meetings.','resolved',0,NULL,'Identified an MTU mismatch introduced by a router config change during maintenance. Updated MTU on the VPN gateway from 1500 to 1400. All 8 users confirmed stable connections.','2026-04-24 19:10:28','2026-04-24 19:10:28','A00873','A1235',4,13,'2026-04-26 03:10:28'),(22,'Email distribution list dropping external recipients silently','The dept@mss.ac.za mailing list silently dropping emails to gmail and outlook addresses. Internal delivery works fine.','resolved',0,NULL,'Found the SPF record for the domain was missing the mail relay server. Added the correct include directive to DNS. Propagated within 30 minutes. Sent test emails to 5 external addresses — all delivered.','2026-04-20 19:10:28','2026-04-20 19:10:28','A00873','A1235',4,13,'2026-04-21 22:10:28'),(23,'SharePoint permissions broken for project team folder','Project team SharePoint folder returning access denied for 6 members since yesterday. Permissions appear correct in admin portal.','open',0,NULL,'nope','2026-04-29 14:10:28','2026-08-17 19:50:42','A00873','ATLA',4,13,NULL),(24,'Power BI dashboard not refreshing from live data source','Executive Power BI dashboard stopped auto-refreshing at midnight. Manual refresh works but scheduled refresh fails with gateway error.','resolved',0,NULL,NULL,'2026-04-26 19:10:28','2026-04-29 19:22:15','A00873','ATLA',4,13,'2026-04-29 21:22:15'),(25,'Shared NAS drive inaccessible from Lab 2.06 workstations','NAS at \\\\nas01\\research not accessible from any workstation in Lab 2.06 since Monday. Other labs unaffected.','resolved',0,NULL,'Traced to a VLAN misconfiguration on port 14 of the Lab 2.06 switch following a patch panel change. Corrected the VLAN tag. All 8 workstations confirmed access restored.','2026-04-23 19:10:28','2026-04-23 19:10:28','A00873','ATLA',4,13,'2026-04-25 00:10:28'),(26,'Barcode scanner cannot read new QR inventory labels','Zebra handheld scanner at the collection counter fails on new QR-style labels since Monday. All check-in and check-out stalled. Staff logging manually.','resolved',0,NULL,NULL,'2026-04-29 12:10:28','2026-04-29 19:14:26','A00873','2695831',4,9,'2026-04-29 21:14:26'),(27,'Inventory system stock count mismatch for SKU-2847','System shows 12 units but physical count is 9. Discrepancy needs investigation before next order placed.','resolved',0,NULL,NULL,'2026-04-27 19:10:28','2026-04-29 19:14:02','A00873','2695831',4,9,'2026-04-29 21:14:02'),(28,'Shelving unit collapsed in storage bay 4','Heavy-duty shelving partially collapsed. Items from two shelves on the floor. Area cordoned off. Waiting for structural assessment.','open',1,NULL,NULL,'2026-04-28 19:10:28','2026-05-08 19:02:42','A00873','2695831',4,9,NULL),(29,'Receipt printer not connecting to POS terminal at counter 2','Epson receipt printer at counter 2 showing offline. Queue of transactions backing up.','resolved',0,NULL,'Reseated the USB cable between the printer and terminal. Updated the printer driver from Epson\'s site. Printed 5 test receipts — all confirmed working.','2026-04-25 19:10:28','2026-04-25 19:10:28','A00873','2695831',4,9,'2026-04-25 21:55:28'),(30,'Collection database slow during peak hours 10:00-12:00','Database queries timing out between 10:00 and 12:00. Staff unable to process returns during the busiest window.','resolved',0,NULL,'Identified a missing index on the transaction_date column using EXPLAIN. Added the index during off-peak hours. Query time dropped from 8 seconds to under 200ms. No further timeouts reported.','2026-04-21 19:10:28','2026-04-21 19:10:28','A00873','2695831',4,9,'2026-04-22 23:10:28'),(31,'Label printer ribbon jammed mid-batch','Zebra label printer ribbon jammed during a 200-label batch print run for new stock. First 80 labels printed, remainder lost.','resolved',0,NULL,'Cleared the ribbon jam by manually advancing and reseating the ribbon roll. Recalibrated label sensor. Re-ran remaining 120 labels successfully.','2026-04-18 19:10:28','2026-04-18 19:10:28','A00873','2695831',4,9,'2026-04-19 21:40:28'),(32,'Backup job failed for 3 consecutive nights','Automated nightly backup for the main file server failed 3 nights in a row with exit code 1. No alerts fired. Last clean restore point is 72 hours old.','open',1,NULL,NULL,'2026-04-29 11:10:28','2026-04-29 11:10:28','A00873','A12345',4,7,NULL),(33,'UPS unit in server room B showing battery fault','APC UPS showing red battery fault light. Runtime estimate dropped to under 2 minutes. A power blip could take down critical systems.','in_progress',1,NULL,NULL,'2026-04-28 19:10:28','2026-04-29 17:10:28','A00873','A12345',4,7,NULL),(34,'Failover to secondary site did not trigger during DR drill','Automatic failover did not trigger within the 4-minute SLA window during scheduled drill. Manual intervention required. Root cause unknown.','struggling',0,NULL,NULL,'2026-04-26 19:10:28','2026-08-15 16:34:57','A00873','A12345',4,7,NULL),(35,'Primary DNS server not responding — cascading service failures','Primary DNS server went unresponsive causing email, intranet, and authentication to fail for 40 minutes before secondary DNS took over.','resolved',0,NULL,'Identified a memory leak in BIND caused by a zone transfer loop. Restarted the DNS service and patched the zone configuration to prevent the loop. Secondary DNS promoted temporarily. Primary restored after validation.','2026-04-24 19:10:28','2026-04-24 19:10:28','A00873','A12345',4,7,'2026-04-26 01:10:28'),(36,'SSL certificate expired on staff portal — HTTPS broken','The SSL certificate on the staff intranet portal expired at midnight causing all HTTPS traffic to throw security warnings. Staff unable to access the portal.','resolved',0,NULL,'Renewed the certificate via the CA portal and deployed it to the Nginx config. Reloaded Nginx. All HTTPS connections restored. Set up a 30-day expiry reminder in the monitoring system.','2026-04-22 19:10:28','2026-04-22 19:10:28','A00873','A12345',4,7,'2026-04-22 22:10:28'),(37,'Ransomware alert triggered on workstation BC-09','Endpoint protection flagged suspicious file encryption activity on workstation BC-09 at 14:22. Machine isolated from network automatically.','resolved',0,NULL,'Confirmed false positive — a legitimate bulk file compression job triggered the heuristic. Reviewed process logs and whitelisted the compression tool with the security team. Workstation reconnected to network after clean scan.','2026-04-17 19:10:28','2026-04-17 19:10:28','A00873','A12345',4,7,'2026-04-19 05:10:28'),(38,'screen not turning on','the screen on my workstation does not turn on now','open',0,NULL,NULL,'2026-04-29 19:23:12','2026-04-29 19:23:12','Atest',NULL,3,3,NULL),(39,'hardware','hardware','open',0,NULL,NULL,'2026-08-13 22:25:47','2026-08-13 22:25:47','Atest',NULL,2,2,NULL),(40,'software','software','open',0,NULL,NULL,'2026-08-13 22:53:02','2026-08-13 22:53:02','Atest',NULL,3,9,NULL),(41,'physical','physical','in_progress',0,NULL,'done','2026-08-13 22:55:44','2026-08-17 19:59:04','Atest','ATLA',1,13,NULL),(42,'ss','ss','open',0,NULL,'done','2026-08-15 17:21:34','2026-08-17 19:51:36','Atest','ATLA',1,13,NULL),(43,'checking prototype','checking if the thing here is correct','open',0,NULL,NULL,'2026-08-17 20:06:38','2026-08-17 20:06:38','Atest',NULL,1,13,NULL);
/*!40000 ALTER TABLE `ticket` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ticket_status_log`
--

DROP TABLE IF EXISTS `ticket_status_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ticket_status_log` (
  `log_id` int NOT NULL AUTO_INCREMENT,
  `ticket_id` int NOT NULL,
  `old_status` enum('open','in_progress','struggling','resolved','closed') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `new_status` enum('open','in_progress','struggling','resolved','closed') COLLATE utf8mb4_unicode_ci NOT NULL,
  `changed_by` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `note` text COLLATE utf8mb4_unicode_ci,
  `changed_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`log_id`),
  KEY `fk_log_ticket` (`ticket_id`),
  KEY `fk_log_user` (`changed_by`),
  CONSTRAINT `fk_log_ticket` FOREIGN KEY (`ticket_id`) REFERENCES `ticket` (`ticket_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_log_user` FOREIGN KEY (`changed_by`) REFERENCES `user` (`user_id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=24 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ticket_status_log`
--

LOCK TABLES `ticket_status_log` WRITE;
/*!40000 ALTER TABLE `ticket_status_log` DISABLE KEYS */;
INSERT INTO `ticket_status_log` VALUES (1,41,'open','in_progress','ATLA',NULL,'2026-08-15 16:48:39'),(2,41,'in_progress','open','ATLA',NULL,'2026-08-15 16:48:42'),(3,41,'open','resolved','ATLA','doen','2026-08-15 17:14:05'),(4,42,'open','in_progress','ATLA',NULL,'2026-08-15 17:21:58'),(5,42,'in_progress','resolved','ATLA','done','2026-08-15 17:22:06'),(6,41,'resolved','open','ATLA',NULL,'2026-08-15 17:31:23'),(7,42,'resolved','open','ATLA',NULL,'2026-08-15 17:31:26'),(8,41,'open','in_progress','ATLA',NULL,'2026-08-15 17:31:33'),(9,42,'open','in_progress','ATLA',NULL,'2026-08-15 17:31:34'),(10,42,'in_progress','resolved','ATLA','done','2026-08-15 17:31:39'),(11,41,'in_progress','open','ATLA',NULL,'2026-08-15 17:31:45'),(12,41,'open','in_progress','ATLA',NULL,'2026-08-15 17:36:20'),(13,41,'in_progress','open','ATLA',NULL,'2026-08-15 17:36:23'),(14,23,'struggling','in_progress','ATLA',NULL,'2026-08-17 19:49:14'),(15,23,'in_progress','struggling','ATLA','nope','2026-08-17 19:49:19'),(16,23,'struggling','in_progress','ATLA',NULL,'2026-08-17 19:49:20'),(17,23,'in_progress','open','ATLA',NULL,'2026-08-17 19:49:21'),(18,41,'open','in_progress','ATLA',NULL,'2026-08-17 19:49:22'),(19,41,'in_progress','resolved','ATLA','done','2026-08-17 19:49:26'),(20,23,'open','in_progress','ATLA',NULL,'2026-08-17 19:50:35'),(21,23,'in_progress','open','ATLA',NULL,'2026-08-17 19:50:42'),(22,42,'resolved','open','ATLA',NULL,'2026-08-17 19:51:36'),(23,41,'resolved','in_progress','ATLA',NULL,'2026-08-17 19:59:04');
/*!40000 ALTER TABLE `ticket_status_log` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user`
--

DROP TABLE IF EXISTS `user`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user` (
  `user_id` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_password_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_role` enum('end_user','tla','mss_manager','admin') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'end_user',
  `user_status` enum('active','inactive') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `department_id` int DEFAULT NULL,
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
INSERT INTO `user` VALUES ('2695831','Test user','rakhivhanithembu@gmail.com','$2b$10$Z6LmnPB0ff6ztOkJWSc./ePd0Pn1lqiVlRsmMqGjtpV/xm4jRxcPi','tla','active',9,'2026-04-25 16:18:17','2026-04-29 18:33:43'),('A0086767','Thembuluwo Rakhivhani','2695831@students.wits.ac.za','$2b$10$qxekOH5yEHp00AZKy4N8IOd7oiZgkSWLhZk9cD.RrXqKCz2BB71vW','admin','active',NULL,'2026-04-25 13:34:02','2026-04-26 13:56:33'),('A00873','John Student','john.student@wits.ac.za','$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi','end_user','active',NULL,'2026-04-23 14:54:59','2026-04-23 14:54:59'),('A00874','Jane Lecturer','jane.lecturer@wits.ac.za','$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi','end_user','active',NULL,'2026-04-23 14:54:59','2026-04-23 14:54:59'),('A12345','thendo test','ttest@gmail.com','$2b$10$fjh20a6iLEF2JJ0AA2zvzOTJMJC47z7weJWY5UNgl5mkJ5YCCUnEq','tla','active',7,'2026-04-29 18:32:02','2026-04-29 18:32:02'),('A1235','Emihle test','emitest@gmail.com','$2b$10$MAOztfkFlxLm5nF2sRz7seEtFJ8dcCQ9kTheHJ1liT9rw3u382ada','tla','active',13,'2026-04-29 18:32:58','2026-04-29 18:32:58'),('ADM001','Dave Admin','dave.admin@mss.ac.za','$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi','admin','active',NULL,'2026-04-23 14:54:59','2026-04-23 14:54:59'),('AMAN','TEST MANAGER','aman@gmail.com','$2b$10$EH.fFZWm6Q.yZYnI9NuxneybOl0JqWm1GrqcwverZ2m0ZNiMuY3Jq','mss_manager','active',NULL,'2026-04-29 10:16:03','2026-04-29 10:16:48'),('Atest','test user','test@gmail.com','$2b$10$IhTbZMRCI.sRAsMSLkojauWqFzKGAFPHoaT.0leT8G5lquPCcklHa','end_user','active',NULL,'2026-04-29 06:29:48','2026-04-29 06:29:48'),('ATLA','test TLA','atla@gmail.com','$2b$10$RltPYeGSkVz/QzpkrLjUtupTLVPxXFJFzHvtBWJz8kRPo4LlWLS7G','tla','active',13,'2026-04-29 06:32:16','2026-04-29 18:33:34'),('EMP001','Alice Technician','alice.tech@mss.ac.za','$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi','tla','active',18,'2026-04-23 14:54:59','2026-04-29 18:34:47'),('EMP002','Bob Hardware','bob.hardware@mss.ac.za','$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi','tla','active',10,'2026-04-23 14:54:59','2026-04-29 18:34:43'),('EMP003','Carol Software','carol.software@mss.ac.za','$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi','tla','active',16,'2026-04-23 14:54:59','2026-04-29 18:34:35'),('MGR001','Eve Manager','eve.manager@mss.ac.za','$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi','mss_manager','active',NULL,'2026-04-23 14:54:59','2026-04-25 16:11:41');
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

-- Dump completed on 2026-08-17 22:39:33
