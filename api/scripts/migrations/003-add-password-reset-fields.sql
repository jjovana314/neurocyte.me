ALTER TABLE `user`
  ADD COLUMN `resetPasswordToken` varchar(255) NULL DEFAULT NULL,
  ADD COLUMN `resetPasswordExpires` bigint NULL DEFAULT NULL;
