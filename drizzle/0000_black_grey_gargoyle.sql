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
	`insuredFullName` varchar(255),
	`insuredDob` varchar(32),
	`insuredMailingAddress` text,
	`insuredSsn` varchar(16),
	`insuredMedicareNumber` varchar(64),
	`insuredMedicaidNumber` varchar(64),
	`powerOfAttorneyPresent` varchar(8),
	`carrierName` varchar(255),
	`carrierAddress1` varchar(255),
	`carrierAddress2` varchar(255),
	`carrierCityStateZip` varchar(255),
	`carrierPhone` varchar(32),
	`carrierFax` varchar(32),
	`policyNumber` varchar(128),
	`claimPreClaimNumber` varchar(128),
	`eliminationPeriod` varchar(128),
	`dailyMaximum` varchar(64),
	`monthlyMaximum` varchar(64),
	`lifetimeMaximum` varchar(64),
	`minAdlsRequired` varchar(16),
	`waiverOfPremium` varchar(8),
	`cnaRequired` varchar(8),
	`careNotesRequired` varchar(8),
	`paymentCycle` varchar(128),
	`assignmentOfBenefits` varchar(8),
	`caseManagerName` varchar(255),
	`thirdPartyAssessmentRequired` varchar(8),
	`thirdPartyAssessmentWho` varchar(255),
	`cognitiveImpairmentTrigger` varchar(8),
	`planOfCareStatus` varchar(128),
	`ltcCoordinatorAssigned` varchar(255),
	`primaryCarePhysician` json,
	`otherProviders` json,
	`facilitiesUsed` json,
	`dischargeDocumentation` varchar(8),
	`currentCareNeeds` text,
	`diagnosisOrCondition` text,
	`adlLimitations` json,
	`preferredCareType` varchar(128),
	`additionalNotes` text,
	`fillerRelationship` varchar(128),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `policies_id` PRIMARY KEY(`id`)
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
	`claimStatus` varchar(32) DEFAULT 'not_started',
	`generatedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `strategies_id` PRIMARY KEY(`id`)
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
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastSignedIn` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_openId_unique` UNIQUE(`openId`)
);
