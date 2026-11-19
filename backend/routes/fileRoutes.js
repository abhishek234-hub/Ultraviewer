import { Router } from 'express';
import FileController from '../controllers/fileController.js';

const router = Router();

router.post('/transfer', FileController.registerTransfer);
router.put('/transfer/:id/status', FileController.updateTransferStatus);
router.get('/session/:code', FileController.getSessionTransfers);

export default router;
