import SessionModel from '../models/sessionModel.js';
import DeviceModel from '../models/deviceModel.js';
import PermissionModel from '../models/permissionModel.js';
import ConnectionLogModel from '../models/connectionLogModel.js';
import DeviceService from '../services/deviceService.js';
import TurnService from '../services/turnService.js';
import { createSessionSchema, updatePermissionSchema } from '../validators/sessionValidator.js';

export const SessionController = {
  async create(req, res, next) {
    try {
      const parsed = createSessionSchema.parse(req.body);

      const host = await DeviceModel.findByCode(parsed.hostCode.trim().toUpperCase());
      const client = await DeviceModel.findByCode(parsed.clientCode.trim().toUpperCase());

      if (!host) {
        return res.status(404).json({ success: false, message: 'Host device not found.' });
      }
      if (!client) {
        return res.status(404).json({ success: false, message: 'Client device not found.' });
      }

      const sessionCode = DeviceService.generateSessionCode();
      const session = await SessionModel.createSession(sessionCode, host.id, client.id, 'pending');

      await PermissionModel.initializeDefaultPermissions(session.id, parsed.permissions);

      await ConnectionLogModel.log({
        sessionId: session.id,
        userId: req.user ? req.user.id : null,
        action: 'SESSION_INITIALIZED',
        ipAddress: req.ip
      });

      return res.status(201).json({
        success: true,
        message: 'Session created successfully.',
        data: {
          session,
          iceServers: TurnService.getIceServers(client.device_code)
        }
      });
    } catch (err) {
      next(err);
    }
  },

  async getByCode(req, res, next) {
    try {
      const { code } = req.params;
      const session = await SessionModel.findByCode(code);
      if (!session) {
        return res.status(404).json({ success: false, message: 'Session not found.' });
      }

      const permissions = await PermissionModel.getPermissionsBySession(session.id);
      return res.status(200).json({
        success: true,
        data: {
          session,
          permissions
        }
      });
    } catch (err) {
      next(err);
    }
  },

  async updatePermission(req, res, next) {
    try {
      const { code } = req.params;
      const parsed = updatePermissionSchema.parse(req.body);

      const session = await SessionModel.findByCode(code);
      if (!session) {
        return res.status(404).json({ success: false, message: 'Session not found.' });
      }

      await PermissionModel.setPermission(session.id, parsed.permissionType, parsed.isAllowed);

      await ConnectionLogModel.log({
        sessionId: session.id,
        userId: req.user ? req.user.id : null,
        action: `PERMISSION_${parsed.permissionType.toUpperCase()}_${parsed.isAllowed ? 'ALLOWED' : 'DENIED'}`,
        ipAddress: req.ip
      });

      const updatedPermissions = await PermissionModel.getPermissionsBySession(session.id);
      return res.status(200).json({
        success: true,
        message: 'Permission updated successfully.',
        data: { permissions: updatedPermissions }
      });
    } catch (err) {
      next(err);
    }
  },

  async getRecent(req, res, next) {
    try {
      const sessions = await SessionModel.getRecentSessions(req.user.id);
      return res.status(200).json({
        success: true,
        data: { sessions }
      });
    } catch (err) {
      next(err);
    }
  },

  async getIceServers(req, res, next) {
    try {
      const username = req.user ? `user-${req.user.id}` : 'guest';
      const iceServers = TurnService.getIceServers(username);
      return res.status(200).json({
        success: true,
        data: { iceServers }
      });
    } catch (err) {
      next(err);
    }
  }
};

export default SessionController;
