-- Baseline schema for the core tables (role, action, user, patient,
-- patient_history, family_history) that predate this migration system --
-- every other file here only ever ALTERs them or adds a new table on top.
-- Named to sort first and uses `IF NOT EXISTS`, so it's a no-op against any
-- database that already has them (i.e. every existing dev/prod database)
-- and only actually creates anything on a brand new one.
CREATE TABLE IF NOT EXISTS `role` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `action` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `roleName` varchar(255) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `user` (
  `id` int NOT NULL AUTO_INCREMENT,
  `email` varchar(255) NOT NULL,
  `firstName` varchar(255) NOT NULL,
  `lastName` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `roleId` int NOT NULL,
  `deactivationToken` varchar(255) DEFAULT NULL,
  `resetPasswordToken` varchar(255) DEFAULT NULL,
  `resetPasswordExpires` bigint DEFAULT NULL;
  PRIMARY KEY (`id`),
  UNIQUE KEY `UQ_user_email` (`email`),
  KEY `FK_user_roleId` (`roleId`),
  CONSTRAINT `FK_user_roleId` FOREIGN KEY (`roleId`) REFERENCES `role` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `patient` (
  `id` int NOT NULL AUTO_INCREMENT,
  `doctorId` int NOT NULL,
  `name` varchar(255) DEFAULT NULL,
  `dateOfBirth` datetime DEFAULT NULL,
  `gender` varchar(255) DEFAULT NULL,
  `phone` varchar(255) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `notes` varchar(255) DEFAULT NULL,
  `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `FK_patient_doctorId` (`doctorId`),
  CONSTRAINT `FK_patient_doctorId` FOREIGN KEY (`doctorId`) REFERENCES `user` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `patient_history` (
  `id` int NOT NULL AUTO_INCREMENT,
  `patientId` int NOT NULL,
  `disorder` varchar(255) NOT NULL,
  `description` text,
  `diagnosisDate` varchar(255) DEFAULT NULL,
  `severity` varchar(255) DEFAULT NULL,
  `medications` varchar(255) DEFAULT NULL,
  `recordedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  KEY `FK_patient_history_patientId` (`patientId`),
  CONSTRAINT `FK_patient_history_patientId` FOREIGN KEY (`patientId`) REFERENCES `patient` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `family_history` (
  `id` int NOT NULL AUTO_INCREMENT,
  `patientId` int NOT NULL,
  `diseaseType` enum('Alzheimer','Parkinson','Stroke','Epilepsy','Brain Tumor','Multiple Sclerosis') NOT NULL,
  `relation` varchar(255) NOT NULL,
  `severity` varchar(255) DEFAULT NULL,
  `notes` text,
  `recordedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  KEY `FK_family_history_patientId` (`patientId`),
  CONSTRAINT `FK_family_history_patientId` FOREIGN KEY (`patientId`) REFERENCES `patient` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
