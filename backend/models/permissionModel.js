import { query } from '../config/database.js';

export const PermissionModel = {
  async getPermissionsBySession(sessionId) {
    const rows = await query(
      'SELECT permission_type, is_allowed FROM session_permissions WHERE session_id = ?',
      [sessionId]
    );
    const permissions = {};
    for (const r of rows) {
      permissions[r.permission_type] = Boolean(r.is_allowed);
    }
    return permissions;
  },

  async setPermission(sessionId, permissionType, isAllowed) {
    await query(
      `INSERT INTO session_permissions (session_id, permission_type, is_allowed)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE is_allowed = VALUES(is_allowed)`,
      [sessionId, permissionType, isAllowed ? 1 : 0]
    );
  },

  async initializeDefaultPermissions(sessionId, { mouseKeyboard = true, fileTransfer = true, clipboard = true, audio = false } = {}) {
    const perms = [
      ['mouse_keyboard', mouseKeyboard ? 1 : 0],
      ['file_transfer', fileTransfer ? 1 : 0],
      ['clipboard', clipboard ? 1 : 0],
      ['audio', audio ? 1 : 0]
    ];
    for (const [type, allowed] of perms) {
      await this.setPermission(sessionId, type, allowed);
    }
  },

  async isAllowed(sessionId, permissionType) {
    const rows = await query(
      'SELECT is_allowed FROM session_permissions WHERE session_id = ? AND permission_type = ? LIMIT 1',
      [sessionId, permissionType]
    );
    return rows.length > 0 ? Boolean(rows[0].is_allowed) : false;
  }
};

export default PermissionModel;
