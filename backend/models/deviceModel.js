import { query } from '../config/database.js';

export const DeviceModel = {
  async findByCode(deviceCode) {
    const rows = await query('SELECT * FROM devices WHERE device_code = ? LIMIT 1', [deviceCode]);
    return rows[0] || null;
  },

  async findById(id) {
    const rows = await query('SELECT * FROM devices WHERE id = ? LIMIT 1', [id]);
    return rows[0] || null;
  },

  async findByUserId(userId) {
    const rows = await query(
      `SELECT d.*, 
        CASE WHEN td.id IS NOT NULL THEN 1 ELSE 0 END AS is_trusted
       FROM devices d
       LEFT JOIN trusted_devices td ON td.device_id = d.id AND td.user_id = ?
       WHERE d.user_id = ?
       ORDER BY d.last_seen DESC`,
      [userId, userId]
    );
    return rows;
  },

  async registerOrUpdate({ userId, deviceName, deviceCode, operatingSystem, status = 'online' }) {
    const existing = await this.findByCode(deviceCode);
    if (existing) {
      await query(
        `UPDATE devices 
         SET user_id = COALESCE(?, user_id),
             device_name = ?,
             operating_system = ?,
             device_status = ?,
             last_seen = NOW()
         WHERE id = ?`,
        [userId, deviceName, operatingSystem, status, existing.id]
      );
      return this.findById(existing.id);
    }

    const result = await query(
      `INSERT INTO devices (user_id, device_name, device_code, operating_system, device_status, last_seen)
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [userId, deviceName, deviceCode, operatingSystem, status]
    );
    return this.findById(result.insertId);
  },

  async updateStatus(deviceCode, status) {
    await query(
      'UPDATE devices SET device_status = ?, last_seen = NOW() WHERE device_code = ?',
      [status, deviceCode]
    );
  },

  async deleteDevice(id, userId) {
    const result = await query(
      'DELETE FROM devices WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    return result.affectedRows > 0;
  },

  async getTrustedDevices(userId) {
    const rows = await query(
      `SELECT d.*, td.created_at AS trusted_since
       FROM trusted_devices td
       JOIN devices d ON d.id = td.device_id
       WHERE td.user_id = ?
       ORDER BY td.created_at DESC`,
      [userId]
    );
    return rows;
  },

  async addTrustedDevice(userId, deviceId) {
    await query(
      'INSERT IGNORE INTO trusted_devices (user_id, device_id) VALUES (?, ?)',
      [userId, deviceId]
    );
  },

  async removeTrustedDevice(userId, deviceId) {
    await query(
      'DELETE FROM trusted_devices WHERE user_id = ? AND device_id = ?',
      [userId, deviceId]
    );
  }
};

export default DeviceModel;
