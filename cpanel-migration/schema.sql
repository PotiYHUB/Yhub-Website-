-- ====================================================================
-- Database Schema for Poti Youth Hub (cPanel MySQL / phpMyAdmin)
-- Database: potihub_db
-- ====================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- --------------------------------------------------------------------
-- 1. Table: rooms
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `rooms` (
  `id` VARCHAR(50) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `capacity` INT NOT NULL DEFAULT 0,
  `hourlyPrice` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `dailyPrice` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `minHours` INT NOT NULL DEFAULT 1,
  `images` TEXT NOT NULL, -- JSON array of image URLs
  `description` TEXT NULL,
  `isAvailable` TINYINT(1) NOT NULL DEFAULT 1,
  `order` INT NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------------------
-- 2. Table: custom_questions
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `custom_questions` (
  `id` VARCHAR(50) NOT NULL,
  `roomId` VARCHAR(50) NOT NULL,
  `questionText` VARCHAR(255) NOT NULL,
  `questionType` VARCHAR(50) NOT NULL, -- 'text' | 'select' | 'checkbox'
  `isRequired` TINYINT(1) NOT NULL DEFAULT 0,
  `options` TEXT NULL, -- JSON array of options if type is 'select'
  `order` INT NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`roomId`) REFERENCES `rooms`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------------------
-- 3. Table: bookings
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `bookings` (
  `id` VARCHAR(50) NOT NULL,
  `roomId` VARCHAR(50) NOT NULL,
  `roomName` VARCHAR(255) NOT NULL,
  `userName` VARCHAR(255) NOT NULL,
  `userEmail` VARCHAR(255) NOT NULL,
  `userPhone` VARCHAR(50) NOT NULL,
  `userOrganization` VARCHAR(255) NULL,
  `startTime` DATETIME NOT NULL,
  `endTime` DATETIME NOT NULL,
  `status` VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending' | 'approved' | 'rejected'
  `notes` TEXT NULL,
  `answers` TEXT NULL, -- JSON string representing custom question answers
  `isSchoolWaiver` TINYINT(1) NOT NULL DEFAULT 0,
  `price` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `discountApplied` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `basePrice` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_booking_dates` (`startTime`, `endTime`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------------------
-- 4. Table: hub_items (News & Events)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `hub_items` (
  `id` VARCHAR(50) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `content` TEXT NOT NULL,
  `excerpt` TEXT NULL,
  `category` VARCHAR(100) NOT NULL,
  `date` VARCHAR(100) NOT NULL,
  `readTime` VARCHAR(50) NOT NULL,
  `author` VARCHAR(100) NOT NULL,
  `imageUrl` TEXT NOT NULL,
  `tags` TEXT NULL, -- JSON array of tags
  `isPublished` TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------------------
-- 5. Table: media_items (Gallery)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `media_items` (
  `id` VARCHAR(50) NOT NULL,
  `url` TEXT NOT NULL,
  `title` VARCHAR(255) NULL,
  `description` TEXT NULL,
  `category` VARCHAR(100) NULL,
  `timestamp` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------------------
-- 6. Table: settings
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `settings` (
  `setting_key` VARCHAR(100) NOT NULL,
  `setting_value` LONGTEXT NOT NULL,
  PRIMARY KEY (`setting_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------------------
-- 7. Table: admin_users (For Custom cPanel MySQL Authentication)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `admin_users` (
  `username` VARCHAR(100) NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed Default Admin Account (temporary plain text seed instructions or hash)
-- By default, username: admin, password: default_secure_password (change this!)
-- Default hash corresponds to: PotiHubAdmin2026!
INSERT INTO `admin_users` (`username`, `password_hash`, `email`)
VALUES ('admin', '$2y$10$q26xG16u6Wre0kG8CqZqeu78v.P.6yE6mGqB0m8vY0C5rT9V9m5Yq', 'yhub.poti@gmail.com')
ON DUPLICATE KEY UPDATE `email` = VALUES(`email`);

SET FOREIGN_KEY_CHECKS = 1;
