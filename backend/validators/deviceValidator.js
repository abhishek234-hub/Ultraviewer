import { z } from 'zod';

export const registerDeviceSchema = z.object({
  deviceName: z.string().min(1, 'Device name is required').max(100),
  deviceCode: z.string().min(5, 'Valid device code required').max(64),
  operatingSystem: z.string().default('Windows 11'),
  status: z.enum(['online', 'offline', 'busy']).default('online')
});

export const updateDeviceStatusSchema = z.object({
  deviceCode: z.string().min(5),
  status: z.enum(['online', 'offline', 'busy'])
});
