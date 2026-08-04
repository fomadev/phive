# Phive (PHP Live Server) v1.1.6: Complete Technical Documentation and User Guide

---

## 1. Introduction and Overview

Phive (PHP Live Server) is a high-performance Visual Studio Code extension developed by FomaDev. Designed to modernize the local PHP development workflow, Phive eliminates manual browser refreshes, complex server installations, and cumbersome web host configurations.

By combining the built-in PHP CLI web server with a WebSocket-based live-reloading engine and theme-aware output channel log colorization, Phive provides instantaneous feedback and real-time visual telemetry during development across both local machines and network-connected devices (such as mobile phones and tablets).

### Core Objectives
* Provide zero-configuration, single-click PHP web server execution within VS Code.
* Implement robust live reloading for PHP, HTML, CSS, JavaScript, and JSON assets.
* Deliver native, theme-adaptive OutputChannel log colorization with HTTP status code classification.
* Support instant environment variable loading by automatically restarting the underlying PHP process when environment configuration files change.
* Eliminate port collisions through dynamic port detection and allocation.
* Enable seamless cross-device testing over local Wi-Fi and Ethernet networks.
* Ensure a clean workspace by dynamically managing temporary routing artifacts without polluting source repositories.

---

## 2. Key Features in Version 1.1.6

Version 1.1.6 introduces major developer experience (DX) enhancements around server logging, status code parsing, and syntax colorization:

### Native OutputChannel Syntax Highlighting (`"log"`)
Phive now initializes its dedicated VS Code OutputChannel using the native `"log"` language identifier grammar:
`vscode.window.createOutputChannel("Phive Server Logs", "log")`.
This enables VS Code's built-in log syntax highlighter to dynamically colorize output tags and status lines across both **Light** and **Dark** editor themes without third-party extensions.

### HTTP Status Code Parsing & Colorization
Incoming log streams from the PHP CLI development server stderr output are intercepted and analyzed in real time. Phive extracts status codes (2xx, 3xx, 4xx, 5xx) via regular expression matching and formats each entry with standard severity prefixes and status descriptors:
* **2xx (Success)**: Formatted as `[INFO] [200 OK]` — renders in **Green** in VS Code log grammar.
* **3xx (Redirection)**: Formatted as `[WARN] [302 REDIRECT]` — renders in **Yellow**.
* **4xx (Client Error)**: Formatted as `[WARN] [404 NOT FOUND]` — renders in **Yellow/Orange**.
* **5xx (Server Error)**: Formatted as `[ERROR] [500 SERVER ERROR]` — renders in **Red**.

### Structured Request Indexing & Telemetry
Every incoming HTTP request is tagged with a sequential request counter (`[Req #N]`), accurate local timestamp, and structured tag (`[INFO]`, `[DEBUG]`, `[WARN]`, or `[ERROR]`), allowing developers to effortlessly trace server activity.

### Environment File Hot-Restart Engine (v1.1.5)
Modifying environment files (such as `.env`, `.env.local`, or `.env.production`) automatically triggers a graceful background restart of the PHP executable. This guarantees that updated environment variables are instantly accessible to your PHP application without requiring manual server restarts. Once restarted, all connected web clients are refreshed automatically.

### Microsecond Path Exclusion Filtering
The extension supports configurable path exclusions via the `phive.ignorePaths` setting. File changes occurring inside excluded directories (such as `node_modules`, `.git`, `vendor`, or `cache`) are discarded immediately with minimal CPU overhead, preventing superfluous browser refreshes during dependency installation or build steps.

### Debounced Live-Reloading Engine
Consecutive file saves within a configurable time window (`phive.reloadDelay`, default 100ms) are debounced into a single refresh command. This prevents browser freeze or flickering during heavy batch edits or automated asset compilation.

### Automatic Port Allocation and Conflict Resolution
Phive automatically tests preferred ports (HTTP port 8000 and WebSocket port 9001). If either port is occupied by another local service, Phive identifies and binds to the next available sequential port, providing non-blocking operation.

---

## 3. System Requirements and Prerequisites

Before utilizing Phive, ensure your development environment satisfies the following prerequisites:

### Prerequisites
1. **Visual Studio Code**: Version 1.80.0 or higher.
2. **PHP Executable**: PHP CLI version 7.4 or higher (PHP 8.x recommended).
   * The `php` binary must either be available in your system `PATH` variable or explicitly configured via the `phive.phpPath` setting.

### Supported Operating Systems
* **Windows**: Fully supported (compatible with standalone PHP, XAMPP, WAMP, Laragon).
* **macOS**: Fully supported (compatible with Homebrew PHP, MAMP, Herd).
* **Linux**: Fully supported (compatible with system package manager binaries).

---

## 4. Installation and Setup

### Installation via VS Code Marketplace
1. Launch Visual Studio Code.
2. Open the Extensions View by pressing `Ctrl+Shift+X` (Windows/Linux) or `Cmd+Shift+X` (macOS).
3. Search for `Phive` or `fomadev.phive`.
4. Click **Install**.

### Installation from VSIX Package
If installing offline or testing pre-release builds:
1. Open the Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`).
2. Select **Extensions: Install from VSIX...**.
3. Select the `.vsix` package file (e.g., `phive-1.1.6.vsix`) and click **Install**.

---

## 5. Quick Start and Daily Usage

### Starting the Server
1. Open a PHP project directory in Visual Studio Code.
2. Activate the server using one of the following methods:
   * Click the **Phive: Go Live** button located on the right side of the VS Code Status Bar.
   * Open the Command Palette (`Ctrl+Shift+P`) and execute `Phive: Start PHP Server`.
3. If working within a multi-root workspace, select the targeted folder from the dropdown quick pick menu.
4. Phive will allocate necessary network ports, launch the PHP process, open your default web browser to `http://localhost:<PORT>`, and output access URLs.

### Stopping the Server
To terminate the active PHP server instance and WebSocket server:
* Click the active server status indicator in the Status Bar (showing `Phive: <IP>:<PORT>`).
* Or open the Command Palette (`Ctrl+Shift+P`) and execute `Phive: Stop PHP Server`.

---

## 6. Configuration Reference

Phive provides four configurable settings through VS Code Settings (`Ctrl+,` or `Cmd+,` searching for `Phive`):

| Setting Key | Type | Default Value | Description |
| :--- | :--- | :--- | :--- |
| `phive.phpPath` | `string` | `"php"` | Absolute path to the PHP executable. Set this if `php` is not included in system environment PATH (e.g., `C:\xampp\php\php.exe` or `/usr/local/bin/php`). |
| `phive.port` | `number` | `8000` | Preferred HTTP port for the local PHP server. If occupied, Phive automatically selects the next available port. |
| `phive.reloadDelay` | `number` | `100` | Delay in milliseconds prior to issuing a browser reload. Useful when asset builders require a brief window to complete file writes. |
| `phive.ignorePaths` | `array` | `["node_modules", ".git", "vendor", "cache"]` | Array of path segments or directory names to exclude from live-reload monitoring. |

---

## 7. Architecture and Technical Deep-Dive

Phive is built on a modular TypeScript architecture consisting of four core modules: `extension.ts`, `serverManager.ts`, `liveReload.ts`, and `networkUtils.ts`.

### 7.1 Component Relationship Diagram

```
+-----------------------------------------------------------------------+
|                             VS Code Host                              |
+-----------------------------------------------------------------------+
        |                                                 |
        v                                                 v
+-------------------+                             +-------------------+
|  extension.ts     |                             |  liveReload.ts    |
| (Command Control) |                             | (WebSocket Server)|
+-------------------+                             +-------------------+
        |                                                 |
        | Starts & Configures                             | Watches Files &
        v                                                 | Sends Reload Signal
+-------------------+                                     |
| serverManager.ts  |                                     |
| (PHP Child Process|                                     |
|  & Router Handler)|                                     |
+-------------------+                                     |
        |                                                 |
        v                                                 v
+-----------------------------------------------------------------------+
|                         Browser Client Session                        |
| - Connects to HTTP Server at http://<ip>:<port>                        |
| - Receives Injected WebSocket Script connecting to ws://<ip>:<wsPort> |
+-----------------------------------------------------------------------+
```

### 7.2 Core Modules Breakdown

#### `src/extension.ts` (Entry Point and Lifecycle Coordinator)
* Handles extension activation (`activate`) and deactivation (`deactivate`).
* Registers commands `phive.startServer` and `phive.stopServer`.
* Controls status bar UI states (`updateStatusBar`), updating colors and text according to server status.
* Orchestrates dynamic port acquisition for both HTTP and WebSocket interfaces using `portfinder`.
* Launches the default browser using the native `open` package.

#### `src/serverManager.ts` (`PHPStackManager` Class)
* Spawns and manages the underlying PHP CLI child process (`child_process.spawn`).
* **Output Channel Initialization (v1.1.6)**: Instantiates `vscode.window.createOutputChannel("Phive Server Logs", "log")` to enable native log language syntax highlighting.
* **HTTP Log Formatting Engine (v1.1.6)**: Implements `formatHttpLog(rawLog, time)` to analyze stderr data, extract HTTP status codes with regex `/\b([1-5]\d\d)\b/`, and prefix entries with colorized tags (`[200 OK]`, `[302 REDIRECT]`, `[404 NOT FOUND]`, `[500 SERVER ERROR]`).
* Tracks incoming connection counts via `_requestCount` and formats initial request logs (`[INFO] [Req #1] ...`).
* Generates a temporary router script (`.phive_router.php`) in the project root.
* Automatically updates VS Code's `files.exclude` workspace settings to hide `.phive_router.php` from the file explorer.
* Intercepts PHP document output and injects client-side WebSocket live-reload JavaScript prior to the closing `</body>` tag.
* Maintains session parameters (`_lastServerParams`) to support seamless hot-restarts without resetting ports.

#### `src/liveReload.ts` (`LiveReloadServer` Class)
* Instantiates a `ws` (WebSocket) server on the assigned WebSocket port.
* Listens to document save events across the workspace (`vscode.workspace.onDidSaveTextDocument`).
* Filters modified paths against `phive.ignorePaths` to prevent unnecessary notifications.
* Identifies `.env` environment configuration changes and invokes the `onEnvFileSaved` callback.
* Debounces consecutive saves according to `phive.reloadDelay` before broadcasting reload signals to connected clients.

#### `src/networkUtils.ts` (`getLocalIPv4` Utility)
* Scans local network interfaces via Node.js `os.networkInterfaces()`.
* Identifies active, non-internal IPv4 addresses (Wi-Fi or LAN).
* Defaults to `127.0.0.1` if offline or no network adapter is active.

---

## 8. Detailed Execution Workflows

### 8.1 Server Launch Sequence

1. **Workspace Validation**: Phive checks for an open workspace folder. If multiple folders exist, it prompts the user to select one.
2. **IP and Port Discovery**:
   * `getLocalIPv4()` retrieves the local network IP.
   * `portfinder.getPortPromise({ port: preferredPort })` determines an available HTTP port.
   * `portfinder.getPortPromise({ port: 9001 })` determines an available WebSocket port.
3. **WebSocket Initialization**: `LiveReloadServer` starts listening on the allocated WebSocket port.
4. **Router Construction and Hiding**:
   * A script named `.phive_router.php` is written to the root directory.
   * Phive dynamically updates VS Code configuration `files.exclude` to ensure `.phive_router.php` remains invisible to the developer.
5. **PHP Process Execution**:
   * Phive spawns `php -S 0.0.0.0:<PORT> .phive_router.php`.
   * Binding to `0.0.0.0` allows requests from both `localhost` and external network IPs.
6. **Browser Activation & Logging**: The extension opens `http://localhost:<PORT>` and outputs status information to the log channel.

### 8.2 Live Reload and Script Injection Sequence

1. When a user requests a PHP page, `.phive_router.php` intercepts the request.
2. Using PHP output buffering (`ob_start()`), the router captures the generated HTML.
3. The router injects the following client script before `</body>` (or appends it if no closing tag exists):

```html
<script>
    (function() {
        const socket = new WebSocket('ws://<IP>:<WS_PORT>');
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

4. When a file is saved in VS Code, `LiveReloadServer` verifies that the extension matches `.php`, `.html`, `.css`, `.js`, or `.json`, and that the file is not ignored.
5. After the configured delay, a `'reload'` message is sent over WebSocket connections, triggering `window.location.reload()` in all attached browsers.

### 8.3 Environment (.env) Hot-Restart Sequence

1. A file save event is detected on a file starting with `.env` (e.g., `.env`, `.env.local`).
2. `LiveReloadServer` triggers its `onEnvFileSaved` callback.
3. `PHPStackManager.restartServer()` is executed:
   * The existing PHP child process is killed gracefully without removing session metadata.
   * A new PHP process is spawned using identical parameters, forcing PHP to re-read environment files.
4. Once restarted, `LiveReloadServer.broadcastReload()` sends a reload signal, refreshing connected browsers with updated environment variables active.

### 8.4 Clean Teardown Sequence

When `phive.stopServer` is triggered or VS Code is closed:
1. The active PHP child process is killed (`this._process.kill()`).
2. The WebSocket server is closed and client sockets are disconnected.
3. The router exclusion entry in `files.exclude` is removed.
4. `.phive_router.php` is deleted from the filesystem.
5. The status bar resets to `Phive: Go Live`.

---

## 9. Integrated Request Logging & HTTP Status Colorization

Phive includes a dedicated output log channel with theme-aware syntax colorization and automated HTTP status parsing:

* Access the log window by selecting **View > Output** in VS Code, then choosing **Phive Server Logs** from the dropdown menu.
* **Log Language Engine (v1.1.6)**: Built using `vscode.window.createOutputChannel("Phive Server Logs", "log")`, leveraging VS Code's native `log` syntax rules.

### HTTP Status Code Formatting Rules

| HTTP Status Range | Log Level Tag | Formatted Prefix Example | Native VS Code Log Color |
| :--- | :--- | :--- | :--- |
| **2xx (Success)** | `[INFO]` | `[INFO] [200 OK]` | **Green** |
| **3xx (Redirection)** | `[WARN]` | `[WARN] [302 REDIRECT]` | **Yellow** |
| **4xx (Client Error)** | `[WARN]` | `[WARN] [404 NOT FOUND]` | **Yellow / Orange** |
| **5xx (Server Error)** | `[ERROR]` | `[ERROR] [500 SERVER ERROR]` | **Red** |
| **Request Connection**| `[INFO]` | `[INFO] [Req #1]` | **Green / Info Blue** |
| **Process Close** | `[DEBUG]` | `[DEBUG]` | **Dark / Muted Gray** |
| **Server Lifecycle** | `[INFO] / [WARN]` | `[INFO] [Phive] Server started...` | **Theme Accent Color** |

### Code Implementation (`src/serverManager.ts`)

```typescript
private formatHttpLog(rawLog: string, time: string): string {
    const statusCodeMatch = rawLog.match(/\b([1-5]\d\d)\b/);
    
    if (statusCodeMatch) {
        const statusCode = parseInt(statusCodeMatch[1], 10);

        if (statusCode >= 200 && statusCode < 300) {
            return `[INFO] [${statusCode} OK] ${time} - ${rawLog}`;
        } else if (statusCode >= 300 && statusCode < 400) {
            return `[WARN] [${statusCode} REDIRECT] ${time} - ${rawLog}`;
        } else if (statusCode >= 400 && statusCode < 500) {
            return `[WARN] [${statusCode} NOT FOUND] ${time} - ${rawLog}`;
        } else if (statusCode >= 500) {
            return `[ERROR] [${statusCode} SERVER ERROR] ${time} - ${rawLog}`;
        }
    }

    return `[LOG] ${time} - ${rawLog}`;
}
```

### Sample Output Channel Session

```log
[INFO] [Phive] Attempting to start using: php
[INFO] [Phive] Server started: http://192.168.1.50:8000
[INFO] [Req #1] 19:42:01 - 127.0.0.1:51234 Accepted
[INFO] [200 OK] 19:42:01 - [200]: GET /index.php
[INFO] [Req #2] 19:42:05 - 127.0.0.1:51240 Accepted
[WARN] [404 NOT FOUND] 19:42:05 - [404]: GET /favicon.ico
[INFO] [Req #3] 19:42:10 - 127.0.0.1:51248 Accepted
[ERROR] [500 SERVER ERROR] 19:42:10 - [500]: GET /api/data.php - Fatal error: Uncaught Error...
[WARN] [Phive] Server stopped (Code: 0)
```

---

## 10. Troubleshooting and Common Issues

### Issue 1: "PHP executable not found" Error
* **Cause**: System cannot locate the `php` executable in system `PATH`.
* **Solution**: Open VS Code Settings (`Ctrl+,`), search for `phive.phpPath`, and specify the absolute path to your PHP binary (e.g., `C:\php\php.exe` or `/opt/homebrew/bin/php`).

### Issue 2: Live Reload Does Not Trigger
* **Cause**: Saved file is in an excluded directory, has an unsupported file extension, or save delay is too high.
* **Solution**: Check `phive.ignorePaths` in settings. Ensure file extension is `.php`, `.html`, `.css`, `.js`, or `.json`. Verify `phive.reloadDelay` is appropriately configured.

### Issue 3: Cannot Connect from Mobile Device
* **Cause**: Firewall blocking incoming connections on the HTTP port or device is on a different Wi-Fi network.
* **Solution**: Ensure mobile device and computer are connected to the same local network subnet. Verify operating system firewall allows incoming TCP traffic on the port specified by Phive (e.g., 8000).

---

## 11. Licensing, Governance, and Contributions

### License Agreement
Phive is licensed under the **FomaDev Public License (FPL)**.

#### Key Licensing Terms:
* **Personal & Development Use**: Free for individual development workflows.
* **Commercial Distribution Restrictions**: Redistribution, resale, or packaging of modified source code on marketplaces or public platforms without explicit written permission from FomaDev is strictly prohibited.
* **Forking Policy**: Source code forks are permitted strictly for contributing back to the official repository via Pull Requests. Maintaining independent derivative distributions is restricted.

### Contribution Guidelines
Contributions to Phive must comply with the rules outlined in `CONTRIBUTING.md`:
1. Submit bug reports and feature requests via GitHub Issues prior to submitting code.
2. Fork the official repository and work on designated feature branches (`feature/` or `fix/`).
3. Ensure TypeScript code compiles cleanly without errors (`npm run compile`).
4. Test changes thoroughly inside the VS Code Extension Development Host (`F5`).
5. Open a Pull Request against the main branch of `fomadev/phive`.

---

Document generated for **Phive v1.1.6** by **FomaDev**.
