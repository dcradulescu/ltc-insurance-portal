ALTER TABLE `users` MODIFY COLUMN `createdAt` timestamp DEFAULT (now());--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `updatedAt` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `policies` ADD `equipmentAllowanceEnabled` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `policies` ADD `equipmentAllowanceAmount` varchar(64);--> statement-breakpoint
ALTER TABLE `policies` ADD `equipmentAllowanceCoverage` text;--> statement-breakpoint
ALTER TABLE `policies` ADD `equipmentAllowanceDeductedFromLifetime` varchar(8);--> statement-breakpoint
ALTER TABLE `policies` ADD `equipmentAllowanceRelatedAdls` json;--> statement-breakpoint
ALTER TABLE `policies` ADD `equipmentNeeds` json;--> statement-breakpoint
ALTER TABLE `policies` ADD `equipmentAllowanceNotes` text;