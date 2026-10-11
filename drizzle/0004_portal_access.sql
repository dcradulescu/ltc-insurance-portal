-- Additive access-control migration. No legacy records are assigned automatically.
CREATE TABLE `portalAccounts` (
 `userId` int NOT NULL PRIMARY KEY,
 `email` varchar(320) NOT NULL UNIQUE,
 `passwordHash` varchar(255) NOT NULL,
 `active` boolean NOT NULL DEFAULT true,
 `failedAttempts` int NOT NULL DEFAULT 0,
 `lockedUntil` timestamp NULL,
 CONSTRAINT `portalAccounts_user_fk` FOREIGN KEY (`userId`) REFERENCES `users` (`id`)
);
--> statement-breakpoint
CREATE TABLE `portalSessions` (
 `tokenHash` varchar(64) NOT NULL PRIMARY KEY,
 `userId` int NOT NULL,
 `expiresAt` timestamp NOT NULL,
 INDEX `idx_portal_sessions_user` (`userId`),
 CONSTRAINT `portalSessions_user_fk` FOREIGN KEY (`userId`) REFERENCES `users` (`id`)
);
--> statement-breakpoint
CREATE TABLE `portalFiles` (
 `fileKey` varchar(512) NOT NULL PRIMARY KEY,
 `userId` int NOT NULL,
 `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT `portalFiles_user_fk` FOREIGN KEY (`userId`) REFERENCES `users` (`id`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `saveLinks` (
 `id` int NOT NULL AUTO_INCREMENT PRIMARY KEY,
 `token` varchar(64) NOT NULL UNIQUE,
 `email` varchar(320) NOT NULL,
 `insuredName` varchar(255),
 `formData` json NOT NULL,
 `currentStep` int NOT NULL DEFAULT 0,
 `used` boolean NOT NULL DEFAULT false,
 `expiresAt` timestamp NOT NULL,
 `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
ALTER TABLE `saveLinks` ADD `userId` int NULL;
