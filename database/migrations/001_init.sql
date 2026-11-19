-- Migration: 001_init.sql
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_users_email (email)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS devices (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NULL,
  device_name VARCHAR(255) NOT NULL,
  device_code VARCHAR(64) NOT NULL UNIQUE,
  operating_system VARCHAR(100) DEFAULT 'Windows',
  device_status ENUM('online', 'offline', 'busy') DEFAULT 'offline',
  last_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_devices_user (user_id),
  INDEX idx_devices_code (device_code),
  INDEX idx_devices_status (device_status),
  CONSTRAINT fk_devices_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS sessions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  session_code VARCHAR(64) NOT NULL UNIQUE,
  host_device_id INT NOT NULL,
  client_device_id INT NOT NULL,
  session_status ENUM('pending', 'active', 'ended', 'rejected') DEFAULT 'pending',
  started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  ended_at DATETIME NULL,
  INDEX idx_sessions_host (host_device_id),
  INDEX idx_sessions_client (client_device_id),
  INDEX idx_sessions_code (session_code),
  INDEX idx_sessions_status (session_status),
  CONSTRAINT fk_sessions_host FOREIGN KEY (host_device_id) REFERENCES devices(id) ON DELETE CASCADE,
  CONSTRAINT fk_sessions_client FOREIGN KEY (client_device_id) REFERENCES devices(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS session_permissions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  session_id INT NOT NULL,
  permission_type VARCHAR(64) NOT NULL,
  is_allowed BOOLEAN DEFAULT FALSE,
  INDEX idx_session_permissions_session (session_id),
  CONSTRAINT fk_session_permissions_session FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
  UNIQUE KEY uq_session_permission (session_id, permission_type)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS trusted_devices (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  device_id INT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_trusted_user (user_id),
  INDEX idx_trusted_device (device_id),
  CONSTRAINT fk_trusted_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_trusted_device FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE,
  UNIQUE KEY uq_user_device (user_id, device_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS connection_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  session_id INT NULL,
  user_id INT NULL,
  action VARCHAR(128) NOT NULL,
  ip_address VARCHAR(64) NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_logs_session (session_id),
  INDEX idx_logs_user (user_id),
  INDEX idx_logs_action (action),
  CONSTRAINT fk_logs_session FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE SET NULL,
  CONSTRAINT fk_logs_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS file_transfers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  session_id INT NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_size BIGINT NOT NULL,
  transfer_status ENUM('pending', 'in_progress', 'completed', 'cancelled', 'failed') DEFAULT 'pending',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_file_transfers_session (session_id),
  INDEX idx_file_transfers_status (transfer_status),
  CONSTRAINT fk_file_transfers_session FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
) ENGINE=InnoDB;
