import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function migrateDatabase() {
  console.log('[RemoteX DB] Running migrations...');
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

    const migrationsDir = path.resolve(__dirname, '../../database/migrations');
    if (!fs.existsSync(migrationsDir)) {
      console.warn('[RemoteX DB] Migrations folder not found.');
      return;
    }

    const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();
    for (const file of files) {
      console.log(`[RemoteX DB] Applying migration: ${file}`);
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf8');
      await conn.query(sql);
      console.log(`[RemoteX DB] Successfully executed: ${file}`);
    }

    console.log('[RemoteX DB] All migrations applied successfully!');
  } catch (err) {
    console.error('[RemoteX DB Error] Migration failed:', err.message);
    process.exit(1);
  } finally {
    if (conn) await conn.end();
  }
}

migrateDatabase();
