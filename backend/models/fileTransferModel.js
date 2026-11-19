import { query } from '../config/database.js';

export const FileTransferModel = {
  async createFileTransfer(sessionId, fileName, fileSize, status = 'pending') {
    const result = await query(
      `INSERT INTO file_transfers (session_id, file_name, file_size, transfer_status, created_at)
       VALUES (?, ?, ?, ?, NOW())`,
      [sessionId, fileName, fileSize, status]
    );
    return this.findById(result.insertId);
  },

  async findById(id) {
    const rows = await query('SELECT * FROM file_transfers WHERE id = ? LIMIT 1', [id]);
    return rows[0] || null;
  },

  async updateStatus(id, status) {
    await query('UPDATE file_transfers SET transfer_status = ? WHERE id = ?', [status, id]);
  },

  async getTransfersBySession(sessionId) {
    const rows = await query(
      'SELECT * FROM file_transfers WHERE session_id = ? ORDER BY created_at DESC',
      [sessionId]
    );
    return rows;
  }
};

export default FileTransferModel;
