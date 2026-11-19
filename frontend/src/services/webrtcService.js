import { getSocket } from './socket.js';

class WebRTCService {
  constructor() {
    this.peerConnection = null;
    this.localStream = null;
    this.remoteStream = null;
    this.sessionCode = null;
    this.isHost = false;

    // DataChannels
    this.inputChannel = null;
    this.chatChannel = null;
    this.fileChannel = null;

    // Event callbacks
    this.onRemoteStreamCallback = null;
    this.onConnectionStateCallback = null;
    this.onChatMessageCallback = null;
    this.onFileInputCallback = null;
    this.onFileProgressCallback = null;
  }

  async initializePeerConnection(iceServers = []) {
    const defaultIceServers = [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ];

    const config = {
      iceServers: iceServers.length > 0 ? iceServers : defaultIceServers,
      iceCandidatePoolSize: 10
    };

    this.peerConnection = new RTCPeerConnection(config);

    // ICE Candidate handler
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate && this.sessionCode) {
        const socket = getSocket();
        socket.emit('webrtc_ice_candidate', {
          sessionCode: this.sessionCode,
          candidate: event.candidate
        });
      }
    };

    // Connection state changes
    this.peerConnection.onconnectionstatechange = () => {
      console.log(`[WebRTC] Connection state: ${this.peerConnection.connectionState}`);
      if (this.onConnectionStateCallback) {
        this.onConnectionStateCallback(this.peerConnection.connectionState);
      }
    };

    // Remote track handler (Client receives Host stream)
    this.peerConnection.ontrack = (event) => {
      console.log('[WebRTC] Received remote stream track:', event.track.kind);
      this.remoteStream = event.streams[0];
      if (this.onRemoteStreamCallback) {
        this.onRemoteStreamCallback(this.remoteStream);
      }
    };

    // DataChannel listener for incoming peer channels
    this.peerConnection.ondatachannel = (event) => {
      const channel = event.channel;
      this.setupDataChannelEvents(channel);
    };

    return this.peerConnection;
  }

  setupDataChannelEvents(channel) {
    if (channel.label === 'input') {
      this.inputChannel = channel;
      this.inputChannel.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          if (this.onFileInputCallback) this.onFileInputCallback(data);
        } catch (err) {}
      };
    } else if (channel.label === 'chat') {
      this.chatChannel = channel;
      this.chatChannel.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data);
          if (this.onChatMessageCallback) this.onChatMessageCallback(msg);
        } catch (err) {}
      };
    } else if (channel.label === 'file') {
      this.fileChannel = channel;
      this.fileChannel.binaryType = 'arraybuffer';
      this.fileChannel.onmessage = (e) => {
        if (this.onFileProgressCallback) this.onFileProgressCallback(e.data);
      };
    }
  }

  // Host captures local screen stream
  async startScreenCapture(sourceId = null) {
    try {
      let stream;
      if (window.remotexApi?.isElectron) {
        const sources = await window.remotexApi.getScreenSources();
        const selected = sourceId ? sources.find(s => s.id === sourceId) : sources[0];
        const screenSourceId = selected ? selected.id : sources[0]?.id;

        stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: {
            mandatory: {
              chromeMediaSource: 'desktop',
              chromeMediaSourceId: screenSourceId,
              minWidth: 1280,
              maxWidth: 1920,
              minHeight: 720,
              maxHeight: 1080,
              maxFrameRate: 60
            }
          }
        });
      } else {
        // Browser fallback / test mode
        stream = await navigator.mediaDevices.getDisplayMedia({
          video: { frameRate: 60 },
          audio: false
        });
      }

      this.localStream = stream;

      // Add tracks to PeerConnection
      if (this.peerConnection) {
        stream.getTracks().forEach((track) => {
          this.peerConnection.addTrack(track, stream);
        });
      }

      return stream;
    } catch (err) {
      console.error('[WebRTC] Screen capture failed:', err);
      throw err;
    }
  }

  // Create DataChannels on Client or Host
  createDataChannels() {
    if (!this.peerConnection) return;

    // High speed input channel (unreliable, unordered for max mouse speed)
    this.inputChannel = this.peerConnection.createDataChannel('input', {
      ordered: false,
      maxRetransmits: 0
    });
    this.setupDataChannelEvents(this.inputChannel);

    // Reliable chat channel
    this.chatChannel = this.peerConnection.createDataChannel('chat', {
      ordered: true
    });
    this.setupDataChannelEvents(this.chatChannel);

    // Reliable chunked file channel
    this.fileChannel = this.peerConnection.createDataChannel('file', {
      ordered: true
    });
    this.setupDataChannelEvents(this.fileChannel);
  }

  async createOffer(sessionCode) {
    this.sessionCode = sessionCode;
    this.createDataChannels();

    const offer = await this.peerConnection.createOffer({
      offerToReceiveVideo: true,
      offerToReceiveAudio: false
    });
    await this.peerConnection.setLocalDescription(offer);

    const socket = getSocket();
    socket.emit('webrtc_offer', {
      sessionCode,
      sdp: offer
    });

    return offer;
  }

  async handleOffer(sessionCode, offerSdp) {
    this.sessionCode = sessionCode;
    await this.peerConnection.setRemoteDescription(new RTCSessionDescription(offerSdp));

    const answer = await this.peerConnection.createAnswer();
    await this.peerConnection.setLocalDescription(answer);

    const socket = getSocket();
    socket.emit('webrtc_answer', {
      sessionCode,
      sdp: answer
    });

    return answer;
  }

  async handleAnswer(answerSdp) {
    await this.peerConnection.setRemoteDescription(new RTCSessionDescription(answerSdp));
  }

  async handleCandidate(candidate) {
    if (this.peerConnection && candidate) {
      try {
        await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.error('[WebRTC] Error adding ICE candidate:', err);
      }
    }
  }

  sendInput(event) {
    // Try fast DataChannel first
    if (this.inputChannel && this.inputChannel.readyState === 'open') {
      this.inputChannel.send(JSON.stringify(event));
      return;
    }

    // Fallback to Socket.IO signaling relay
    const socket = getSocket();
    if (socket && this.sessionCode) {
      socket.emit('remote_input', {
        sessionCode: this.sessionCode,
        event
      });
    }
  }

  sendChatMessage(message, senderName) {
    const payload = {
      message,
      senderName,
      timestamp: new Date().toISOString()
    };

    if (this.chatChannel && this.chatChannel.readyState === 'open') {
      this.chatChannel.send(JSON.stringify(payload));
    }

    // Also notify via Socket.IO so host/client UI syncs
    const socket = getSocket();
    if (socket && this.sessionCode) {
      socket.emit('chat_message', {
        sessionCode: this.sessionCode,
        message,
        senderName
      });
    }
  }

  close() {
    if (this.localStream) {
      this.localStream.getTracks().forEach(t => t.stop());
      this.localStream = null;
    }

    if (this.remoteStream) {
      this.remoteStream.getTracks().forEach(t => t.stop());
      this.remoteStream = null;
    }

    if (this.inputChannel) {
      this.inputChannel.close();
      this.inputChannel = null;
    }
    if (this.chatChannel) {
      this.chatChannel.close();
      this.chatChannel = null;
    }
    if (this.fileChannel) {
      this.fileChannel.close();
      this.fileChannel = null;
    }

    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }

    this.sessionCode = null;
    console.log('[WebRTC] PeerConnection completely cleaned up.');
  }
}

export const webrtcService = new WebRTCService();
export default webrtcService;
