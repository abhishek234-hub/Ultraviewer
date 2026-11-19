# RemoteX – Production Windows Remote Desktop System

RemoteX is a high-performance, secure Windows Remote Desktop application inspired by AnyDesk and UltraViewer. It enables users to connect Windows computers over LAN or the Internet with low-latency WebRTC screen streaming, remote mouse and keyboard control via native Win32 `SendInput`, chunked peer-to-peer file transfer, and real-time interactive chat.

---

## 1. System Architecture & Features

### Core Capabilities
- **WebRTC High-Speed Screen Streaming**: 60 FPS desktop capture via Electron `desktopCapturer` and `getUserMedia`, with adaptive bitrate and multi-monitor selection.
- **Hardware Mouse & Keyboard Control**: Windows Win32 `SendInput` native helper (`RemoteXInputHelper.exe`) delivering sub-millisecond input simulation with High-DPI normalization and multi-display virtual desktop mapping.
- **Interactive Session Authorization**: Host approval prompt with granular permissions (Mouse/Keyboard, File Transfer, Clipboard, Audio).
- **Chunked File Transfer**: Peer-to-peer file transfer over WebRTC DataChannel with progress tracking, receiver validation, and path traversal protection.
- **Real-Time Encrypted Chat**: In-session text messaging and clipboard synchronization with timestamps and participant tags.
- **MySQL 8 Database**: Production relational schema with connection pooling, migrations, foreign key constraints, and transactional session tracking.
- **STUN & Coturn TURN Relay**: Complete NAT traversal configuration with RFC 5766 temporary HMAC credentials.
- **Enterprise Electron Security**: Context isolation, disabled node integration, restricted preload channels, and navigation guards.
- **Windows NSIS Installer**: One-click and custom directory NSIS Windows installer (`RemoteX Setup.exe`).

---

## 2. Technology Stack

### Frontend & Desktop
- **Runtime**: Electron.js 33+
- **UI Framework**: React 18 (Pure JSX, No TypeScript)
- **Bundler**: Vite 5
- **Routing**: React Router DOM 6 (HashRouter for desktop file/http protocol)
- **Styling**: CSS3 Custom Dark Navy Theme with Blue Accents
- **Icons**: Lucide React
- **API Client**: Axios with JWT Interceptors
- **Real-Time Client**: Socket.IO Client

### Backend & API
- **Platform**: Node.js (ES Modules `"type": "module"`)
- **Server**: Express.js with MVC Architecture
- **Real-Time Engine**: Socket.IO WebRTC Signaling & Presence Server
- **Authentication**: JSON Web Tokens (JWT) & bcryptjs Password Hashing
- **Validation**: Zod Schema Validation
- **Security**: Helmet, Express Rate Limit, CORS Whitelisting
- **Database Client**: `mysql2/promise` with Connection Pooling

### Native Windows Integration
- **Compiler**: Windows .NET Framework C# Compiler (`csc.exe`)
- **Win32 APIs**: `user32.dll` (`SendInput`, `GetSystemMetrics`, `SetProcessDPIAware`, `mouse_event`, `keybd_event`)
- **Executable**: `native-agent/windows/input/bin/RemoteXInputHelper.exe`

---

## 3. Project Folder Structure

```
RemoteX/
├── frontend/
│   ├── electron/
│   │   ├── main.js
│   │   ├── preload.js
│   │   ├── security.js
│   │   └── ipc/
│   │       ├── screenCapturer.js
│   │       ├── nativeInput.js
│   │       └── systemInfo.js
│   ├── public/
│   │   ├── icon.ico
│   │   └── icon.png
│   ├── src/
│   │   ├── components/
│   │   │   ├── TitleBar.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   ├── IncomingModal.jsx
│   │   │   └── ConnectingModal.jsx
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── ConnectRemote.jsx
│   │   │   ├── MyDevices.jsx
│   │   │   ├── RecentSessions.jsx
│   │   │   ├── RemoteSession.jsx
│   │   │   ├── FileTransfer.jsx
│   │   │   ├── Chat.jsx
│   │   │   ├── Settings.jsx
│   │   │   ├── Profile.jsx
│   │   │   └── SecuritySettings.jsx
│   │   ├── layouts/
│   │   │   └── AppLayout.jsx
│   │   ├── services/
│   │   │   ├── api.js
│   │   │   ├── socket.js
│   │   │   └── webrtcService.js
│   │   ├── context/
│   │   │   ├── AuthContext.jsx
│   │   │   ├── DeviceContext.jsx
│   │   │   └── SessionContext.jsx
│   │   ├── styles/
│   │   │   └── index.css
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
│
├── backend/
│   ├── config/
│   │   └── database.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── deviceController.js
│   │   ├── sessionController.js
│   │   └── fileController.js
│   ├── models/
│   │   ├── authModel.js
│   │   ├── deviceModel.js
│   │   ├── sessionModel.js
│   │   ├── permissionModel.js
│   │   ├── connectionLogModel.js
│   │   └── fileTransferModel.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── deviceRoutes.js
│   │   ├── sessionRoutes.js
│   │   └── fileRoutes.js
│   ├── middleware/
│   │   ├── authMiddleware.js
│   │   ├── errorMiddleware.js
│   │   └── rateLimitMiddleware.js
│   ├── services/
│   │   ├── jwtService.js
│   │   ├── deviceService.js
│   │   └── turnService.js
│   ├── sockets/
│   │   ├── signalingSocket.js
│   │   └── sessionSocket.js
│   ├── validators/
│   ├── utils/
│   │   ├── dbInit.js
│   │   ├── dbMigrate.js
│   │   ├── dbSeed.js
│   │   ├── dbCheck.js
│   │   └── backendTest.js
│   ├── app.js
│   ├── server.js
│   ├── package.json
│   ├── .env
│   └── .env.example
│
├── database/
│   ├── schema.sql
│   ├── migrations/
│   │   └── 001_init.sql
│   └── seeds/
│       └── 001_seed.sql
│
├── native-agent/
│   └── windows/
│       ├── input/
│       │   ├── RemoteXInputHelper.cs
│       │   └── bin/RemoteXInputHelper.exe
│       ├── permissions/
│       │   └── checkPermissions.ps1
│       └── README.md
│
├── infrastructure/
│   ├── coturn/
│   │   └── turnserver.conf
│   └── deployment/
│       └── docker-compose.yml
│
└── README.md
```

---

## 4. Database Setup & Verification

RemoteX requires MySQL 8. The database credentials are configured in `backend/.env`.

### 1. Database Configuration (`backend/.env`)
```env
PORT=5050
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=root
DB_NAME=remotex_db
JWT_SECRET=remotex_super_secure_jwt_secret_token_key_2026_xyz987
JWT_EXPIRES_IN=7d
CORS_ORIGIN=*
STUN_SERVER=stun:stun.l.google.com:19302
TURN_SERVER=turn:localhost:3478
TURN_CREDENTIAL=remotex_secret_turn_pass
```

### 2. Database Management Scripts
Run these scripts from the `backend/` folder:

```bash
# 1. Initialize Database Schema
npm run db:init

# 2. Run SQL Migrations
npm run db:migrate

# 3. Seed Default Demonstration Data
npm run db:seed

# 4. Check Connection & Schema Integrity
npm run db:check
```

**Seed Credentials:**
- Host User: `host@remotex.local` / `Password123!`
- Client User: `client@remotex.local` / `Password123!`

---

## 5. Running the Application

### Step 1: Start Backend API & Signaling Server
```bash
cd backend
npm start
# Server listens on http://localhost:5050
```

### Step 2: Start Desktop Application (Electron + Vite)
In a new terminal:
```bash
cd frontend
npm run electron:dev
```

---

## 6. Testing & Quality Assurance

### Automated Backend Unit & Integration Tests
Run the automated test suite testing MySQL connection pool, bcrypt auth, JWT issuance, unique RemoteX ID generation, session permission transactions, and RFC 5766 TURN credentials:

```bash
cd backend
npm test
```

### Windows Input Helper Diagnostics
Run the PowerShell diagnostic utility to verify screen resolution, multi-monitor configuration, and native helper binary presence:

```powershell
powershell -ExecutionPolicy Bypass -File native-agent/windows/permissions/checkPermissions.ps1
```

---

## 7. Compiling the Windows Native Input Helper

The native helper binary is compiled directly with Microsoft Windows built-in C# compiler (`csc.exe`):

```cmd
C:\Windows\Microsoft.NET\Framework64\v4.0.30319\csc.exe /target:exe /out:native-agent\windows\input\bin\RemoteXInputHelper.exe /optimize+ native-agent\windows\input\RemoteXInputHelper.cs
```

---

## 8. Building the Windows NSIS Installer (.exe)

To produce the production installer `RemoteX-Setup.exe`:

```bash
cd frontend
npm run dist
```

Output is generated in `frontend/dist-electron/`:
- `RemoteX-Setup-1.0.0.exe` (NSIS Windows Installer with Desktop & Start Menu shortcuts)
- `win-unpacked/` (Unpacked standalone directory for instant testing)

---

## 9. Coturn TURN Server Deployment

To run coturn in Docker alongside MySQL 8:
```bash
cd infrastructure/deployment
docker compose up -d
```

Firewall ports to allow in Windows Defender / Cloud Firewall:
- TCP: `5050` (Backend API & Socket.IO)
- TCP/UDP: `3478` (Coturn STUN/TURN)
- UDP: `49152-65535` (WebRTC Media Relay Ports)
