import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function checkDatabase() {
  console.log('[RemoteX DB] Checking database connectivity and schema integrity...');
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
      database: dbName
    });

    console.log(`[RemoteX DB] Successfully connected to MySQL at ${host}:${port}, database '${dbName}'.`);

    const [tables] = await conn.query('SHOW TABLES');
    const tableNames = tables.map(t => Object.values(t)[0]);
    console.log(`[RemoteX DB] Tables found (${tableNames.length}):`, tableNames.join(', '));

    const requiredTables = [
      'users',
      'devices',
      'sessions',
      'session_permissions',
      'trusted_devices',
      'connection_logs',
      'file_transfers'
    ];

    const missing = requiredTables.filter(t => !tableNames.includes(t));
    if (missing.length > 0) {
      console.error(`[RemoteX DB Error] Missing required tables: ${missing.join(', ')}`);
      process.exit(1);
    }

    console.log('[RemoteX DB] All required tables exist.');
    for (const t of requiredTables) {
      const [countResult] = await conn.query(`SELECT COUNT(*) as count FROM \`${t}\``);
      console.log(`  - Table '${t}': ${countResult[0].count} records`);
    }

    console.log('[RemoteX DB] Verification PASSED!');
  } catch (err) {
    console.error('[RemoteX DB Error] Check failed:', err.message);
    process.exit(1);
  } finally {
    if (conn) await conn.end();
  }
}

checkDatabase();
