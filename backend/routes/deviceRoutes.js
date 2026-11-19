import { Router } from 'express';
import DeviceController from '../controllers/deviceController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = Router();

// Device registration can be called authenticated or during desktop boot
router.post('/register', (req, res, next) => {
  // Optional auth
  if (req.headers.authorization) {
    return authenticate(req, res, next);
  }
  next();
}, DeviceController.register);

router.get('/', authenticate, DeviceController.getAll);
router.get('/trusted', authenticate, DeviceController.getTrusted);
router.post('/trusted/:id', authenticate, DeviceController.addTrusted);
router.delete('/trusted/:id', authenticate, DeviceController.removeTrusted);
router.get('/lookup/:code', DeviceController.lookupByCode);
router.get('/:id', authenticate, DeviceController.getById);
router.delete('/:id', authenticate, DeviceController.delete);

export default router;
