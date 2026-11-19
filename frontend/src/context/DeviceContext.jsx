import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import { getSocket, connectSocket } from '../services/socket';
import { useAuth } from './AuthContext';

const DeviceContext = createContext(null);

export function DeviceProvider({ children }) {
  const { user } = useAuth();
  const [deviceCode, setDeviceCode] = useState(() => {
    let saved = localStorage.getItem('remotex_device_code');
    if (!saved) {
      // Generate clean 9-digit code: RX-XXX-XXX-XXX
      const p1 = Math.floor(100 + Math.random() * 900);
      const p2 = Math.floor(100 + Math.random() * 900);
      const p3 = Math.floor(100 + Math.random() * 900);
      saved = `RX-${p1}-${p2}-${p3}`;
      localStorage.setItem('remotex_device_code', saved);
    }
    return saved;
  });

  const [deviceName, setDeviceName] = useState('Windows Workstation');
  const [operatingSystem, setOperatingSystem] = useState('Windows 11');
  const [deviceStatus, setDeviceStatus] = useState('online');
  const [systemSpecs, setSystemSpecs] = useState(null);

  useEffect(() => {
    async function initDevice() {
      let sysInfo = null;
      if (window.remotexApi?.isElectron) {
        try {
          sysInfo = await window.remotexApi.getSystemInfo();
          if (sysInfo) {
            setSystemSpecs(sysInfo);
            setDeviceName(sysInfo.hostname || 'Windows PC');
            setOperatingSystem(`${sysInfo.platform === 'win32' ? 'Windows' : sysInfo.platform} (${sysInfo.arch})`);
          }
        } catch (e) {
          console.error('[DeviceContext] Error fetching system info:', e);
        }
      }

      // Register device with REST API
      try {
        await api.post('/devices/register', {
          deviceCode,
          deviceName: sysInfo?.hostname || deviceName,
          operatingSystem: sysInfo ? `${sysInfo.platform} ${sysInfo.arch}` : operatingSystem,
          status: 'online'
        });
      } catch (err) {
        console.warn('[DeviceContext] REST registration warning:', err.message);
      }

      // Connect Socket & Register Device Presence
      const socket = connectSocket();

      function onConnect() {
        socket.emit('register_device', {
          deviceCode,
          deviceName: sysInfo?.hostname || deviceName,
          userId: user?.id || null,
          os: operatingSystem
        });
        setDeviceStatus('online');
      }

      function onDisconnect() {
        setDeviceStatus('offline');
      }

      socket.on('connect', onConnect);
      socket.on('disconnect', onDisconnect);

      if (socket.connected) {
        onConnect();
      }

      return () => {
        socket.off('connect', onConnect);
        socket.off('disconnect', onDisconnect);
      };
    }

    initDevice();
  }, [user, deviceCode]);

  return (
    <DeviceContext.Provider value={{
      deviceCode,
      deviceName,
      operatingSystem,
      deviceStatus,
      systemSpecs,
      setDeviceCode
    }}>
      {children}
    </DeviceContext.Provider>
  );
}

export function useDevice() {
  const context = useContext(DeviceContext);
  if (!context) throw new Error('useDevice must be used within a DeviceProvider');
  return context;
}

export default DeviceContext;
