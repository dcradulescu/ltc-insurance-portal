-- Document Upload Status Tracking Schema Update
-- This SQL adds status tracking and verification fields to the documentUploads table

-- Add new columns to documentUploads table for enhanced tracking
ALTER TABLE documentUploads ADD COLUMN status VARCHAR(32) DEFAULT 'pending' COMMENT 'pending, uploaded, verified, rejected';
ALTER TABLE documentUploads ADD COLUMN verificationNotes TEXT COMMENT 'Notes from verification process';
ALTER TABLE documentUploads ADD COLUMN verifiedAt TIMESTAMP NULL COMMENT 'When document was verified';
ALTER TABLE documentUploads ADD COLUMN verifiedBy INT NULL COMMENT 'User ID who verified the document';
ALTER TABLE documentUploads ADD COLUMN rejectionReason VARCHAR(512) COMMENT 'Reason for rejection if applicable';
ALTER TABLE documentUploads ADD COLUMN uploadProgress INT DEFAULT 0 COMMENT 'Upload progress percentage (0-100)';
ALTER TABLE documentUploads ADD COLUMN description TEXT COMMENT 'User-provided description of document';
ALTER TABLE documentUploads ADD COLUMN tags JSON COMMENT 'Array of tags for categorization';
ALTER TABLE documentUploads ADD INDEX idx_userId_status (userId, status);
ALTER TABLE documentUploads ADD INDEX idx_policyId_status (policyId, status);
ALTER TABLE documentUploads ADD INDEX idx_taskId_status (taskId, status);

-- Create document categories reference table
CREATE TABLE IF NOT EXISTS documentCategories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(128) NOT NULL UNIQUE,
  description TEXT,
  requiredForClaim BOOLEAN DEFAULT FALSE,
  acceptedFileTypes JSON,
  maxFileSize INT COMMENT 'Max file size in bytes',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert standard document categories
INSERT INTO documentCategories (name, description, requiredForClaim, acceptedFileTypes, maxFileSize) VALUES
('Medical Records', 'Patient medical records and history', TRUE, '["application/pdf", "image/jpeg", "image/png"]', 52428800),
('Physician Assessment', 'Physician evaluation and assessment', TRUE, '["application/pdf", "image/jpeg", "image/png"]', 52428800),
('Plan of Care', 'Care plan documentation', TRUE, '["application/pdf", "image/jpeg", "image/png"]', 52428800),
('Insurance Policy', 'Long-term care insurance policy document', TRUE, '["application/pdf"]', 52428800),
('Proof of Payment', 'Proof of premium payments', FALSE, '["application/pdf", "image/jpeg", "image/png"]', 26214400),
('Identification', 'Government-issued ID or Medicare card', FALSE, '["image/jpeg", "image/png"]', 26214400),
('Bank Statements', 'Financial documentation for claims', FALSE, '["application/pdf", "image/jpeg", "image/png"]', 52428800),
('Other', 'Other supporting documentation', FALSE, '["application/pdf", "image/jpeg", "image/png", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"]', 52428800);
