ALTER TABLE `policies` ADD `insuredEmail` varchar(320);--> statement-breakpoint
ALTER TABLE `policies` ADD `insuredPhone` varchar(32);--> statement-breakpoint
ALTER TABLE `policies` ADD `poa_name` varchar(255);--> statement-breakpoint
ALTER TABLE `policies` ADD `poa_relationship` varchar(128);--> statement-breakpoint
ALTER TABLE `policies` ADD `isHomeCareCovidInPolicy` varchar(8);--> statement-breakpoint
ALTER TABLE `policies` ADD `qualifyingAdls` json;--> statement-breakpoint
ALTER TABLE `policies` ADD `careNeeds` json;