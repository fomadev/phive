# Phive (PHP Live Server)

Phive is a professional Visual Studio Code extension designed to streamline PHP development by providing a modern, live-reloading environment. It eliminates the need for manual browser refreshes and complex server configurations, making it ideal for both local and cross-device testing.

## Core Features

- **Instant PHP Server**: Launch a built-in PHP server instance directly from your workspace with a single click.
- **Smart Live Reloading**: Automatically refreshes connected browsers (desktop and mobile) upon saving `.php`, `.html`, `.css`, `.js`, or `.json` files.
- **Environment Aware (.env Reload)**: Automatically restarts the background PHP process when editing `.env` or environment configuration files, ensuring fresh environment variables are loaded seamlessly.
- **Configurable Reload Delay**: Avoids premature browser refreshes on heavy asset compilation or slow file writes by adding an adjustable delay.
- **Flexible Path Exclusion**: Skip live-reload processing for specified folders (like cache, vendors, or log directories) to stop redundant and performance-heavy browser refreshes.
- **Port Conflict Resolution**: Automatically detects if port 8000 or the WebSocket port is occupied by another application and switches to the next available port, preventing environment crashes.
- **Network Sharing**: Automatically detects your local IPv4 address, allowing seamless testing on mobile devices or tablets connected to the same network.
- **Integrated Request Logging**: Real-time output channel providing detailed logs of incoming HTTP requests and server status.
- **Multi-root Workspace Support**: Intelligent folder selection for developers working on multiple projects simultaneously.
- **Customizable PHP Path**: Support for custom PHP binary locations, ensuring compatibility with XAMPP, WAMP, Laragon, or standalone PHP installations.
- **Automated Routing**: Generates a temporary, hidden router script to handle asset serving and WebSocket injection without polluting your project structure.

## Requirements

- **PHP**: PHP must be installed on your system.
- **Environment**: By default, the extension expects the `php` executable to be in your system's PATH.

## Installation

1. Open Visual Studio Code.
2. Navigate to the Extensions view (`Ctrl+Shift+X`).
3. Search for `Phive` and click Install.

## Configuration

Phive provides the following configuration options through VS Code Settings (`Ctrl+,`):

- `phive.phpPath`: Specifies the absolute path to the PHP executable. Set this if `php` is not in your system PATH (e.g., `C:\xampp\php\php.exe` on Windows).

- `phive.port`: Specifies the preferred local port for the PHP server instance (Default: `8000`). Ideal for restrictive local network environments or static proxy routing rules.

- `phive.reloadDelay`: Specifies the delay in milliseconds before triggering a browser reload (Default: `100`). Perfect if your environment or builder needs a moment to fully compile assets before refreshing.

- `phive.ignorePaths`: An array of folder names or path segments to ignore (Default: `["node_modules", ".git", "vendor", "cache"]`). Any saved files located within these paths will completely bypass the live reload engine.

## Usage

1. **Start the Server**: Open a PHP project folder. Click the **Phive: Go Live** button in the Status Bar (bottom right) or use the Command Palette (`Ctrl+Shift+P` -> `Phive: Start PHP Server`).
2. **Select Folder**: If using a multi-root workspace, select the specific project folder you wish to serve.
3. **Development**: The extension will automatically open your default browser. Any changes saved to supported files will trigger an immediate reload across all connected devices.
4. **Stop the Server**: Click the active server info in the Status Bar or use the `Phive: Stop PHP Server` command.

## Technical Overview

Phive utilizes a WebSocket-based architecture (`ws` library) to maintain a persistent connection between the server and the client. During execution, it injects a lightweight JavaScript client into the PHP output stream via a temporary router file (`.phive_router.php`). This router file is automatically hidden from the VS Code File Explorer and securely deleted upon server termination to maintain workspace cleanliness.

## Changelog

### v1.1.5
- **Hot Server Restart for .env Files**: Added automatic PHP process restart when modifying `.env` or related environment files to force PHP to load updated configuration values.
- **Seamless Browser Refresh**: Triggers an automated client reload right after the PHP server completes its restart cycle.

### v1.1.4
- **Path Exclusion Filtering**: Added the `phive.ignorePaths` configuration array to easily mute unneeded folder segments.
- **Performance Boost**: Implemented micro-second early exits when processing saved files within ignored directories to prevent background system lag.

### v1.1.3
- **Live Reload Optimization**: Added the `phive.reloadDelay` configuration to prevent early browser refreshes during heavy file operations or slow disk writes.
- **Debounced Refresh**: Merged consecutive file-save events into a single reload event to reduce browser lag.

## Contributing

Contributions must comply with the official project guidelines. Please read the [CONTRIBUTING.md](CONTRIBUTING.md) file before submitting any code, issues, or pull requests.

## License

This project is licensed under the **FomaDev Public License (FPL)**. Commercial distribution, redistribution of modified source code, or hosting derivative services based on this engine requires an explicit paid license. See the [LICENSE](LICENSE) file for full legal terms and conditions.

---
Developed by **FomaDev**