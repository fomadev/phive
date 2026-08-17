# Phive (PHP Live Server)

Phive is a Visual Studio Code extension designed to modernize PHP development by providing an automated local server environment with live-reloading, intelligent port management, and cross-device network testing.

For complete technical documentation, architecture deep-dives, and detailed configuration guides, refer to [DOCUMENTATION.md](DOCUMENTATION.md).

---

## Key Features

* **Instant PHP Server**: Launch a local PHP web server directly from your workspace with a single click or command.
* **Dual Operation Modes (HTTP & HTTPS)**:
  * **Standard HTTP Mode (Default)**: Zero-configuration local development. Starts the PHP server on your selected port and binds across all local network interfaces.
  * **HTTPS Mode via Reverse Proxy**: Optional TLS termination powered by an internal Node.js HTTPS reverse proxy. Forward requests to an internal PHP process, with support for custom `.crt`/`.key` certificates and automatic self-signed certificate generation.
* **Smart Live Reloading**: Automatically refreshes connected desktop and mobile browsers upon saving `.php`, `.html`, `.css`, `.js`, or `.json` files.
* **Dynamic WebSocket Host Resolution**: Connects the live reload client using runtime browser host resolution (`window.location.hostname`), ensuring reliable connections over both `localhost` and local network IP addresses.
* **Environment Variable Hot Restart**: Automatically detects changes to `.env` configuration files and restarts the PHP process in the background to apply new environment variables without manual intervention.
* **Native Log Colorization**: Uses Visual Studio Code's native `"log"` grammar for theme-adaptive syntax colorization in the Output Channel across Light and Dark themes.
* **HTTP Status Code Parsing**: Intercepts server logs and classifies HTTP status codes (`[200 OK]`, `[302 REDIRECT]`, `[404 NOT FOUND]`, `[500 SERVER ERROR]`) with sequential request tracking (`[Req #N]`).
* **Debounced Browser Reloading**: Configurable debounce delay (`phive.reloadDelay`) prevents redundant reloads during rapid multi-file save operations.
* **Path Exclusion Filtering**: Excludes specified directories (`phive.ignorePaths` such as `node_modules`, `.git`, `vendor`, and `cache`) from file watch events.
* **Automated Port Conflict Resolution**: Automatically scans and allocates available sequential ports for HTTP/HTTPS, internal PHP processes, and WebSocket connections when default ports are occupied.
* **Cross-Device Network Testing**: Automatically detects your active local IPv4 address, allowing instant testing on mobile devices and tablets connected to the same local network.
* **Automated Router Injection & Workspace Isolation**: Dynamically generates and manages a temporary router file (`.phive_router.php`), hiding it from the Visual Studio Code explorer and cleaning it up upon server termination.

---

## Quick Start

### 1. Standard HTTP Mode (Zero Configuration)

1. Open your PHP project directory in Visual Studio Code.
2. Click **Phive: Go Live** in the Status Bar (bottom right) or run `Phive: Start PHP Server` from the Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`).
3. Phive automatically starts the server and opens `http://localhost:8000` in your default web browser.
4. To stop the server, click the active Status Bar item or run `Phive: Stop PHP Server`.

### 2. HTTPS Mode (Secure Development)

1. Open Visual Studio Code Settings (`Ctrl+,` / `Cmd+,`) and search for `Phive`.
2. Enable `Phive: Enable HTTPS` (`phive.enableHTTPS: true`).
3. (Optional) Provide paths to custom certificates:
   * `Phive: Ssl Cert Path`: Relative path (e.g., `certs/server.crt`) or absolute path to your certificate.
   * `Phive: Ssl Key Path`: Relative path (e.g., `certs/server.key`) or absolute path to your private key.
   * *Note: If left empty, Phive automatically generates and caches a local self-signed certificate.*
4. Start the server via `Phive: Start PHP Server`. The browser will navigate to `https://localhost:8000`.

---

## Configuration Reference

Configure settings in Visual Studio Code (`Ctrl+,` or `Cmd+,` searching for `Phive`):

| Setting | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `phive.phpPath` | `string` | `"php"` | Absolute path to the PHP executable. Defaults to system `PATH`. |
| `phive.port` | `number` | `8000` | Preferred local port for the PHP server or HTTPS proxy. |
| `phive.reloadDelay` | `number` | `100` | Delay in milliseconds before triggering a browser reload. |
| `phive.ignorePaths` | `array` | `["node_modules", ".git", "vendor", "cache"]` | Folders excluded from triggering live reloads. |
| `phive.enableHTTPS` | `boolean` | `false` | Enables HTTPS reverse proxy mode with TLS termination. |
| `phive.sslCertPath` | `string` | `""` | Path to custom SSL certificate (`.crt` / `.pem`). Supports workspace-relative and absolute paths. |
| `phive.sslKeyPath` | `string` | `""` | Path to custom SSL private key (`.key`). Supports workspace-relative and absolute paths. |

---

## Architecture Overview

Phive operates under two distinct runtime architectures depending on the protocol configuration:

### Standard HTTP Architecture
The PHP built-in CLI server binds directly to `0.0.0.0:<PORT>`. Live reload signals are transmitted via a standalone WebSocket server on port `9001` (or next available). Client scripts connect via `ws://<hostname>:<PORT>`.

### HTTPS Reverse Proxy Architecture
PHP runs on an isolated internal loopback port (`127.0.0.1:<INTERNAL_PORT>`). A built-in Node.js HTTPS reverse proxy binds to `0.0.0.0:<PORT>`, terminates incoming TLS traffic using specified or generated certificates, forwards plain HTTP traffic to the internal PHP process, and relays WebSocket connections (`wss://` to `ws://`).

---

## Full Documentation

For comprehensive technical guides, execution flows, and troubleshooting instructions, see [DOCUMENTATION.md](DOCUMENTATION.md).

---

## Contributing

Contributions must comply with project governance. Please review [CONTRIBUTING.md](CONTRIBUTING.md) prior to submitting pull requests or opening issues.

---

## License

This project is licensed under the **FomaDev Public License (FPL)**. Commercial distribution, resale, or hosting derivative services based on this engine requires an explicit license. See [LICENSE](LICENSE) for complete terms.

---

Developed by **FomaDev**