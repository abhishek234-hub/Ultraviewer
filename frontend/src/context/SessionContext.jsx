import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSocket } from '../services/socket';
import webrtcService from '../services/webrtcService';
import { useDevice } from './DeviceContext';

const SessionContext = createContext(null);

export function SessionProvider({ children }) {
  const { deviceCode, deviceName } = useDevice();
  const navigate = useNavigate();
  const connectionTimeoutRef = useRef(null);

  const [activeSession, setActiveSession] = useState(null);
  const [isHost, setIsHost] = useState(false);
  const [remoteStream, setRemoteStream] = useState(null);
  const [sessionPermissions, setSessionPermissions] = useState({
    mouseKeyboard: true,
    fileTransfer: true,
    clipboard: true,
    audio: false
  });

  const [incomingRequest, setIncomingRequest] = useState(null);
  const [connectingState, setConnectingState] = useState(null); // 'connecting' | 'awaiting_approval' | 'negotiating' | null
  const [chatMessages, setChatMessages] = useState([]);
  const [connectionQuality, setConnectionQuality] = useState('Excellent');

  useEffect(() => {
    const socket = getSocket();

    // 1. Incoming Connection Request (Host receives this)
    const onIncomingConnection = (data) => {
      console.log('[SessionContext] Received incoming connection request:', data);
      setIncomingRequest(data);
    };

    // 2. Client awaiting host approval
    const onConnectionPending = (data) => {
      setConnectingState({
        status: 'awaiting_approval',
        message: data.message
      });
    };

    // 3. Client connection rejected
    const onConnectionRejected = (data) => {
      if (connectionTimeoutRef.current) clearTimeout(connectionTimeoutRef.current);
      setConnectingState(null);
      alert(`Connection Request Rejected: ${data.reason}`);
    };

    // 3b. Client connection error
    const onConnectionError = (data) => {
      console.warn('[SessionContext] Connection error:', data);
      if (connectionTimeoutRef.current) clearTimeout(connectionTimeoutRef.current);
      setConnectingState(null);
      alert(data.message || 'Unable to connect to remote partner.');
    };

    // 4. Session Established (Both Host and Client)
    const onSessionEstablished = async (data) => {
      console.log('[SessionContext] Session established:', data);
      if (connectionTimeoutRef.current) clearTimeout(connectionTimeoutRef.current);
      
      const myNorm = (deviceCode || '').toString().trim().toUpperCase().replace(/^RX-?/i, '').replace(/[^0-9A-Z]/g, '');
      const hostNorm = (data.hostCode || '').toString().trim().toUpperCase().replace(/^RX-?/i, '').replace(/[^0-9A-Z]/g, '');
      const isCurrentHost = (data.hostCode === deviceCode) || (myNorm === hostNorm);

      setIsHost(isCurrentHost);
      setActiveSession(data);
      setSessionPermissions(data.permissions || {
        mouseKeyboard: true,
        fileTransfer: true,
        clipboard: true,
        audio: false
      });
      setConnectingState(null);
      setIncomingRequest(null);

      // Initialize WebRTC
      try {
        await webrtcService.initializePeerConnection(data.iceServers, data.sessionCode);

        webrtcService.onRemoteStreamCallback = (stream) => {
          console.log('[SessionContext] Remote screen stream received, tracks:', stream.getTracks().length);
          setRemoteStream(stream);
        };

        webrtcService.onConnectionStateCallback = (state) => {
          if (state === 'connected') setConnectionQuality('Excellent');
          if (state === 'disconnected' || state === 'failed') setConnectionQuality('Reconnecting...');
        };

        webrtcService.onChatMessageCallback = (msg) => {
          setChatMessages((prev) => [...prev, msg]);
        };

        if (isCurrentHost) {
          // Host captures its screen and sends offer to client
          try {
            const stream = await webrtcService.startScreenCapture();
            setRemoteStream(stream);
            await webrtcService.createOffer(data.sessionCode);
            console.log('[SessionContext] Host screen offer dispatched successfully.');
          } catch (captureErr) {
            console.error('[SessionContext] Host screen capture failed:', captureErr);
            alert(`Host screen capture error: ${captureErr.message || captureErr}`);
          }
        } else {
          // Client navigates to active session view to view remote screen
          navigate('/session');
        }
      } catch (err) {
        console.error('[SessionContext] WebRTC startup error:', err);
      }
    };

    // 5. WebRTC Signaling Relays
    const onWebRTCOffer = async (data) => {
      try {
        await webrtcService.handleOffer(data.sessionCode, data.sdp);
      } catch (err) {
        console.error('[SessionContext] WebRTC handleOffer error:', err);
      }
    };

    const onWebRTCAnswer = async (data) => {
      try {
        await webrtcService.handleAnswer(data.sdp);
      } catch (err) {
        console.error('[SessionContext] WebRTC handleAnswer error:', err);
      }
    };

    const onWebRTCIceCandidate = async (data) => {
      try {
        await webrtcService.handleCandidate(data.candidate);
      } catch (err) {
        console.error('[SessionContext] WebRTC handleCandidate error:', err);
      }
    };

    // 6. Execute Remote Input (Host only)
    const onExecuteRemoteInput = (data) => {
      if (window.remotexApi?.isElectron) {
        window.remotexApi.executeRemoteInput(data.event);
      }
    };

    // 7. Chat Message received
    const onChatMessage = (msg) => {
      setChatMessages((prev) => [...prev, msg]);
    };

    // 8. Clipboard Sync
    const onClipboardSync = (data) => {
      if (data.text) {
        navigator.clipboard.writeText(data.text).catch(() => {});
      }
    };

    // 9. Session Permission Changed
    const onPermissionChanged = (data) => {
      setSessionPermissions(data.permissions);
    };

    // 10. Session Closed
    const onSessionClosed = (data) => {
      webrtcService.close();
      if (window.remotexApi?.isElectron) {
        window.remotexApi.resetInput();
      }
      setActiveSession(null);
      setRemoteStream(null);
      setConnectingState(null);
      setChatMessages([]);
      navigate('/dashboard');
      alert(`Session closed: ${data.reason}`);
    };

    socket.on('incoming_connection', onIncomingConnection);
    socket.on('connection_pending', onConnectionPending);
    socket.on('connection_rejected', onConnectionRejected);
    socket.on('connection_error', onConnectionError);
    socket.on('session_established', onSessionEstablished);
    socket.on('webrtc_offer', onWebRTCOffer);
    socket.on('webrtc_answer', onWebRTCAnswer);
    socket.on('webrtc_ice_candidate', onWebRTCIceCandidate);
    socket.on('execute_remote_input', onExecuteRemoteInput);
    socket.on('chat_message', onChatMessage);
    socket.on('clipboard_sync', onClipboardSync);
    socket.on('session_permission_changed', onPermissionChanged);
    socket.on('session_closed', onSessionClosed);

    return () => {
      socket.off('incoming_connection', onIncomingConnection);
      socket.off('connection_pending', onConnectionPending);
      socket.off('connection_rejected', onConnectionRejected);
      socket.off('connection_error', onConnectionError);
      socket.off('session_established', onSessionEstablished);
      socket.off('webrtc_offer', onWebRTCOffer);
      socket.off('webrtc_answer', onWebRTCAnswer);
      socket.off('webrtc_ice_candidate', onWebRTCIceCandidate);
      socket.off('execute_remote_input', onExecuteRemoteInput);
      socket.off('chat_message', onChatMessage);
      socket.off('clipboard_sync', onClipboardSync);
      socket.off('session_permission_changed', onPermissionChanged);
      socket.off('session_closed', onSessionClosed);
    };
  }, [deviceCode, navigate]);

  // Client connects to remote Host
  const connectToRemote = (targetRemoteCode, partnerPassword = '', permissions) => {
    const socket = getSocket();
    if (!socket.connected) {
      socket.connect();
    }

    const cleanTarget = targetRemoteCode.toString().trim().toUpperCase().replace(/^RX-?/i, '').replace(/[^0-9A-Z]/g, '');
    const cleanClientCode = deviceCode.toString().trim().toUpperCase().replace(/^RX-?/i, '').replace(/[^0-9A-Z]/g, '');

    setConnectingState({
      status: 'connecting',
      message: `Connecting to ${cleanTarget}...`
    });

    if (connectionTimeoutRef.current) clearTimeout(connectionTimeoutRef.current);
    connectionTimeoutRef.current = setTimeout(() => {
      setConnectingState((curr) => {
        if (curr && (curr.status === 'connecting' || curr.status === 'awaiting_approval')) {
          alert(`Connection to [${cleanTarget}] timed out.\n\nPlease verify:\n1. RemoteX is open on your partner's laptop.\n2. Partner device ID is correct: ${cleanTarget}.\n3. Both computers are connected to the internet.`);
          return null;
        }
        return curr;
      });
    }, 20000);

    socket.emit('connection_request', {
      hostCode: cleanTarget,
      clientCode: cleanClientCode,
      clientName: deviceName,
      password: partnerPassword,
      permissions: permissions || {
        mouseKeyboard: true,
        fileTransfer: true,
        clipboard: true,
        audio: false
      }
    });
  };

  // Host approves incoming connection request
  const acceptIncomingConnection = (customPermissions) => {
    if (!incomingRequest) return;
    const socket = getSocket();

    socket.emit('connection_response', {
      requestId: incomingRequest.requestId,
      clientCode: incomingRequest.clientCode,
      accepted: true,
      permissions: customPermissions || incomingRequest.permissions
    });
    setIncomingRequest(null);
  };

  // Host rejects incoming connection request
  const rejectIncomingConnection = (reason = 'Declined by host') => {
    if (!incomingRequest) return;
    const socket = getSocket();

    socket.emit('connection_response', {
      requestId: incomingRequest.requestId,
      clientCode: incomingRequest.clientCode,
      accepted: false,
      rejectionReason: reason
    });
    setIncomingRequest(null);
  };

  // Disconnect active session
  const disconnectSession = () => {
    if (activeSession) {
      const socket = getSocket();
      socket.emit('end_session', { sessionCode: activeSession.sessionCode });
      webrtcService.close();
      if (window.remotexApi?.isElectron) {
        window.remotexApi.resetInput();
      }
      setActiveSession(null);
      setRemoteStream(null);
      navigate('/dashboard');
    }
  };

  // Update permission (Host only)
  const togglePermission = (type, isAllowed) => {
    if (!activeSession || !isHost) return;
    const socket = getSocket();
    socket.emit('update_session_permission', {
      sessionCode: activeSession.sessionCode,
      permissionType: type,
      isAllowed
    });
  };

  // Send Chat Message
  const sendChatMessage = (text) => {
    if (!activeSession || !text.trim()) return;
    webrtcService.sendChatMessage(text.trim(), deviceName);
  };

  return (
    <SessionContext.Provider value={{
      activeSession,
      isHost,
      remoteStream,
      sessionPermissions,
      incomingRequest,
      connectingState,
      chatMessages,
      connectionQuality,
      connectToRemote,
      acceptIncomingConnection,
      rejectIncomingConnection,
      disconnectSession,
      togglePermission,
      sendChatMessage,
      setConnectingState
    }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) throw new Error('useSession must be used within a SessionProvider');
  return context;
}

export default SessionContext;
