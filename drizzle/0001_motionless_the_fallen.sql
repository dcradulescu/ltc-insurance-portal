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
CREATE TABLE `policies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`holderFirstName` varchar(255),
	`holderLastName` varchar(255),
	`holderDateOfBirth` varchar(32),
	`holderRelationship` varchar(128),
	`insuranceCompany` varchar(255),
	`policyNumber` varchar(128),
	`policyType` varchar(128),
	`policyStatus` varchar(64),
	`effectiveDate` varchar(32),
	`dailyBenefitAmount` varchar(64),
	`benefitPeriod` varchar(128),
	`eliminationPeriod` varchar(128),
	`inflationProtection` varchar(128),
	`homeCareCoverage` varchar(8),
	`facilityCareCoverage` varchar(8),
	`currentCareNeeds` text,
	`diagnosisOrCondition` text,
	`adlLimitations` json,
	`cognitiveImpairment` varchar(8),
	`currentCareReceiving` text,
	`preferredCareType` varchar(128),
	`priorClaimsFiled` varchar(8),
	`priorClaimsDetails` text,
	`additionalNotes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `policies_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `strategies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`policyId` int NOT NULL,
	`strategyContent` text,
	`strategyHtml` text,
	`generatedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `strategies_id` PRIMARY KEY(`id`)
);
