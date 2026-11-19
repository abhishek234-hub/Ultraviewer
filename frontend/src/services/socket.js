import { io } from 'socket.io-client';

function getSanitizedServerUrl() {
  let url = import.meta.env.VITE_SOCKET_SERVER_URL || 'http://localhost:5050';
  // Strip trailing /socket or slashes so Socket.IO connects to the root namespace
  url = url.trim().replace(/\/socket\/?$/, '').replace(/\/+$/, '');
  return url;
}

const SOCKET_SERVER_URL = getSanitizedServerUrl();

let socket = null;

export function getSocket() {
  if (!socket) {
    socket = io(SOCKET_SERVER_URL, {
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 25,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      transports: ['websocket', 'polling']
    });

    socket.on('connect', () => {
      console.log('[Socket.IO] Connected successfully to:', SOCKET_SERVER_URL, 'ID:', socket.id);
    });

    socket.on('connect_error', (err) => {
      console.warn('[Socket.IO] Connection error:', err.message);
    });
  }
  return socket;
}

export function connectSocket() {
  const s = getSocket();
  if (!s.connected) {
    s.connect();
  }
  return s;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
  }
}

export default {
  getSocket,
  connectSocket,
  disconnectSocket
};
