-- Migration 002: Add settings and unattended access support
ALTER TABLE users ADD COLUMN settings JSON NULL;
ALTER TABLE devices ADD COLUMN unattended_password_hash VARCHAR(255) NULL;
