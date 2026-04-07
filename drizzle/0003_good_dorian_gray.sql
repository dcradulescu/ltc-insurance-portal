ALTER TABLE `policies` ADD `insuredEmail` varchar(320);--> statement-breakpoint
ALTER TABLE `policies` ADD `insuredPhone` varchar(32);--> statement-breakpoint
ALTER TABLE `policies` ADD `insuredMailingAddress` text;--> statement-breakpoint
ALTER TABLE `policies` ADD `insuredSsn` varchar(16);--> statement-breakpoint
ALTER TABLE `policies` ADD `insuredMedicareNumber` varchar(64);--> statement-breakpoint
ALTER TABLE `policies` ADD `insuredMedicaidNumber` varchar(64);--> statement-breakpoint
ALTER TABLE `policies` ADD `powerOfAttorneyPresent` varchar(8);--> statement-breakpoint
ALTER TABLE `policies` ADD `poa_name` varchar(255);--> statement-breakpoint
ALTER TABLE `policies` ADD `poa_relationship` varchar(128);--> statement-breakpoint
ALTER TABLE `policies` ADD `equipmentAllowanceEnabled` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `policies` ADD `equipmentAllowanceAmount` varchar(64);--> statement-breakpoint
ALTER TABLE `policies` ADD `equipmentAllowanceCoverage` text;--> statement-breakpoint
ALTER TABLE `policies` ADD `equipmentAllowanceDeductedFromLifetime` varchar(8);--> statement-breakpoint
ALTER TABLE `policies` ADD `inflationAdjustmentEnabled` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `policies` ADD `inflationType` varchar(32) DEFAULT 'none';--> statement-breakpoint
ALTER TABLE `policies` ADD `inflationPercentagePerYear` varchar(16);--> statement-breakpoint
ALTER TABLE `policies` ADD `inflationContinuesAfterBenefits` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `policies` ADD `equipmentAllowanceRelatedAdls` json;--> statement-breakpoint
ALTER TABLE `policies` ADD `qualifyingAdls` json;--> statement-breakpoint
ALTER TABLE `policies` ADD `careNeeds` json;--> statement-breakpoint
ALTER TABLE `policies` ADD `equipmentNeeds` json;--> statement-breakpoint
ALTER TABLE `policies` ADD `equipmentAllowanceNotes` text;--> statement-breakpoint
ALTER TABLE `policies` ADD `fillerRelationship` varchar(128);