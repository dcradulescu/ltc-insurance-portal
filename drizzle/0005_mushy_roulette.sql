ALTER TABLE `policies` ADD `inflationAdjustmentEnabled` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `policies` ADD `inflationType` varchar(32) DEFAULT 'none';--> statement-breakpoint
ALTER TABLE `policies` ADD `inflationPercentagePerYear` varchar(16);--> statement-breakpoint
ALTER TABLE `policies` ADD `inflationContinuesAfterBenefits` boolean DEFAULT false;