import { Router } from 'express';
import SessionController from '../controllers/sessionController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = Router();

router.post('/', (req, res, next) => {
  if (req.headers.authorization) {
    return authenticate(req, res, next);
  }
  next();
}, SessionController.create);

router.get('/recent', authenticate, SessionController.getRecent);
router.get('/ice-servers', SessionController.getIceServers);
router.get('/:code', SessionController.getByCode);
router.put('/:code/permissions', SessionController.updatePermission);

export default router;
