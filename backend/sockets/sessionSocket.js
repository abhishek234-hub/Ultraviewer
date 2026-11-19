export function setupSessionSocket(io) {
  const sessionNamespace = io.of('/sessions');

  sessionNamespace.on('connection', (socket) => {
    // Ping / latency measurement
    socket.on('latency_ping', (timestamp) => {
      socket.emit('latency_pong', timestamp);
    });

    // File chunk progression event
    socket.on('file_progress', (data) => {
      const { sessionCode, transferId, bytesTransferred, totalBytes } = data;
      socket.to(`session_${sessionCode}`).emit('file_progress', {
        transferId,
        bytesTransferred,
        totalBytes,
        percent: Math.round((bytesTransferred / totalBytes) * 100)
      });
    });
  });
}

export default setupSessionSocket;
