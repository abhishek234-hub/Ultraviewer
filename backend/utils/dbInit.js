import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function initDatabase() {
  console.log('[RemoteX DB] Initializing MySQL database...');
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
      multipleStatements: true
    });

    console.log(`[RemoteX DB] Connected to MySQL host ${host}:${port} as ${user}.`);
    await conn.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
    console.log(`[RemoteX DB] Database '${dbName}' created or confirmed.`);

    const schemaPath = path.resolve(__dirname, '../../database/schema.sql');
    if (fs.existsSync(schemaPath)) {
      const sql = fs.readFileSync(schemaPath, 'utf8');
      await conn.query(sql);
      console.log(`[RemoteX DB] Schema applied successfully from ${schemaPath}.`);
    } else {
      console.warn(`[RemoteX DB] Schema file not found at ${schemaPath}`);
    }

    console.log('[RemoteX DB] Initialization complete!');
  } catch (err) {
    console.error('[RemoteX DB Error] Initialization failed:', err.message);
    process.exit(1);
  } finally {
    if (conn) await conn.end();
  }
}

initDatabase();
