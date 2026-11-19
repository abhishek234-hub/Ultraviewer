import { z } from 'zod';

export const createSessionSchema = z.object({
  hostCode: z.string().min(5),
  clientCode: z.string().min(5),
  permissions: z.object({
    mouseKeyboard: z.boolean().default(true),
    fileTransfer: z.boolean().default(true),
    clipboard: z.boolean().default(true),
    audio: z.boolean().default(false)
  }).optional()
});

export const updatePermissionSchema = z.object({
  permissionType: z.string().min(2),
  isAllowed: z.boolean()
});
