ALTER TABLE `policies` ADD `lookBackPeriodEnabled` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `policies` ADD `lookBackPeriodDays` varchar(16);--> statement-breakpoint
ALTER TABLE `policies` ADD `careCoordinatorReductionEnabled` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `policies` ADD `careCoordinatorReducedToDays` varchar(16);--> statement-breakpoint
ALTER TABLE `policies` ADD `reductionInCareProvidedEnabled` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `policies` ADD `reductionInCareDaysCountedAs7` varchar(16);