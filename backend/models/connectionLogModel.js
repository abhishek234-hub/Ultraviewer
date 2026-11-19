import { query } from '../config/database.js';

export const ConnectionLogModel = {
  async log({ sessionId = null, userId = null, action, ipAddress = null }) {
    const result = await query(
      `INSERT INTO connection_logs (session_id, user_id, action, ip_address, created_at)
       VALUES (?, ?, ?, ?, NOW())`,
      [sessionId, userId, action, ipAddress]
    );
    return result.insertId;
  },

  async getRecentLogs(userId, limit = 50) {
    const rows = await query(
      `SELECT cl.*, s.session_code
       FROM connection_logs cl
       LEFT JOIN sessions s ON s.id = cl.session_id
       WHERE cl.user_id = ?
       ORDER BY cl.created_at DESC
       LIMIT ?`,
      [userId, limit]
    );
    return rows;
  }
};

export default ConnectionLogModel;
