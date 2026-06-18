-- LTC Insurance Portal — MySQL bootstrap
-- Run as root or another MySQL admin user.
-- IMPORTANT: Replace CHANGE_ME_STRONG_PASSWORD before execution.

CREATE DATABASE IF NOT EXISTS ltc_insurance_portal
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

CREATE USER IF NOT EXISTS 'ltc_portal_user'@'localhost'
  IDENTIFIED BY 'CHANGE_ME_STRONG_PASSWORD';

GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, ALTER, INDEX, DROP
  ON ltc_insurance_portal.*
  TO 'ltc_portal_user'@'localhost';

FLUSH PRIVILEGES;
