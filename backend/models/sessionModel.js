import { query } from '../config/database.js';

export const SessionModel = {
  async createSession(sessionCode, hostDeviceId, clientDeviceId, status = 'pending') {
    const result = await query(
      `INSERT INTO sessions (session_code, host_device_id, client_device_id, session_status, started_at)
       VALUES (?, ?, ?, ?, NOW())`,
      [sessionCode, hostDeviceId, clientDeviceId, status]
    );
    return this.findById(result.insertId);
  },

  async findById(id) {
    const rows = await query(
      `SELECT s.*, 
        hd.device_name AS host_name, hd.device_code AS host_code,
        cd.device_name AS client_name, cd.device_code AS client_code
       FROM sessions s
       JOIN devices hd ON hd.id = s.host_device_id
       JOIN devices cd ON cd.id = s.client_device_id
       WHERE s.id = ? LIMIT 1`,
      [id]
    );
    return rows[0] || null;
  },

  async findByCode(sessionCode) {
    const rows = await query(
      `SELECT s.*, 
        hd.device_name AS host_name, hd.device_code AS host_code,
        cd.device_name AS client_name, cd.device_code AS client_code
       FROM sessions s
       JOIN devices hd ON hd.id = s.host_device_id
       JOIN devices cd ON cd.id = s.client_device_id
       WHERE s.session_code = ? LIMIT 1`,
      [sessionCode]
    );
    return rows[0] || null;
  },

  async updateStatus(sessionCode, status, ended = false) {
    if (ended) {
      await query(
        'UPDATE sessions SET session_status = ?, ended_at = NOW() WHERE session_code = ?',
        [status, sessionCode]
      );
    } else {
      await query(
        'UPDATE sessions SET session_status = ? WHERE session_code = ?',
        [status, sessionCode]
      );
    }
  },

  async getRecentSessions(userId, limit = 20) {
    const rows = await query(
      `SELECT s.*,
        hd.device_name AS host_name, hd.device_code AS host_code,
        cd.device_name AS client_name, cd.device_code AS client_code,
        TIMESTAMPDIFF(SECOND, s.started_at, COALESCE(s.ended_at, NOW())) AS duration_seconds
       FROM sessions s
       JOIN devices hd ON hd.id = s.host_device_id
       JOIN devices cd ON cd.id = s.client_device_id
       WHERE hd.user_id = ? OR cd.user_id = ?
       ORDER BY s.started_at DESC
       LIMIT ?`,
      [userId, userId, limit]
    );
    return rows;
  }
};

export default SessionModel;
