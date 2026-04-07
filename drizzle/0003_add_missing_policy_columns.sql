-- Add missing columns to policies table for new features
-- Using IF NOT EXISTS to avoid errors if columns already exist

ALTER TABLE `policies` ADD COLUMN IF NOT EXISTS `insuredEmail` varchar(320);
ALTER TABLE `policies` ADD COLUMN IF NOT EXISTS `insuredPhone` varchar(32);
ALTER TABLE `policies` ADD COLUMN IF NOT EXISTS `insuredMailingAddress` text;
ALTER TABLE `policies` ADD COLUMN IF NOT EXISTS `insuredSsn` varchar(16);
ALTER TABLE `policies` ADD COLUMN IF NOT EXISTS `insuredMedicareNumber` varchar(64);
ALTER TABLE `policies` ADD COLUMN IF NOT EXISTS `insuredMedicaidNumber` varchar(64);
ALTER TABLE `policies` ADD COLUMN IF NOT EXISTS `powerOfAttorneyPresent` varchar(8);
ALTER TABLE `policies` ADD COLUMN IF NOT EXISTS `poa_name` varchar(255);
ALTER TABLE `policies` ADD COLUMN IF NOT EXISTS `poa_relationship` varchar(128);
ALTER TABLE `policies` ADD COLUMN IF NOT EXISTS `equipmentAllowanceEnabled` boolean DEFAULT false;
ALTER TABLE `policies` ADD COLUMN IF NOT EXISTS `equipmentAllowanceAmount` varchar(64);
ALTER TABLE `policies` ADD COLUMN IF NOT EXISTS `equipmentAllowanceCoverage` text;
ALTER TABLE `policies` ADD COLUMN IF NOT EXISTS `equipmentAllowanceDeductedFromLifetime` varchar(8);
ALTER TABLE `policies` ADD COLUMN IF NOT EXISTS `equipmentAllowanceRelatedAdls` json;
ALTER TABLE `policies` ADD COLUMN IF NOT EXISTS `equipmentNeeds` json;
ALTER TABLE `policies` ADD COLUMN IF NOT EXISTS `equipmentAllowanceNotes` text;
ALTER TABLE `policies` ADD COLUMN IF NOT EXISTS `inflationAdjustmentEnabled` boolean DEFAULT false;
ALTER TABLE `policies` ADD COLUMN IF NOT EXISTS `inflationType` varchar(32) DEFAULT 'none';
ALTER TABLE `policies` ADD COLUMN IF NOT EXISTS `inflationPercentagePerYear` varchar(16);
ALTER TABLE `policies` ADD COLUMN IF NOT EXISTS `inflationContinuesAfterBenefits` boolean DEFAULT false;
ALTER TABLE `policies` ADD COLUMN IF NOT EXISTS `qualifyingAdls` json;
ALTER TABLE `policies` ADD COLUMN IF NOT EXISTS `careNeeds` json;
ALTER TABLE `policies` ADD COLUMN IF NOT EXISTS `fillerRelationship` varchar(128);
