import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function seedDatabase() {
  console.log('[RemoteX DB] Seeding database...');
  const host = process.env.DB_HOST || 'localhost';
  const port = parseInt(process.env.DB_PORT || '3306', 10);
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : 'root';
  const dbName = process.env.DB_NAME || 'remotex_db';

  let conn;
  try {
    conn = await mysql.createConnection({
      host,
      port,
      user,
      password,
      database: dbName,
      multipleStatements: true
    });

    const seedsDir = path.resolve(__dirname, '../../database/seeds');
    if (!fs.existsSync(seedsDir)) {
      console.warn('[RemoteX DB] Seeds folder not found.');
      return;
    }

    // Generate valid bcrypt password for demo user
    const salt = await bcrypt.genSalt(10);
    const demoPasswordHash = await bcrypt.hash('Password123!', salt);

    // Upsert demo users with valid hash
    await conn.query(
      `INSERT INTO users (id, name, email, password_hash)
       VALUES 
         (1, 'Host Administrator', 'host@remotex.local', ?),
         (2, 'Client Technician', 'client@remotex.local', ?)
       ON DUPLICATE KEY UPDATE name=VALUES(name), password_hash=VALUES(password_hash);`,
      [demoPasswordHash, demoPasswordHash]
    );

    // Upsert demo devices
    await conn.query(
      `INSERT INTO devices (id, user_id, device_name, device_code, operating_system, device_status)
       VALUES
         (1, 1, 'WORKSTATION-HOST-01', 'RX-982-143-520', 'Windows 11 Pro', 'online'),
         (2, 2, 'SUPPORT-CLIENT-02', 'RX-347-891-205', 'Windows 11 Home', 'online')
       ON DUPLICATE KEY UPDATE device_name=VALUES(device_name), device_status=VALUES(device_status);`
    );

    // Trusted device relationship
    await conn.query(
      `INSERT INTO trusted_devices (user_id, device_id)
       VALUES (1, 2), (2, 1)
       ON DUPLICATE KEY UPDATE device_id=VALUES(device_id);`
    );

    console.log('[RemoteX DB] Seeding finished successfully!');
    console.log('[RemoteX DB] Seed users: host@remotex.local / Password123!, client@remotex.local / Password123!');
  } catch (err) {
    console.error('[RemoteX DB Error] Seeding failed:', err.message);
    process.exit(1);
  } finally {
    if (conn) await conn.end();
  }
}

seedDatabase();
