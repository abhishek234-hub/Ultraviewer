import http from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import app from './app.js';
import { setupSignalingSocket } from './sockets/signalingSocket.js';
import { setupSessionSocket } from './sockets/sessionSocket.js';
import { testConnection } from './config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, './.env') });

const PORT = parseInt(process.env.PORT || '5050', 10);

const server = http.createServer(app);

// Initialize Socket.IO with WebRTC signaling support
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  },
  pingTimeout: 30000,
  pingInterval: 10000,
  transports: ['websocket', 'polling']
});

// Setup socket namespaces & event handlers
setupSignalingSocket(io);
setupSessionSocket(io);

// Attach /socket namespace alias so clients connecting to /socket are also supported
const socketNs = io.of('/socket');
setupSignalingSocket(socketNs);
setupSessionSocket(socketNs);

async function startServer() {
  try {
    const isDbConnected = await testConnection();
    if (!isDbConnected) {
      console.warn('[RemoteX Backend] Warning: Database connection test failed. Ensure MySQL 8 is running.');
    } else {
      console.log('[RemoteX Backend] MySQL Database connection verified successfully.');
    }

    server.listen(PORT, '0.0.0.0', () => {
      console.log(`[RemoteX Server] Running on http://localhost:${PORT}`);
      console.log(`[RemoteX Server] WebRTC Signaling Socket.IO active`);
    });
  } catch (err) {
    console.error('[RemoteX Server Fatal Error]:', err);
    process.exit(1);
  }
}

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('[RemoteX Server] Received SIGTERM, shutting down gracefully...');
  server.close(() => process.exit(0));
});

process.on('SIGINT', () => {
  console.log('[RemoteX Server] Received SIGINT, shutting down gracefully...');
  server.close(() => process.exit(0));
});

startServer();

export { app, server, io };
