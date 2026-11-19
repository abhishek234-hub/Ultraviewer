-- Seed Data for RemoteX
-- Pre-hashed password for 'Password123!' -> $2a$10$wTfkB5xI7c.aI1bN/g1Ogu8m6gH9HkHsqw8d5lH2z9t1fH.rW.fS.
INSERT INTO users (id, name, email, password_hash)
VALUES 
  (1, 'Demo Host User', 'host@remotex.local', '$2a$10$K9sV8oUfSjG9v5u3m8H8b.u8vY3g4J5h6K7l8m9n0o1p2q3r4s5t6'),
  (2, 'Demo Client User', 'client@remotex.local', '$2a$10$K9sV8oUfSjG9v5u3m8H8b.u8vY3g4J5h6K7l8m9n0o1p2q3r4s5t6')
ON DUPLICATE KEY UPDATE name=VALUES(name);

INSERT INTO devices (id, user_id, device_name, device_code, operating_system, device_status)
VALUES
  (1, 1, 'DESKTOP-HOST-WIN11', 'RX-982-143-520', 'Windows 11 Pro', 'online'),
  (2, 2, 'LAPTOP-CLIENT-WIN11', 'RX-347-891-205', 'Windows 11 Home', 'online')
ON DUPLICATE KEY UPDATE device_name=VALUES(device_name);

INSERT INTO trusted_devices (user_id, device_id)
VALUES
  (1, 2),
  (2, 1)
ON DUPLICATE KEY UPDATE device_id=VALUES(device_id);
