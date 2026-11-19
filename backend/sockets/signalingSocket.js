import DeviceModel from '../models/deviceModel.js';
import SessionModel from '../models/sessionModel.js';
import PermissionModel from '../models/permissionModel.js';
import ConnectionLogModel from '../models/connectionLogModel.js';
import TurnService from '../services/turnService.js';
import crypto from 'crypto';

// In-memory mapping of active devices: deviceCode -> { socketId, deviceName, userId }
const activeDevices = new Map();
// Socket to device code mapping: socketId -> deviceCode
const socketToDevice = new Map();
// Active session tracking: sessionCode -> { hostCode, clientCode, hostSocketId, clientSocketId, permissions }
const activeSessions = new Map();

export function setupSignalingSocket(io) {
  io.on('connection', (socket) => {
    console.log(`[Socket] Client connected: ${socket.id}`);

    // 1. Device Registration / Heartbeat
    socket.on('register_device', async (data) => {
      try {
        const { deviceCode, deviceName, userId, os } = data;
        if (!deviceCode) return;

        const cleanCode = deviceCode.trim().toUpperCase();
        activeDevices.set(cleanCode, {
          socketId: socket.id,
          deviceName: deviceName || 'Windows PC',
          userId: userId || null,
          os: os || 'Windows 11',
          connectedAt: new Date()
        });
        socketToDevice.set(socket.id, cleanCode);

        // Update database device status
        await DeviceModel.updateStatus(cleanCode, 'online');

        socket.emit('device_registered', {
          success: true,
          deviceCode: cleanCode,
          status: 'online'
        });

        console.log(`[Socket] Device registered: ${cleanCode} (${deviceName}) on socket ${socket.id}`);
      } catch (err) {
        console.error('[Socket Error] register_device:', err.message);
      }
    });

    // 2. Client initiates connection to Host
    socket.on('connection_request', async (data) => {
      try {
        const { hostCode, clientCode, clientName, permissions } = data;
        const cleanHostCode = hostCode?.trim().toUpperCase();
        const cleanClientCode = clientCode?.trim().toUpperCase();

        if (!cleanHostCode || !cleanClientCode) {
          return socket.emit('connection_error', { message: 'Host and Client codes are required.' });
        }

        if (cleanHostCode === cleanClientCode) {
          return socket.emit('connection_error', { message: 'Cannot establish remote connection to the same device.' });
        }

        const hostDevice = activeDevices.get(cleanHostCode);
        if (!hostDevice) {
          return socket.emit('connection_error', {
            message: `RemoteX host [${cleanHostCode}] is currently offline or unreachable.`
          });
        }

        // Check if host is in an active session
        let isHostBusy = false;
        for (const [_, sess] of activeSessions) {
          if (sess.hostCode === cleanHostCode || sess.clientCode === cleanHostCode) {
            isHostBusy = true;
            break;
          }
        }
        if (isHostBusy) {
          return socket.emit('connection_error', {
            message: `RemoteX host [${cleanHostCode}] is currently in another remote session.`
          });
        }

        const requestId = 'REQ-' + crypto.randomBytes(4).toString('hex').toUpperCase();

        // Relay connection request to Host
        io.to(hostDevice.socketId).emit('incoming_connection', {
          requestId,
          clientCode: cleanClientCode,
          clientName: clientName || 'Remote Client',
          permissions: permissions || {
            mouseKeyboard: true,
            fileTransfer: true,
            clipboard: true,
            audio: false
          }
        });

        socket.emit('connection_pending', {
          message: `Connection request sent to ${cleanHostCode}. Awaiting host approval...`,
          requestId
        });

        console.log(`[Socket] Connection requested: ${cleanClientCode} -> ${cleanHostCode}`);
      } catch (err) {
        console.error('[Socket Error] connection_request:', err.message);
        socket.emit('connection_error', { message: 'Internal error processing connection request.' });
      }
    });

    // 3. Host approves or rejects incoming connection
    socket.on('connection_response', async (data) => {
      try {
        const { requestId, clientCode, accepted, permissions, rejectionReason } = data;
        const hostCode = socketToDevice.get(socket.id);
        const cleanClientCode = clientCode?.trim().toUpperCase();

        const clientDevice = activeDevices.get(cleanClientCode);
        if (!clientDevice) {
          return socket.emit('connection_error', { message: 'Connecting client disconnected.' });
        }

        if (!accepted) {
          io.to(clientDevice.socketId).emit('connection_rejected', {
            hostCode,
            reason: rejectionReason || 'The remote host declined the connection request.'
          });
          console.log(`[Socket] Connection rejected by host ${hostCode} for client ${cleanClientCode}`);
          return;
        }

        // Generate session code
        const sessionCode = 'SES-' + crypto.randomBytes(6).toString('hex').toUpperCase();

        // Get DB IDs
        const hostDb = await DeviceModel.findByCode(hostCode);
        const clientDb = await DeviceModel.findByCode(cleanClientCode);

        let sessionId = null;
        if (hostDb && clientDb) {
          const sess = await SessionModel.createSession(sessionCode, hostDb.id, clientDb.id, 'active');
          sessionId = sess.id;
          await PermissionModel.initializeDefaultPermissions(sessionId, permissions);

          await ConnectionLogModel.log({
            sessionId,
            userId: clientDb.user_id || hostDb.user_id,
            action: 'SESSION_CONNECTED',
            ipAddress: socket.handshake.address
          });
        }

        const sessionRoom = `session_${sessionCode}`;
        socket.join(sessionRoom);
        const clientSocket = io.sockets.sockets.get(clientDevice.socketId);
        if (clientSocket) {
          clientSocket.join(sessionRoom);
        }

        const defaultPermissions = {
          mouseKeyboard: permissions?.mouseKeyboard ?? true,
          fileTransfer: permissions?.fileTransfer ?? true,
          clipboard: permissions?.clipboard ?? true,
          audio: permissions?.audio ?? false
        };

        activeSessions.set(sessionCode, {
          sessionId,
          sessionCode,
          hostCode,
          clientCode: cleanClientCode,
          hostSocketId: socket.id,
          clientSocketId: clientDevice.socketId,
          permissions: defaultPermissions
        });

        const iceServers = TurnService.getIceServers(clientCode);

        // Notify both parties of session establishment
        io.to(sessionRoom).emit('session_established', {
          sessionCode,
          hostCode,
          clientCode: cleanClientCode,
          permissions: defaultPermissions,
          iceServers
        });

        console.log(`[Socket] Session established: ${sessionCode} between Host [${hostCode}] and Client [${cleanClientCode}]`);
      } catch (err) {
        console.error('[Socket Error] connection_response:', err.message);
      }
    });

    // 4. WebRTC Signaling: Offer
    socket.on('webrtc_offer', (data) => {
      const { sessionCode, sdp } = data;
      const session = activeSessions.get(sessionCode);
      if (!session) return;

      const targetSocketId = socket.id === session.hostSocketId ? session.clientSocketId : session.hostSocketId;
      io.to(targetSocketId).emit('webrtc_offer', { sessionCode, sdp });
    });

    // 5. WebRTC Signaling: Answer
    socket.on('webrtc_answer', (data) => {
      const { sessionCode, sdp } = data;
      const session = activeSessions.get(sessionCode);
      if (!session) return;

      const targetSocketId = socket.id === session.hostSocketId ? session.clientSocketId : session.hostSocketId;
      io.to(targetSocketId).emit('webrtc_answer', { sessionCode, sdp });
    });

    // 6. WebRTC Signaling: ICE Candidate
    socket.on('webrtc_ice_candidate', (data) => {
      const { sessionCode, candidate } = data;
      const session = activeSessions.get(sessionCode);
      if (!session) return;

      const targetSocketId = socket.id === session.hostSocketId ? session.clientSocketId : session.hostSocketId;
      io.to(targetSocketId).emit('webrtc_ice_candidate', { sessionCode, candidate });
    });

    // 7. Remote Input Simulation Relay
    socket.on('remote_input', (data) => {
      const { sessionCode, event } = data;
      const session = activeSessions.get(sessionCode);
      if (!session) return;

      // Verify mouse/keyboard permission is granted
      if (!session.permissions?.mouseKeyboard) {
        return;
      }

      // Forward input directly to host socket to dispatch to native helper
      io.to(session.hostSocketId).emit('execute_remote_input', {
        sessionCode,
        event
      });
    });

    // 8. Session Permission Change (Host can toggle permissions in real time)
    socket.on('update_session_permission', async (data) => {
      const { sessionCode, permissionType, isAllowed } = data;
      const session = activeSessions.get(sessionCode);
      if (!session || socket.id !== session.hostSocketId) return;

      session.permissions[permissionType] = isAllowed;
      if (session.sessionId) {
        await PermissionModel.setPermission(session.sessionId, permissionType, isAllowed);
      }

      io.to(`session_${sessionCode}`).emit('session_permission_changed', {
        sessionCode,
        permissionType,
        isAllowed,
        permissions: session.permissions
      });
      console.log(`[Socket] Permission updated for ${sessionCode}: ${permissionType} -> ${isAllowed}`);
    });

    // 9. Real-Time Chat Message Relay
    socket.on('chat_message', (data) => {
      const { sessionCode, message, senderName } = data;
      const session = activeSessions.get(sessionCode);
      if (!session) return;

      const chatPayload = {
        sessionCode,
        senderName: senderName || 'Remote User',
        senderSocketId: socket.id,
        isHost: socket.id === session.hostSocketId,
        message,
        timestamp: new Date().toISOString()
      };

      io.to(`session_${sessionCode}`).emit('chat_message', chatPayload);
    });

    // 10. Clipboard Synchronization Relay
    socket.on('clipboard_sync', (data) => {
      const { sessionCode, text } = data;
      const session = activeSessions.get(sessionCode);
      if (!session || !session.permissions?.clipboard) return;

      const targetSocketId = socket.id === session.hostSocketId ? session.clientSocketId : session.hostSocketId;
      io.to(targetSocketId).emit('clipboard_sync', {
        sessionCode,
        text
      });
    });

    // 11. End Session
    socket.on('end_session', async (data) => {
      const { sessionCode } = data;
      await closeSession(io, sessionCode, 'Session ended by participant');
    });

    // 12. Socket Disconnect
    socket.on('disconnect', async () => {
      const deviceCode = socketToDevice.get(socket.id);
      if (deviceCode) {
        activeDevices.delete(deviceCode);
        socketToDevice.delete(socket.id);
        await DeviceModel.updateStatus(deviceCode, 'offline');
        console.log(`[Socket] Device offline: ${deviceCode}`);
      }

      // Check if this socket was in an active session
      for (const [code, sess] of activeSessions) {
        if (sess.hostSocketId === socket.id || sess.clientSocketId === socket.id) {
          await closeSession(io, code, 'Remote participant disconnected');
        }
      }
    });
  });
}

async function closeSession(io, sessionCode, reason = 'Session closed') {
  const session = activeSessions.get(sessionCode);
  if (!session) return;

  activeSessions.delete(sessionCode);

  try {
    if (session.sessionId) {
      await SessionModel.updateStatus(sessionCode, 'ended', true);
    }
  } catch (e) {
    console.error('[Socket Error] closeSession updateStatus:', e.message);
  }

  io.to(`session_${sessionCode}`).emit('session_closed', {
    sessionCode,
    reason
  });

  console.log(`[Socket] Session ended: ${sessionCode} (${reason})`);
}

export default setupSignalingSocket;
