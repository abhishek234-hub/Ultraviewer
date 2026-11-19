import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'remotex_super_secure_jwt_secret_token_key_2026_xyz987';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export const JwtService = {
  sign(payload, expiresIn = JWT_EXPIRES_IN) {
    return jwt.sign(payload, JWT_SECRET, { expiresIn });
  },

  verify(token) {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return null;
    }
  }
};

export default JwtService;
