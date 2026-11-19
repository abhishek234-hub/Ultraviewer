import JwtService from '../services/jwtService.js';
import AuthModel from '../models/authModel.js';

export async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Authentication token missing or invalid.'
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = JwtService.verify(token);

    if (!decoded || !decoded.userId) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired session token.'
      });
    }

    const user = await AuthModel.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User account not found.'
      });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error('[Auth Middleware Error]:', err.message);
    return res.status(401).json({
      success: false,
      message: 'Unauthorized access.'
    });
  }
}

export default authenticate;
