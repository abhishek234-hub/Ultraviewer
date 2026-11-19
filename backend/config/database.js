import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

function parseDatabaseConfig() {
  if (process.env.DATABASE_URL) {
    try {
      const parsedUrl = new URL(process.env.DATABASE_URL);
      return {
        host: parsedUrl.hostname,
        port: parseInt(parsedUrl.port || '3306', 10),
        user: decodeURIComponent(parsedUrl.username || 'root'),
        password: decodeURIComponent(parsedUrl.password || ''),
        database: parsedUrl.pathname.replace(/^\//, '') || 'remotex_db',
        ssl: parsedUrl.searchParams.get('ssl') === 'false' ? undefined : (parsedUrl.hostname !== 'localhost' && parsedUrl.hostname !== '127.0.0.1' ? { rejectUnauthorized: false } : undefined),
        waitForConnections: true,
        connectionLimit: 15,
        queueLimit: 0,
        enableKeepAlive: true,
        keepAliveInitialDelay: 10000,
        dateStrings: true
      };
    } catch (e) {
      console.warn('[Database] Failed to parse DATABASE_URL, falling back to standard env:', e.message);
    }
  }

  return {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : 'root',
    database: process.env.DB_NAME || 'remotex_db',
    waitForConnections: true,
    connectionLimit: 15,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000,
    dateStrings: true
  };
}

export const dbConfig = parseDatabaseConfig();

// Check and ensure database exists
export async function ensureDatabaseExists() {
  // If remote cloud host or DATABASE_URL is set, cloud databases usually pre-create the DB
  if (dbConfig.host !== 'localhost' && dbConfig.host !== '127.0.0.1') {
    return true;
  }

  const rootConfig = {
    host: dbConfig.host,
    port: dbConfig.port,
    user: dbConfig.user,
    password: dbConfig.password
  };

  try {
    const tempConn = await mysql.createConnection(rootConfig);
    await tempConn.query(
      `CREATE DATABASE IF NOT EXISTS \`${dbConfig.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`
    );
    await tempConn.end();
    return true;
  } catch (err) {
    console.warn('[Database Notice] ensureDatabaseExists skipped or failed:', err.message);
    return false;
  }
}

let pool;

export function getPool() {
  if (!pool) {
    pool = mysql.createPool(dbConfig);
  }
  return pool;
}

export async function query(sql, params = []) {
  const connectionPool = getPool();
  const [results] = await connectionPool.execute(sql, params);
  return results;
}

export async function withTransaction(callback) {
  const connectionPool = getPool();
  const connection = await connectionPool.getConnection();
  try {
    await connection.beginTransaction();
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}

export async function testConnection() {
  try {
    await ensureDatabaseExists();
    const connectionPool = getPool();
    const [rows] = await connectionPool.query('SELECT 1 + 1 AS result');
    return rows[0].result === 2;
  } catch (err) {
    console.error('[Database Error] Connection test failed:', err.message);
    return false;
  }
}

export default {
  getPool,
  query,
  withTransaction,
  ensureDatabaseExists,
  testConnection,
  dbConfig
};
