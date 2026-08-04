# Phive (PHP Live Server)

Phive is a professional Visual Studio Code extension designed to streamline PHP development by providing a modern, live-reloading environment. It eliminates manual browser refreshes and complex server configurations, making it ideal for both local development and cross-device network testing.

For complete technical documentation, architecture deep-dives, execution flow diagrams, and troubleshooting guides, please refer to the official [DOCUMENTATION.md](DOCUMENTATION.md).

---

## Key Features

* **Instant PHP Server**: Launch a built-in PHP CLI web server instance directly from your workspace with a single click.
* **Smart Live Reloading**: Automatically refreshes connected browsers across desktop and mobile devices upon saving `.php`, `.html`, `.css`, `.js`, or `.json` files.
* **Native Log Colorization (v1.1.6)**: Leverages VS Code's native `"log"` syntax grammar for automatic, theme-adaptive (Light & Dark mode) log highlighting in the Output Channel.
* **HTTP Status Code Parsing (v1.1.6)**: Automatically parses and formats HTTP response status codes (`[200 OK]`, `[302 REDIRECT]`, `[404 NOT FOUND]`, `[500 SERVER ERROR]`) with real-time request tracking (`[Req #N]`).
* **Environment Aware (.env Hot Restart)**: Automatically restarts the background PHP process when editing `.env` or environment configuration files, ensuring updated environment variables are instantly active.
* **Debounced Browser Reload**: Debounces rapid consecutive file saves according to a configurable delay (`phive.reloadDelay`).
* **Flexible Path Exclusion**: Skips live-reload processing for configured folder segments (`phive.ignorePaths` like `node_modules`, `.git`, `vendor`, or `cache`) to prevent superfluous refreshes.
* **Port Conflict Resolution**: Automatically detects port collisions on HTTP (port 8000) and WebSocket (port 9001) interfaces, falling back to the next available sequential ports.
* **Network & Mobile Sharing**: Automatically resolves local IPv4 addresses, allowing cross-device testing on mobile phones and tablets connected to the same network.
* **Automated Router Injection**: Dynamically generates and manages a temporary router script (`.phive_router.php`) to handle asset serving and WebSocket injection while hiding the router from the file explorer.
* **Modular Internals**: Server lifecycle, logging, router generation, and VS Code file-visibility handling are split into dedicated helpers for easier maintenance and evolution.

---

## Full Documentation

For in-depth guides and technical details, visit [DOCUMENTATION.md](DOCUMENTATION.md):

* **[Section 1: Introduction and Overview](DOCUMENTATION.md#1-introduction-and-overview)**
* **[Section 2: Key Features in Version 1.1.6](DOCUMENTATION.md#2-key-features-in-version-116)**
* **[Section 3: System Requirements & Prerequisites](DOCUMENTATION.md#3-system-requirements-and-prerequisites)**
* **[Section 4: Installation & Setup](DOCUMENTATION.md#4-installation-and-setup)**
* **[Section 5: Quick Start and Daily Usage](DOCUMENTATION.md#5-quick-start-and-daily-usage)**
* **[Section 6: Configuration Reference](DOCUMENTATION.md#6-configuration-reference)**
* **[Section 7: Architecture and Technical Deep-Dive](DOCUMENTATION.md#7-architecture-and-technical-deep-dive)**
* **[Section 8: Detailed Execution Workflows](DOCUMENTATION.md#8-detailed-execution-workflows)**
* **[Section 9: Integrated Request Logging & HTTP Status Colorization](DOCUMENTATION.md#9-integrated-request-logging--http-status-colorization)**
* **[Section 10: Troubleshooting and Common Issues](DOCUMENTATION.md#10-troubleshooting-and-common-issues)**
* **[Section 11: Licensing, Governance, and Contributions](DOCUMENTATION.md#11-licensing-governance-and-contributions)**

---

## Quick Start

1. **Open Workspace**: Open a PHP project folder in Visual Studio Code.
2. **Start Server**: Click **Phive: Go Live** in the Status Bar (bottom right) or open the Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`) and run `Phive: Start PHP Server`.
3. **Develop**: Phive automatically opens your default browser to `http://localhost:8000`. Changes saved to supported files trigger immediate browser refreshes.
4. **Stop Server**: Click the active server status in the Status Bar or run `Phive: Stop PHP Server`.

---

## Configuration Reference Overview

Configure Phive settings in VS Code (`Ctrl+,` searching for `Phive`):

| Setting | Default | Description |
| :--- | :--- | :--- |
| `phive.phpPath` | `"php"` | Path to the PHP executable (e.g., `C:\php\php.exe`). |
| `phive.port` | `8000` | Preferred local port for the PHP server instance. |
| `phive.reloadDelay` | `100` | Delay in milliseconds before triggering a browser refresh. |
| `phive.ignorePaths` | `["node_modules", ".git", "vendor", "cache"]` | Folders excluded from triggering live reloads. |

For detailed setting explanations, view the [Configuration Reference in DOCUMENTATION.md](DOCUMENTATION.md#6-configuration-reference).

---

## Technical Overview

Phive uses a WebSocket-based architecture (`ws`) to maintain a persistent connection with client browsers. During execution, Phive injects a lightweight client JavaScript snippet into the PHP HTML stream using a temporary router script (`.phive_router.php`). The router file is hidden from the VS Code explorer and automatically deleted upon server termination.

---

## Recent Changelog

### Version 1.1.6
* **Native OutputChannel Syntax Highlighting**: Configured the VS Code output channel with language grammar identifier `"log"` for native, theme-adaptive syntax colorization across both Light and Dark themes.
* **HTTP Status Code Parsing & Colorization**: Added intelligent regex parsing of PHP CLI server stderr output to format status codes (`[200 OK]`, `[302 REDIRECT]`, `[404 NOT FOUND]`, `[500 SERVER ERROR]`) with color-coded status prefixes.
* **Structured Log Formatting & Request Indexing**: Implemented request sequence tracking (`[Req #N]`), timestamping, and standard severity markers (`[INFO]`, `[DEBUG]`, `[WARN]`, `[ERROR]`).
* **Modular Refactor for Maintainability**: Extracted router building, logging, and file-visibility behaviors into dedicated helper modules under `src/serverHelpers/`.

### Version 1.1.5
* **Hot Server Restart for .env Files**: Added automatic PHP process restart when modifying `.env` or related environment files to force PHP to load updated configuration values.
* **Seamless Browser Refresh**: Triggers an automated client reload right after the PHP server completes its restart cycle.

### Version 1.1.4
* **Path Exclusion Filtering**: Added the `phive.ignorePaths` configuration array to ignore designated folder segments.
* **Performance Optimization**: Implemented early exit checks when processing saved files within ignored directories.

### Version 1.1.3
* **Live Reload Optimization**: Added `phive.reloadDelay` configuration to prevent premature refreshes during heavy file writes.
* **Debounced Refresh**: Merged consecutive file-save events into a single reload event.

---

## Contributing

Contributions must comply with official project governance. Please read [CONTRIBUTING.md](CONTRIBUTING.md) before submitting code, issues, or pull requests.

---

## License

This project is licensed under the **FomaDev Public License (FPL)**. Commercial distribution, resale, or hosting derivative services based on this engine requires an explicit paid license. See [LICENSE](LICENSE) for full terms.

---

Developed by **FomaDev**