import crypto from 'crypto';
import DeviceModel from '../models/deviceModel.js';

export const DeviceService = {
  generateDeviceCode() {
    // Generate a 9-digit clean code formatted as RX-123-456-789
    const part1 = Math.floor(100 + Math.random() * 900);
    const part2 = Math.floor(100 + Math.random() * 900);
    const part3 = Math.floor(100 + Math.random() * 900);
    return `RX-${part1}-${part2}-${part3}`;
  },

  generateSessionCode() {
    return 'SES-' + crypto.randomBytes(6).toString('hex').toUpperCase();
  },

  async registerDevice(userId, { deviceName, deviceCode, operatingSystem }) {
    let code = deviceCode;
    if (!code) {
      // Find unused code
      let exists = true;
      while (exists) {
        code = this.generateDeviceCode();
        const found = await DeviceModel.findByCode(code);
        if (!found) exists = false;
      }
    }

    return await DeviceModel.registerOrUpdate({
      userId,
      deviceName: deviceName || 'Windows Workstation',
      deviceCode: code,
      operatingSystem: operatingSystem || 'Windows 11',
      status: 'online'
    });
  }
};

export default DeviceService;
