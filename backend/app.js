import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import authRoutes from './routes/authRoutes.js';
import deviceRoutes from './routes/deviceRoutes.js';
import sessionRoutes from './routes/sessionRoutes.js';
import fileRoutes from './routes/fileRoutes.js';
import { apiLimiter } from './middleware/rateLimitMiddleware.js';
import { errorHandler, notFoundHandler } from './middleware/errorMiddleware.js';
import { testConnection } from './config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, './.env') });

const app = express();

// Security Headers
app.use(helmet({
  crossOriginResourcePolicy: false,
  contentSecurityPolicy: false // Allow WebSocket and WebRTC peer negotiation
}));

// Cross-Origin Resource Sharing
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body Parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Apply rate limiter to API routes
app.use('/api', apiLimiter);

// Root status endpoint
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    product: 'RemoteX Backend & WebRTC Signaling Server',
    version: '1.0.0',
    health: '/api/health'
  });
});

// Health check endpoint
app.get('/api/health', async (req, res) => {
  const dbOk = await testConnection();
  res.status(200).json({
    status: 'healthy',
    product: 'RemoteX Remote Desktop API',
    version: '1.0.0',
    database: dbOk ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/devices', deviceRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/files', fileRoutes);

// Fallback handlers
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
