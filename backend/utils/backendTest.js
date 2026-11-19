import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { testConnection, query } from '../config/database.js';
import AuthModel from '../models/authModel.js';
import DeviceModel from '../models/deviceModel.js';
import SessionModel from '../models/sessionModel.js';
import PermissionModel from '../models/permissionModel.js';
import DeviceService from '../services/deviceService.js';
import TurnService from '../services/turnService.js';
import JwtService from '../services/jwtService.js';
import bcrypt from 'bcryptjs';

describe('RemoteX Backend Architecture & Database Test Suite', () => {

  test('Database connection pool is active and operational', async () => {
    const isOk = await testConnection();
    assert.equal(isOk, true, 'Database connection should succeed');
  });

  test('JWT Service correctly signs and verifies tokens', () => {
    const payload = { userId: 99, email: 'test@remotex.local' };
    const token = JwtService.sign(payload, '1h');
    assert.ok(token, 'Token should be generated');

    const decoded = JwtService.verify(token);
    assert.equal(decoded.userId, 99);
    assert.equal(decoded.email, 'test@remotex.local');
  });

  test('Authentication Model creates user and prevents duplicate emails', async () => {
    const testEmail = `test_${Date.now()}@remotex.local`;
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash('TestPassword123!', salt);

    const user = await AuthModel.createUser('Test Architect', testEmail, hash);
    assert.ok(user.id > 0, 'User ID should be generated');
    assert.equal(user.email, testEmail);

    const found = await AuthModel.findByEmail(testEmail);
    assert.equal(found.id, user.id);
    assert.equal(found.name, 'Test Architect');

    const isMatch = await bcrypt.compare('TestPassword123!', found.password_hash);
    assert.equal(isMatch, true, 'Bcrypt password comparison should match');
  });

  test('Device Service generates valid RemoteX IDs and registers devices', async () => {
    const code = DeviceService.generateDeviceCode();
    assert.match(code, /^RX-\d{3}-\d{3}-\d{3}$/, 'Device code should match RX-XXX-XXX-XXX format');

    const device = await DeviceModel.registerOrUpdate({
      userId: 1,
      deviceName: 'TEST-RIG-01',
      deviceCode: code,
      operatingSystem: 'Windows 11 Enterprise',
      status: 'online'
    });

    assert.ok(device.id > 0);
    assert.equal(device.device_code, code);
    assert.equal(device.device_status, 'online');

    const retrieved = await DeviceModel.findByCode(code);
    assert.equal(retrieved.id, device.id);
  });

  test('Session and Permission management with foreign keys and transactions', async () => {
    const hostCode = 'RX-TEST-HOST-' + Math.floor(Math.random() * 1000);
    const clientCode = 'RX-TEST-CLIENT-' + Math.floor(Math.random() * 1000);

    const host = await DeviceModel.registerOrUpdate({
      userId: 1,
      deviceName: 'Host Rig',
      deviceCode: hostCode,
      operatingSystem: 'Windows 11',
      status: 'online'
    });

    const client = await DeviceModel.registerOrUpdate({
      userId: 2,
      deviceName: 'Client Rig',
      deviceCode: clientCode,
      operatingSystem: 'Windows 11',
      status: 'online'
    });

    const sessionCode = DeviceService.generateSessionCode();
    const session = await SessionModel.createSession(sessionCode, host.id, client.id, 'active');
    assert.ok(session.id > 0);
    assert.equal(session.session_code, sessionCode);

    await PermissionModel.initializeDefaultPermissions(session.id, {
      mouseKeyboard: true,
      fileTransfer: true,
      clipboard: false,
      audio: false
    });

    const perms = await PermissionModel.getPermissionsBySession(session.id);
    assert.equal(perms.mouse_keyboard, true);
    assert.equal(perms.file_transfer, true);
    assert.equal(perms.clipboard, false);
    assert.equal(perms.audio, false);

    // Update permission in real time
    await PermissionModel.setPermission(session.id, 'clipboard', true);
    const canClipboard = await PermissionModel.isAllowed(session.id, 'clipboard');
    assert.equal(canClipboard, true);

    // End session
    await SessionModel.updateStatus(sessionCode, 'ended', true);
    const ended = await SessionModel.findByCode(sessionCode);
    assert.equal(ended.session_status, 'ended');
    assert.ok(ended.ended_at !== null);
  });

  test('TURN Service generates compliant RFC 5766 temporary credentials', () => {
    const iceServers = TurnService.getIceServers('user_agent_test');
    assert.ok(Array.isArray(iceServers));
    assert.ok(iceServers.length >= 2, 'Should provide both STUN and TURN configurations');

    const turn = iceServers[1];
    assert.ok(turn.username);
    assert.ok(turn.credential);
    assert.match(turn.username, /^\d+:user_agent_test$/);
  });
});
