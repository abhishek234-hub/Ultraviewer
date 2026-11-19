import DeviceModel from '../models/deviceModel.js';
import DeviceService from '../services/deviceService.js';
import { registerDeviceSchema } from '../validators/deviceValidator.js';

export const DeviceController = {
  async register(req, res, next) {
    try {
      const parsed = registerDeviceSchema.parse(req.body);
      const userId = req.user ? req.user.id : null;

      const device = await DeviceService.registerDevice(userId, {
        deviceName: parsed.deviceName,
        deviceCode: parsed.deviceCode,
        operatingSystem: parsed.operatingSystem
      });

      return res.status(200).json({
        success: true,
        message: 'Device registered successfully.',
        data: { device }
      });
    } catch (err) {
      next(err);
    }
  },

  async getAll(req, res, next) {
    try {
      const devices = await DeviceModel.findByUserId(req.user.id);
      return res.status(200).json({
        success: true,
        data: { devices }
      });
    } catch (err) {
      next(err);
    }
  },

  async getById(req, res, next) {
    try {
      const id = parseInt(req.params.id, 10);
      const device = await DeviceModel.findById(id);
      if (!device) {
        return res.status(404).json({
          success: false,
          message: 'Device not found.'
        });
      }
      return res.status(200).json({
        success: true,
        data: { device }
      });
    } catch (err) {
      next(err);
    }
  },

  async lookupByCode(req, res, next) {
    try {
      const { code } = req.params;
      const device = await DeviceModel.findByCode(code.trim().toUpperCase());
      if (!device) {
        return res.status(404).json({
          success: false,
          message: 'RemoteX ID not found or offline.'
        });
      }
      return res.status(200).json({
        success: true,
        data: {
          device: {
            id: device.id,
            deviceName: device.device_name,
            deviceCode: device.device_code,
            operatingSystem: device.operating_system,
            deviceStatus: device.device_status,
            lastSeen: device.last_seen
          }
        }
      });
    } catch (err) {
      next(err);
    }
  },

  async delete(req, res, next) {
    try {
      const id = parseInt(req.params.id, 10);
      const deleted = await DeviceModel.deleteDevice(id, req.user.id);
      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'Device not found or not owned by you.'
        });
      }
      return res.status(200).json({
        success: true,
        message: 'Device unregistered successfully.'
      });
    } catch (err) {
      next(err);
    }
  },

  async getTrusted(req, res, next) {
    try {
      const trusted = await DeviceModel.getTrustedDevices(req.user.id);
      return res.status(200).json({
        success: true,
        data: { trusted }
      });
    } catch (err) {
      next(err);
    }
  },

  async addTrusted(req, res, next) {
    try {
      const deviceId = parseInt(req.params.id, 10);
      await DeviceModel.addTrustedDevice(req.user.id, deviceId);
      return res.status(200).json({
        success: true,
        message: 'Device added to trusted list.'
      });
    } catch (err) {
      next(err);
    }
  },

  async removeTrusted(req, res, next) {
    try {
      const deviceId = parseInt(req.params.id, 10);
      await DeviceModel.removeTrustedDevice(req.user.id, deviceId);
      return res.status(200).json({
        success: true,
        message: 'Device removed from trusted list.'
      });
    } catch (err) {
      next(err);
    }
  }
};

export default DeviceController;
