CREATE TABLE IF NOT EXISTS `tourette_syndrome` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `patientId` INT NOT NULL,
  `tycType` VARCHAR(255) NOT NULL,
  `recordedAt` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `severityScale` INT NOT NULL,
  `triggers` JSON NULL,
  `premonitoryUrgeLevel` INT NOT NULL,
  `notes` TEXT NULL,
  `medicationTaken` VARCHAR(255) NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `FK_tourette_syndrom_patient` 
    FOREIGN KEY (`patientId`) 
    REFERENCES `patient` (`id`) 
    ON DELETE CASCADE 
    ON UPDATE CASCADE
) ENGINE=InnoDB;