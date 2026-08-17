# Phive (PHP Live Server) v1.2.0: Technical Documentation and User Guide

---

## 1. Introduction and Overview

Phive (PHP Live Server) is a Visual Studio Code extension developed by FomaDev. It is designed to streamline the local PHP development workflow by eliminating manual browser refreshes, complex local web server setups (Apache, Nginx configurations), and port collision issues.

Phive combines the PHP CLI built-in web server with a WebSocket-based live-reloading engine, dynamic router management, native theme-aware log colorization, and an integrated HTTPS reverse proxy architecture. It supports instant feedback during development across local desktop browsers and network-connected devices such as smartphones and tablets.

### Core Objectives
* Provide single-click, zero-configuration local PHP server execution directly within Visual Studio Code.
* Support both plain HTTP development and secure HTTPS development with custom certificates or automatic self-signed generation.
* Provide automatic live-reloading for PHP, HTML, CSS, JavaScript, and JSON files without third-party browser plugins.
* Maintain network reliability across devices by using dynamic hostname resolution for WebSocket connections.
* Deliver native, theme-adaptive Output Channel log colorization with HTTP status code classification.
* Enable instant environment variable updates through automatic background PHP process restarts on `.env` file changes.
* Prevent port collisions through dynamic port detection and sequential fallback allocation.
* Maintain a clean project workspace by dynamically managing temporary routing files and isolating them from source control.

---

## 2. Key Features and System Capabilities

### 2.1 Dual Operation Modes (HTTP & HTTPS)
* **Standard HTTP Mode (Default)**: Starts the PHP built-in server directly on the chosen port (default `8000`), listening on `0.0.0.0` for local and network access. Live reload operates over a dedicated WebSocket port (`9001`).
* **HTTPS Mode via Reverse Proxy**: The built-in PHP development server natively lacks TLS support. Phive bridges this capability by running an integrated Node.js HTTPS reverse proxy on the public port (e.g., `https://localhost:8000`). The proxy handles TLS termination and forwards plain HTTP traffic to an internal, isolated PHP instance running on a local loopback port.

### 2.2 Flexible SSL Certificate Management
When HTTPS mode is enabled (`phive.enableHTTPS: true`), Phive handles certificates using two approaches:
* **Custom Certificates**: Users can specify custom certificate (`.crt`, `.pem`) and private key (`.key`) paths via `phive.sslCertPath` and `phive.sslKeyPath`. Paths can be specified as absolute paths or relative paths resolved against the active workspace root folder.
* **Automatic Self-Signed Generation**: If no certificate paths are configured, Phive automatically generates a local 2048-bit RSA self-signed certificate using asynchronous cryptographic routines and caches it in the extension storage directory (`globalStorageUri`). If Node cryptographic packages are unavailable, it falls back to the system OpenSSL binary.
* **TLS Error Resilience**: The proxy implements `tlsClientError` handlers to gracefully handle TLS handshake failures (such as untrusted certificate warnings or aborted client handshakes) without crashing the server or leaking socket descriptors.

### 2.3 Dynamic WebSocket Host Resolution
The client-side live reload script injected into HTML responses dynamically resolves the connection hostname at runtime using `window.location.hostname`. This eliminates network mismatches caused by multi-adapter configurations (such as virtual machine network interfaces) and ensures consistent live reload functionality on both `localhost` and local area network (LAN) IP addresses.

### 2.4 Environment Configuration Hot Restart
Modifying environment files (including `.env`, `.env.local`, `.env.development`, `.env.production`) automatically triggers a graceful background restart of the PHP executable. This ensures that new environment variables are loaded into the PHP runtime without manual server restarts, followed by an automatic browser refresh.

### 2.5 Native Output Channel Syntax Highlighting
Phive initializes its dedicated Output Channel using Visual Studio Code's native `"log"` language identifier grammar (`vscode.window.createOutputChannel("Phive Server Logs", "log")`). This allows Visual Studio Code to automatically apply theme-adaptive syntax colorization across both Light and Dark editor themes.

### 2.6 HTTP Status Code Parsing and Telemetry
Incoming standard error output from the PHP CLI development server is parsed in real time using regular expressions:
* **2xx (Success)**: Formatted as `[INFO] [200 OK]` (rendered in green in Visual Studio Code log grammar).
* **3xx (Redirection)**: Formatted as `[WARN] [302 REDIRECT]` (rendered in yellow).
* **4xx (Client Error)**: Formatted as `[WARN] [404 NOT FOUND]` (rendered in yellow/orange).
* **5xx (Server Error)**: Formatted as `[ERROR] [500 SERVER ERROR]` (rendered in red).
* **Request Indexing**: Sequential request counters (`[Req #N]`) and timestamps allow clear traceability of incoming traffic.

### 2.7 Debounced Live Reloading and Path Filtering
* **Debounce Engine**: Rapid consecutive file saves within a configurable interval (`phive.reloadDelay`, default 100ms) are merged into a single reload signal.
* **Path Exclusion**: Directories defined in `phive.ignorePaths` (default: `node_modules`, `.git`, `vendor`, `cache`) are filtered out during file watching to prevent unnecessary reloads during dependency installations or build processes.

### 2.8 Automatic Port Conflict Resolution
Phive utilizes `portfinder` to verify the availability of the HTTP/HTTPS port (default `8000`), the WebSocket port (default `9001`), and the internal PHP bind port in HTTPS mode. If any port is occupied, Phive automatically binds to the next available sequential port and displays a notification.

---

## 3. System Requirements and Prerequisites

### Prerequisites
1. **Visual Studio Code**: Version 1.80.0 or higher.
2. **PHP CLI Executable**: PHP 7.4 or higher (PHP 8.x recommended).
   * The `php` binary must be accessible in your system `PATH` or explicitly configured via `phive.phpPath`.

### Operating System Compatibility
* **Windows**: Compatible with standalone PHP binaries, XAMPP, WAMP, and Laragon.
* **macOS**: Compatible with Homebrew PHP, MAMP, and Laravel Herd.
* **Linux**: Compatible with distribution package manager binaries (e.g., `apt`, `dnf`, `pacman`).

---

## 4. Installation and Setup

### Installation via Visual Studio Code Marketplace
1. Open Visual Studio Code.
2. Navigate to the Extensions view (`Ctrl+Shift+X` on Windows/Linux or `Cmd+Shift+X` on macOS).
3. Search for `Phive` or `fomadev.phive`.
4. Click **Install**.

### Installation from VSIX Package
1. Open the Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`).
2. Select **Extensions: Install from VSIX...**.
3. Choose the `.vsix` package file (e.g., `phive-1.2.0.vsix`) and confirm installation.

---

## 5. Operation Modes and Usage Guide

### 5.1 Mode 1: Standard HTTP Mode (Default)

This mode requires zero configuration and is recommended for standard local web development.

1. Open your PHP project workspace in Visual Studio Code.
2. Start the server using one of the following methods:
   * Click **Phive: Go Live** in the Status Bar (bottom right).
   * Open the Command Palette (`Ctrl+Shift+P`) and execute `Phive: Start PHP Server`.
3. If using a multi-root workspace, select the target project folder from the dropdown menu.
4. Phive launches the PHP server and automatically opens `http://localhost:8000` in your default browser.
5. Save any supported file (`.php`, `.html`, `.css`, `.js`, `.json`) to trigger an immediate browser reload.
6. To stop the server, click the Status Bar item or run `Phive: Stop PHP Server`.

### 5.2 Mode 2: HTTPS Mode (Secure Development)

This mode is designed for testing secure contexts, progressive web apps, geolocation APIs, or third-party webhooks that require TLS.

#### Option A: Using Custom Certificates
1. Open Visual Studio Code Settings (`Ctrl+,` / `Cmd+,`) and filter by `phive`.
2. Enable `Phive: Enable HTTPS` (`phive.enableHTTPS: true`).
3. Set `Phive: Ssl Cert Path` to your certificate path (e.g., `certs/server.crt` or `C:\path\to\server.crt`).
4. Set `Phive: Ssl Key Path` to your private key path (e.g., `certs/server.key` or `C:\path\to\server.key`).
5. Start the server via `Phive: Start PHP Server`. The browser will open `https://localhost:8000`.

*Note: Relative paths are automatically resolved against the root directory of the active workspace.*

#### Option B: Using Automatic Self-Signed Certificates
1. In Settings, enable `Phive: Enable HTTPS` (`phive.enableHTTPS: true`).
2. Leave both `Phive: Ssl Cert Path` and `Phive: Ssl Key Path` empty.
3. Start the server. Phive will automatically generate a self-signed certificate, store it in its global storage directory, and initialize the HTTPS proxy.
4. The browser will navigate to `https://localhost:8000`. (Accept the browser's local self-signed certificate prompt during the first visit).

---

## 6. Configuration Reference

All settings can be configured through the Visual Studio Code Settings editor (`Ctrl+,` / `Cmd+,`) or directly within `.vscode/settings.json`:

| Setting Key | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `phive.phpPath` | `string` | `"php"` | Path to the PHP CLI executable (e.g., `C:\php\php.exe` or `/usr/bin/php`). |
| `phive.port` | `number` | `8000` | Preferred local port for the PHP server or HTTPS proxy. |
| `phive.reloadDelay` | `number` | `100` | Delay in milliseconds prior to dispatching a browser reload event. |
| `phive.ignorePaths` | `array` | `["node_modules", ".git", "vendor", "cache"]` | Directory names or path segments excluded from live-reload monitoring. |
| `phive.enableHTTPS` | `boolean` | `false` | Enables HTTPS reverse proxy mode with TLS termination. |
| `phive.sslCertPath` | `string` | `""` | Path to custom SSL certificate (`.crt` / `.pem`). Supports relative and absolute paths. |
| `phive.sslKeyPath` | `string` | `""` | Path to custom SSL private key (`.key`). Supports relative and absolute paths. |

---

## 7. Architecture and Technical Deep-Dive

Phive is built on a modular TypeScript architecture designed for clean separation of concerns:

```
src/
├── extension.ts                  # Entry point, lifecycle, and command registration
├── serverManager.ts              # PHP process orchestration and reverse proxy coordination
├── liveReload.ts                 # WebSocket server, file watcher, and debounce logic
├── networkUtils.ts               # Local IPv4 interface discovery
└── serverHelpers/
    ├── httpsProxy.ts             # HTTPS Reverse Proxy (HTTP & WSS forwarding)
    ├── sslManager.ts             # SSL certificate resolution and self-signed generation
    ├── routerBuilder.ts          # PHP injection router generation
    ├── serverLogger.ts           # OutputChannel log formatting and status code classification
    └── fileVisibility.ts         # VS Code workspace files.exclude management
```

### 7.1 Runtime Architecture Diagrams

#### HTTP Mode Architecture
```
+-------------------------------------------------------------+
|                      Visual Studio Code                     |
+-------------------------------------------------------------+
        |                                       |
        v                                       v
+-----------------------+               +---------------------+
| PHPStackManager       |               | LiveReloadServer    |
| (spawns php CLI)      |               | (WebSocket Server)  |
+-----------------------+               +---------------------+
        | (0.0.0.0:8000)                        | (0.0.0.0:9001)
        v                                       v
+-------------------------------------------------------------+
|                       Browser Client                        |
| - HTTP Request -> http://localhost:8000                     |
| - Live Reload -> ws://localhost:9001                        |
+-------------------------------------------------------------+
```

#### HTTPS Reverse Proxy Architecture
```
+-------------------------------------------------------------+
|                      Visual Studio Code                     |
+-------------------------------------------------------------+
        |                                       |
        v                                       v
+-----------------------+               +---------------------+
| HTTPSProxyServer      |               | LiveReloadServer    |
| (TLS Termination)     |               | (WebSocket Server)  |
+-----------------------+               +---------------------+
        | (0.0.0.0:8000 - Public HTTPS)         | (Internal WS: 9001)
        |                                       |
        +---------------+                       |
        | Forward HTTP  | Proxy WSS             |
        v               v                       v
+------------------+  +---------------------------------------+
| PHP CLI Process  |  | Proxy Upgrade Relay                   |
| (127.0.0.1:8010) |  | (wss://localhost:8000 -> ws://:9001)  |
+------------------+  +---------------------------------------+
        ^
        |
+-------------------------------------------------------------+
|                       Browser Client                        |
| - HTTPS Request -> https://localhost:8000                   |
| - Live Reload   -> wss://localhost:8000                     |
+-------------------------------------------------------------+
```

### 7.2 Module Responsibilities

#### `src/extension.ts`
* Registers Visual Studio Code commands (`phive.startServer`, `phive.stopServer`).
* Manages Status Bar UI elements and transitions.
* Allocates sequential ports using `portfinder`.
* Initiates browser sessions using the `open` utility.

#### `src/serverManager.ts` (`PHPStackManager`)
* Coordinates the lifecycle of the PHP child process and the HTTPS reverse proxy.
* Generates the temporary router (`.phive_router.php`) and injects the live-reload script.
* Updates Visual Studio Code `files.exclude` configuration to hide the temporary router.
* Listens to PHP standard error/out streams and routes logs to `ServerLogger`.

#### `src/serverHelpers/httpsProxy.ts` (`HTTPSProxyServer`)
* Runs a Node.js `https.Server` on the public port using the resolved TLS certificates.
* Forwards standard HTTP requests to the internal PHP process using `http.request`.
* Intercepts `upgrade` requests to relay secure WebSocket (`wss://`) traffic directly to the internal `LiveReloadServer`.
* Catches and destroys faulty client connections using `tlsClientError` to prevent process instability.

#### `src/serverHelpers/sslManager.ts`
* Resolves user-configured certificate paths, converting workspace-relative paths to absolute filesystem paths.
* Automatically creates self-signed X.509 certificates using asynchronous routines or system OpenSSL when no custom certificates are supplied.

#### `src/liveReload.ts` (`LiveReloadServer`)
* Runs a WebSocket server (`ws`) listening across all network interfaces.
* Monitors workspace file save events via `vscode.workspace.onDidSaveTextDocument`.
* Filters modified paths against `phive.ignorePaths`.
* Handles `.env` file changes and coordinates hot process restarts.

#### `src/networkUtils.ts`
* Inspects active network adapters via `os.networkInterfaces()` to extract local non-internal IPv4 addresses for cross-device sharing.

---

## 8. Detailed Execution Workflows

### 8.1 Server Launch Sequence (HTTP Mode)
1. User invokes `phive.startServer`.
2. Phive determines the active workspace directory.
3. `getLocalIPv4()` retrieves the host's local network IP.
4. `portfinder` allocates the public HTTP port (`8000`) and WebSocket port (`9001`).
5. `LiveReloadServer` starts on port `9001`.
6. `.phive_router.php` is created in the project root containing the dynamic WebSocket connection script:
   ```html
   <script>
       (function() {
           const _phiveHost = window.location.hostname;
           const socket = new WebSocket('ws://' + _phiveHost + ':9001');
           socket.onmessage = (msg) => { 
               if (msg.data === 'reload') {
                   console.log('Phive: Reloading...');
                   window.location.reload(); 
               }
           };
           socket.onopen = () => console.log('Phive: Live Reload Connected');
           socket.onerror = () => console.error('Phive: Live Reload Connection Error');
       })();
   </script>
   ```
7. Phive hides `.phive_router.php` in Visual Studio Code settings.
8. The PHP CLI process is spawned: `php -S 0.0.0.0:8000 .phive_router.php`.
9. The default browser is opened to `http://localhost:8000`.

### 8.2 Server Launch Sequence (HTTPS Mode)
1. User invokes `phive.startServer` with `phive.enableHTTPS: true`.
2. `getOrGenerateSSLConfig()` resolves custom certificate paths (absolute or workspace-relative) or generates a self-signed certificate pair.
3. `portfinder` allocates the public HTTPS port (e.g., `8000`), the WebSocket port (`9001`), and an isolated internal PHP loopback port (e.g., `8010`).
4. `HTTPSProxyServer` initializes with the TLS configuration on port `8000`.
5. `.phive_router.php` is generated with `wss://` protocol configuration pointing to the public HTTPS port.
6. The PHP CLI process is spawned on the loopback address: `php -S 127.0.0.1:8010 .phive_router.php`.
7. The browser is opened to `https://localhost:8000`.

### 8.3 Environment (.env) Hot Restart Sequence
1. A file save event is detected on a file whose name begins with `.env` (e.g., `.env`, `.env.local`).
2. `LiveReloadServer` fires the `onEnvFileSaved` callback.
3. `PHPStackManager.restartServer()` kills the existing PHP process and spawns a new PHP instance with identical parameters.
4. Once the PHP server re-initializes, a `'reload'` command is broadcast to all connected WebSocket clients.

### 8.4 Clean Teardown Sequence
When `phive.stopServer` is triggered or Visual Studio Code deactivates:
1. The active PHP process is terminated (`child_process.kill()`).
2. The HTTPS proxy server (if running) is closed.
3. The WebSocket server is closed and client sockets are terminated.
4. `.phive_router.php` is deleted from the filesystem.
5. The router visibility rule is removed from `files.exclude`.
6. Status Bar indicators reset to the inactive state.

---

## 9. Integrated Request Logging & Diagnostics

Phive provides real-time logging in the Visual Studio Code Output Channel under **Phive Server Logs**.

### Log Formatting Specification

| Log Category | Prefix | Theme Highlighting Grammar |
| :--- | :--- | :--- |
| **2xx Success** | `[INFO] [200 OK]` | Green |
| **3xx Redirection** | `[WARN] [302 REDIRECT]` | Yellow |
| **4xx Client Error** | `[WARN] [404 NOT FOUND]` | Yellow / Orange |
| **5xx Server Error** | `[ERROR] [500 SERVER ERROR]` | Red |
| **Client Connection** | `[INFO] [Req #N]` | Blue / Accent |
| **Connection Teardown** | `[DEBUG]` | Dark / Muted Gray |
| **System Lifecycle** | `[INFO] [Phive]` / `[WARN]` | Cyan / Accent |

### Sample Output Channel Session

```log
[INFO] [Phive] Attempting to start using: php
[INFO] [Phive] Server active: http://192.168.1.100:8000
[LOG] 10:15:00 AM - PHP 8.4.0 Development Server (http://0.0.0.0:8000) started
[INFO] [Req #1] 10:15:05 AM - 127.0.0.1:52130 Accepted
[INFO] [200 OK] 10:15:05 AM - [200]: GET /index.php
[INFO] [Req #2] 10:15:08 AM - 127.0.0.1:52138 Accepted
[WARN] [404 NOT FOUND] 10:15:08 AM - [404]: GET /favicon.ico
[WARN] [Phive] Server stopped (Code: 0)
```

---

## 10. Troubleshooting and Common Issues

### Issue 1: "PHP executable not found"
* **Cause**: The `php` binary is not in your system environment `PATH`.
* **Solution**: Open Settings (`Ctrl+,`), search for `phive.phpPath`, and provide the full path to your PHP executable (e.g., `C:\php\php.exe` or `/usr/bin/php`).

### Issue 2: "Invalid request (Unsupported SSL request)" in Server Logs
* **Cause**: An HTTPS request was sent directly to a plain HTTP PHP server. This occurs when accessing `https://localhost:8000` while `phive.enableHTTPS` is set to `false`.
* **Solution**: Enable `phive.enableHTTPS: true` in settings so that the HTTPS reverse proxy intercepts and terminates the TLS handshake before routing traffic to PHP.

### Issue 3: "Missing SSL certificates" / "Fichiers SSL introuvables"
* **Cause**: Custom certificate paths in `phive.sslCertPath` or `phive.sslKeyPath` do not exist.
* **Solution**: Verify the file paths. Relative paths (e.g., `certs/server.crt`) must be relative to the active workspace folder. Alternatively, clear both path settings to allow Phive to auto-generate certificates.

### Issue 4: Live Reload Not Working on Mobile Device
* **Cause**: The mobile device is on a different Wi-Fi subnet, or the host machine firewall is blocking incoming TCP traffic on the HTTP and WebSocket ports.
* **Solution**: Ensure both devices are connected to the same local network. Allow inbound TCP connections on ports `8000` and `9001` in your operating system firewall settings.

---

## 11. Licensing, Governance, and Contributions

### License
Phive is licensed under the **FomaDev Public License (FPL)**.
* **Personal and Internal Development**: Free for individual and organizational development use.
* **Commercial Distribution Restrictions**: Redistribution, repackaging, or reselling of modified binaries or source code on public marketplaces without written authorization from FomaDev is prohibited.

### Contribution Guidelines
1. Review `CONTRIBUTING.md` prior to submitting changes.
2. Fork the repository and create a feature branch (`feature/` or `fix/`).
3. Verify compilation without errors (`npm run compile`).
4. Test changes using the Visual Studio Code Extension Development Host (`F5`).
5. Open a Pull Request targeting the `main` branch of `fomadev/phive`.

---

Document updated for **Phive v1.2.0** by **FomaDev**.
