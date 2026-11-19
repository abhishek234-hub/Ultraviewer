import crypto from 'crypto';
import dotenv from 'dotenv';
dotenv.config();

export const TurnService = {
  getIceServers(username = 'remotex_user') {
    const stunServer = process.env.STUN_SERVER || 'stun:stun.l.google.com:19302';
    const turnServerUrl = process.env.TURN_SERVER || 'turn:localhost:3478';
    const turnSecret = process.env.TURN_CREDENTIAL || 'remotex_secret_turn_pass';

    // Generate temporary HMAC-SHA1 TURN credentials valid for 24 hours (RFC 5766 REST API format)
    const timestamp = Math.floor(Date.now() / 1000) + 24 * 3600;
    const ephemeralUser = `${timestamp}:${username}`;
    const hmac = crypto.createHmac('sha1', turnSecret);
    hmac.update(ephemeralUser);
    const ephemeralPassword = hmac.digest('base64');

    return [
      {
        urls: [
          stunServer,
          'stun:stun1.l.google.com:19302',
          'stun:stun2.l.google.com:19302'
        ]
      },
      {
        urls: [
          turnServerUrl,
          turnServerUrl + '?transport=udp',
          turnServerUrl + '?transport=tcp'
        ],
        username: ephemeralUser,
        credential: ephemeralPassword
      }
    ];
  }
};

export default TurnService;
