import bcrypt from 'bcryptjs';
import AuthModel from '../models/authModel.js';
import JwtService from '../services/jwtService.js';
import ConnectionLogModel from '../models/connectionLogModel.js';
import { registerSchema, loginSchema, updateProfileSchema } from '../validators/authValidator.js';

export const AuthController = {
  async register(req, res, next) {
    try {
      const parsed = registerSchema.parse(req.body);

      const existing = await AuthModel.findByEmail(parsed.email);
      if (existing) {
        return res.status(409).json({
          success: false,
          message: 'An account with this email address already exists.'
        });
      }

      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(parsed.password, salt);

      const user = await AuthModel.createUser(parsed.name, parsed.email, passwordHash);
      const token = JwtService.sign({ userId: user.id, email: user.email });

      await ConnectionLogModel.log({
        userId: user.id,
        action: 'USER_REGISTERED',
        ipAddress: req.ip
      });

      return res.status(201).json({
        success: true,
        message: 'Account registered successfully.',
        data: {
          user,
          token
        }
      });
    } catch (err) {
      next(err);
    }
  },

  async login(req, res, next) {
    try {
      const parsed = loginSchema.parse(req.body);

      const user = await AuthModel.findByEmail(parsed.email);
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password.'
        });
      }

      const isMatch = await bcrypt.compare(parsed.password, user.password_hash);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password.'
        });
      }

      const token = JwtService.sign({ userId: user.id, email: user.email });

      await ConnectionLogModel.log({
        userId: user.id,
        action: 'USER_LOGIN',
        ipAddress: req.ip
      });

      return res.status(200).json({
        success: true,
        message: 'Logged in successfully.',
        data: {
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            created_at: user.created_at
          },
          token
        }
      });
    } catch (err) {
      next(err);
    }
  },

  async me(req, res) {
    return res.status(200).json({
      success: true,
      data: {
        user: req.user
      }
    });
  },

  async logout(req, res) {
    if (req.user) {
      await ConnectionLogModel.log({
        userId: req.user.id,
        action: 'USER_LOGOUT',
        ipAddress: req.ip
      });
    }
    return res.status(200).json({
      success: true,
      message: 'Logged out successfully.'
    });
  },

  async updateProfile(req, res, next) {
    try {
      const parsed = updateProfileSchema.parse(req.body);

      if (parsed.name) {
        await AuthModel.updateProfile(req.user.id, parsed.name);
      }

      if (parsed.newPassword) {
        if (!parsed.currentPassword) {
          return res.status(400).json({
            success: false,
            message: 'Current password is required to set a new password.'
          });
        }

        const userRecord = await AuthModel.findByEmail(req.user.email);
        const isMatch = await bcrypt.compare(parsed.currentPassword, userRecord.password_hash);
        if (!isMatch) {
          return res.status(400).json({
            success: false,
            message: 'Current password does not match.'
          });
        }

        const salt = await bcrypt.genSalt(10);
        const newHash = await bcrypt.hash(parsed.newPassword, salt);
        await AuthModel.updatePassword(req.user.id, newHash);
      }

      const updatedUser = await AuthModel.findById(req.user.id);
      return res.status(200).json({
        success: true,
        message: 'Profile updated successfully.',
        data: { user: updatedUser }
      });
    } catch (err) {
      next(err);
    }
  },

  async getSettings(req, res, next) {
    try {
      const settings = await AuthModel.getSettings(req.user.id);
      return res.status(200).json({
        success: true,
        data: {
          settings: settings || {
            displayQuality: 'balanced',
            resolution: 'native',
            enableAudio: false,
            enableRecording: false,
            turnPreference: 'auto',
            enableUnattended: false
          }
        }
      });
    } catch (err) {
      next(err);
    }
  },

  async updateSettings(req, res, next) {
    try {
      const settings = req.body;
      await AuthModel.updateSettings(req.user.id, settings);
      return res.status(200).json({
        success: true,
        message: 'Settings saved to database successfully.',
        data: { settings }
      });
    } catch (err) {
      next(err);
    }
  }
};

export default AuthController;
