import FileTransferModel from '../models/fileTransferModel.js';
import SessionModel from '../models/sessionModel.js';

export const FileController = {
  async registerTransfer(req, res, next) {
    try {
      const { sessionCode, fileName, fileSize } = req.body;

      if (!sessionCode || !fileName || !fileSize) {
        return res.status(400).json({
          success: false,
          message: 'sessionCode, fileName and fileSize are required.'
        });
      }

      // Sanitize file name to prevent directory traversal
      const sanitizedName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');

      const session = await SessionModel.findByCode(sessionCode);
      if (!session) {
        return res.status(404).json({
          success: false,
          message: 'Session not found.'
        });
      }

      const transfer = await FileTransferModel.createFileTransfer(
        session.id,
        sanitizedName,
        fileSize,
        'pending'
      );

      return res.status(201).json({
        success: true,
        message: 'File transfer logged.',
        data: { transfer }
      });
    } catch (err) {
      next(err);
    }
  },

  async updateTransferStatus(req, res, next) {
    try {
      const id = parseInt(req.params.id, 10);
      const { status } = req.body;

      const validStatuses = ['pending', 'in_progress', 'completed', 'cancelled', 'failed'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid transfer status.'
        });
      }

      await FileTransferModel.updateStatus(id, status);
      const updated = await FileTransferModel.findById(id);

      return res.status(200).json({
        success: true,
        message: 'Status updated.',
        data: { transfer: updated }
      });
    } catch (err) {
      next(err);
    }
  },

  async getSessionTransfers(req, res, next) {
    try {
      const { code } = req.params;
      const session = await SessionModel.findByCode(code);
      if (!session) {
        return res.status(404).json({
          success: false,
          message: 'Session not found.'
        });
      }

      const transfers = await FileTransferModel.getTransfersBySession(session.id);
      return res.status(200).json({
        success: true,
        data: { transfers }
      });
    } catch (err) {
      next(err);
    }
  }
};

export default FileController;
