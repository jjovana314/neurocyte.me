CREATE TABLE IF NOT EXISTS  `migraine_log` (
  `id` int NOT NULL AUTO_INCREMENT,
  `patientId` int NOT NULL,
  `occurredAt` datetime NOT NULL,
  `durationMinutes` int DEFAULT NULL,
  `painSeverity` int NOT NULL,
  `auraPresent` tinyint NOT NULL DEFAULT 0,
  `triggers` text,
  `symptoms` text,
  `medicationTaken` varchar(255) DEFAULT NULL,
  `notes` text,
  `recordedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  KEY `FK_migraine_log_patientId` (`patientId`),
  CONSTRAINT `FK_migraine_log_patientId` FOREIGN KEY (`patientId`) REFERENCES `patient` (`id`) ON DELETE CASCADE,
  CONSTRAINT `CHK_migraine_log_painSeverity` CHECK (`painSeverity` BETWEEN 1 AND 10)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
