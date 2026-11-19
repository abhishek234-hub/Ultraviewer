import { query } from '../config/database.js';

export const AuthModel = {
  async findByEmail(email) {
    const rows = await query('SELECT * FROM users WHERE email = ? LIMIT 1', [email]);
    return rows[0] || null;
  },

  async findById(id) {
    const rows = await query('SELECT id, name, email, created_at, updated_at FROM users WHERE id = ? LIMIT 1', [id]);
    return rows[0] || null;
  },

  async createUser(name, email, passwordHash) {
    const result = await query(
      'INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)',
      [name, email, passwordHash]
    );
    return {
      id: result.insertId,
      name,
      email
    };
  },

  async updatePassword(userId, passwordHash) {
    await query('UPDATE users SET password_hash = ? WHERE id = ?', [passwordHash, userId]);
    return true;
  },

  async updateProfile(userId, name) {
    await query('UPDATE users SET name = ? WHERE id = ?', [name, userId]);
    return true;
  },

  async getSettings(userId) {
    const rows = await query('SELECT settings FROM users WHERE id = ? LIMIT 1', [userId]);
    if (!rows[0] || !rows[0].settings) return null;
    try {
      return typeof rows[0].settings === 'string' ? JSON.parse(rows[0].settings) : rows[0].settings;
    } catch (e) {
      return null;
    }
  },

  async updateSettings(userId, settings) {
    await query('UPDATE users SET settings = ? WHERE id = ?', [JSON.stringify(settings), userId]);
    return settings;
  }
};

export default AuthModel;
