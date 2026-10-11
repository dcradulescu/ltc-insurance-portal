CREATE TABLE `chatMessages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`sessionId` varchar(128) NOT NULL,
	`role` varchar(16) NOT NULL,
	`content` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `chatMessages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `documentUploads` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`policyId` int,
	`strategyId` int,
	`taskId` varchar(128),
	`category` varchar(128) NOT NULL,
	`fileName` varchar(512) NOT NULL,
	`fileUrl` text NOT NULL,
	`fileKey` varchar(512) NOT NULL,
	`mimeType` varchar(128),
	`fileSize` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `documentUploads_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `policies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`holderFirstName` varchar(255),
	`holderLastName` varchar(255),
	`holderDateOfBirth` varchar(32),
	`holderRelationship` varchar(128),
	`insuredFullName` varchar(255),
	`insuredDob` varchar(32),
	`insuredEmail` varchar(320),
	`insuredPhone` varchar(32),
	`insuredMailingAddress` text,
	`insuredSsn` varchar(16),
	`insuredMedicareNumber` varchar(64),
	`insuredMedicaidNumber` varchar(64),
	`powerOfAttorneyPresent` varchar(8),
	`insuranceCompany` varchar(255),
	`policyNumber` varchar(128),
	`policyType` varchar(128),
	`policyStatus` varchar(64),
	`effectiveDate` varchar(32),
	`carrierName` varchar(255),
	`carrierAddress1` varchar(255),
	`carrierAddress2` varchar(255),
	`carrierCityStateZip` varchar(255),
	`carrierPhone` varchar(32),
	`carrierFax` varchar(32),
	`claimPreClaimNumber` varchar(128),
	`eliminationPeriod` varchar(128),
	`dailyBenefitAmount` varchar(64),
	`benefitPeriod` varchar(128),
	`dailyMaximum` varchar(64),
	`monthlyMaximum` varchar(64),
	`lifetimeMaximum` varchar(64),
	`inflationProtection` varchar(128),
	`equipmentAllowance` text,
	`homeCareCoverage` varchar(8),
	`facilityCareCoverage` varchar(8),
	`minAdlsRequired` varchar(16),
	`adlLimitations` json,
	`waiverOfPremium` varchar(8),
	`cnaRequired` varchar(8),
	`careNotesRequired` varchar(8),
	`paymentCycle` varchar(128),
	`assignmentOfBenefits` varchar(8),
	`caseManagerName` varchar(255),
	`thirdPartyAssessmentRequired` varchar(8),
	`thirdPartyAssessmentWho` varchar(255),
	`cognitiveImpairmentTrigger` varchar(8),
	`cognitiveImpairment` varchar(8),
	`planOfCareStatus` varchar(128),
	`ltcCoordinatorAssigned` varchar(255),
	`primaryCarePhysician` json,
	`otherProviders` json,
	`facilitiesUsed` json,
	`dischargeDocumentation` varchar(8),
	`currentCareNeeds` text,
	`currentCareReceiving` text,
	`diagnosisOrCondition` text,
	`primaryDiagnosis` varchar(255),
	`priorClaimsFiled` varchar(8),
	`priorClaimsDetails` text,
	`preferredCareType` varchar(128),
	`additionalNotes` text,
	`fillerRelationship` varchar(128),
	`createdAt` timestamp DEFAULT (now()),
	`updatedAt` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `policies_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `portalAccounts` (
	`userId` int NOT NULL,
	`email` varchar(320) NOT NULL,
	`passwordHash` varchar(255) NOT NULL,
	`active` boolean NOT NULL DEFAULT true,
	`failedAttempts` int NOT NULL DEFAULT 0,
	`lockedUntil` timestamp,
	CONSTRAINT `portalAccounts_userId` PRIMARY KEY(`userId`),
	CONSTRAINT `portalAccounts_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `portalFiles` (
	`fileKey` varchar(512) NOT NULL,
	`userId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `portalFiles_fileKey` PRIMARY KEY(`fileKey`)
);
--> statement-breakpoint
CREATE TABLE `portalSessions` (
	`tokenHash` varchar(64) NOT NULL,
	`userId` int NOT NULL,
	`expiresAt` timestamp NOT NULL,
	CONSTRAINT `portalSessions_tokenHash` PRIMARY KEY(`tokenHash`)
);
--> statement-breakpoint
CREATE TABLE `ragDocumentChunks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`documentId` int NOT NULL,
	`chunkIndex` int NOT NULL,
	`content` text NOT NULL,
	`embedding` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ragDocumentChunks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ragDocuments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`content` text NOT NULL,
	`source` varchar(512),
	`category` varchar(128),
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ragDocuments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `saveLinks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`token` varchar(64) NOT NULL,
	`email` varchar(320) NOT NULL,
	`insuredName` varchar(255),
	`formData` json NOT NULL,
	`currentStep` int NOT NULL DEFAULT 0,
	`used` boolean NOT NULL DEFAULT false,
	`expiresAt` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `saveLinks_id` PRIMARY KEY(`id`),
	CONSTRAINT `saveLinks_token_unique` UNIQUE(`token`)
);
--> statement-breakpoint
CREATE TABLE `strategies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`policyId` int NOT NULL,
	`currentStage` int NOT NULL DEFAULT 1,
	`strategyContent` text,
	`strategyHtml` text,
	`stage1Tasks` json,
	`stage2Tasks` json,
	`stage3Tasks` json,
	`checklistItems` json,
	`claimStatus` varchar(32) DEFAULT 'not_started',
	`scheduleStartDate` varchar(10),
	`careScenario` json,
	`generatedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp DEFAULT (now()),
	`updatedAt` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `strategies_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `taskCompletions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`strategyId` int NOT NULL,
	`taskId` varchar(255) NOT NULL,
	`taskTitle` varchar(512),
	`stage` int NOT NULL,
	`completed` boolean NOT NULL DEFAULT false,
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `taskCompletions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `userContacts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`email` varchar(320) NOT NULL,
	`relationship` varchar(128),
	`receiveCcEmails` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `userContacts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`openId` varchar(64) NOT NULL,
	`name` text,
	`email` varchar(320),
	`loginMethod` varchar(64),
	`role` enum('user','admin') NOT NULL DEFAULT 'user',
	`notificationPreferences` json,
	`createdAt` timestamp DEFAULT (now()),
	`updatedAt` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastSignedIn` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_openId_unique` UNIQUE(`openId`)
);
--> statement-breakpoint
ALTER TABLE `portalAccounts` ADD CONSTRAINT `portalAccounts_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `portalFiles` ADD CONSTRAINT `portalFiles_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `portalSessions` ADD CONSTRAINT `portalSessions_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `idx_policies_user_id` ON `policies` (`userId`);--> statement-breakpoint
CREATE INDEX `idx_policies_created_at` ON `policies` (`createdAt`);--> statement-breakpoint
CREATE INDEX `idx_portal_sessions_user` ON `portalSessions` (`userId`);--> statement-breakpoint
CREATE INDEX `idx_save_links_token` ON `saveLinks` (`token`);--> statement-breakpoint
CREATE INDEX `idx_task_completions_strategy_id` ON `taskCompletions` (`strategyId`);--> statement-breakpoint
CREATE INDEX `idx_task_completions_user_id` ON `taskCompletions` (`userId`);
--> statement-breakpoint
CREATE UNIQUE INDEX `uq_task_completions_owner_strategy_task` ON `taskCompletions` (`userId`, `strategyId`, `taskId`);
--> statement-breakpoint
CREATE TABLE `claimMilestoneEvents` (
  `id` int AUTO_INCREMENT NOT NULL,
  `userId` int NOT NULL,
  `strategyId` int NOT NULL,
  `policyId` int NOT NULL,
  `kind` varchar(48) NOT NULL,
  `effectiveDate` varchar(10) NOT NULL,
  `carrierReference` varchar(128),
  `approvalDedupeKey` varchar(96) UNIQUE,
  `evidenceDocumentId` int,
  `attestedByUserId` int NOT NULL,
  `evidenceLevel` varchar(32) NOT NULL DEFAULT 'user_submitted',
  `recordedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `claimMilestoneEvents_id` PRIMARY KEY(`id`),
  CONSTRAINT `fk_claim_milestone_evidence` FOREIGN KEY (`evidenceDocumentId`) REFERENCES `documentUploads`(`id`) ON DELETE RESTRICT
) ENGINE=InnoDB;
--> statement-breakpoint
CREATE INDEX `idx_claim_milestones_user` ON `claimMilestoneEvents` (`userId`);
--> statement-breakpoint
CREATE INDEX `idx_claim_milestones_strategy` ON `claimMilestoneEvents` (`strategyId`);
--> statement-breakpoint
CREATE INDEX `idx_claim_milestones_kind` ON `claimMilestoneEvents` (`kind`);
