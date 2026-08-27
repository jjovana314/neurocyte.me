CREATE TABLE `seizure_log` (
  `id` int NOT NULL AUTO_INCREMENT,
  `patientId` int NOT NULL,
  `onsetVector` enum('FOCAL_AWARE','FOCAL_IMPAIRED_AWARENESS','GENERALIZED') NOT NULL,
  `motorFeatures` set('TONIC','CLONIC','ATONIC','AUTOMATISMS') DEFAULT NULL,
  `ictusStart` datetime NOT NULL,
  `ictusEnd` datetime NOT NULL,
  `ictusDurationSeconds` int NOT NULL,
  `postictalDurationMinutes` int DEFAULT NULL,
  `triggers` set('SLEEP_DEPRIVATION','MISSED_DOSE','HIGH_STRESS','ILLNESS') DEFAULT NULL,
  `notes` text,
  `recordedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  KEY `FK_seizure_log_patientId` (`patientId`),
  CONSTRAINT `FK_seizure_log_patientId` FOREIGN KEY (`patientId`) REFERENCES `patient` (`id`) ON DELETE CASCADE,
  CONSTRAINT `CHK_seizure_log_ictusEnd` CHECK (`ictusEnd` >= `ictusStart`),
  CONSTRAINT `CHK_seizure_log_ictusDurationSeconds` CHECK (`ictusDurationSeconds` >= 0),
  CONSTRAINT `CHK_seizure_log_postictalDurationMinutes` CHECK (`postictalDurationMinutes` IS NULL OR `postictalDurationMinutes` >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
