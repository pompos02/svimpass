# svimpass

> A minimal, hotkey-driven, spotlight-like password manager designed for speed, security, and simplicity.

## ✨ Overview

**svimpass** is a cross-platform desktop password manager that provides a clean, spotlight-like interface for fast password access and management. It is fully local, secure by design, and optimized for keyboard-driven workflows.

![Svimpass demo][media/svimappAddgen.gif]

### Key Features

- **Strong Security**
  - AES-256-GCM encryption
  - PBKDF2 key derivation with unique salts
  - Fully local storage (no remote servers)
- **Hotkey Driven Workflow**
  - Global hotkey support (Windows/macOS)
  - Search, edit, delete, and generate entries entirely from the keyboard
- **Command System**
  - Spotlight-like interface with powerful built-in commands
- **CSV Import/Export**
  - Manage passwords in bulk using standard CSV format
- **Cross-Platform**
  - Linux, Windows, macOS

## Tech Stack

- **Backend**: Go 1.23, Wails v2, SQLite
- **Frontend**: React 18, TypeScript, Vite
- **Crypto**: AES-256-GCM encryption, PBKDF2 key derivation
- **Cross-platform**: Linux, Windows, macOS (with platform-specific builds)

## Prerequisites

Before building svimpass, you need to install the required dependencies. Follow the instructions below for your operating system.

### 1. Install Go (1.23+)

```bash
# Download and install Go 1.23+

# Add Go to PATH (add to ~/.bashrc or ~/.profile)
echo 'export PATH=$PATH:/usr/local/go/bin' >> ~/.bashrc
source ~/.bashrc

# Verify installation
go version
```

### 2. Install Node.js (16+)

### 3. Install Wails CLI v2

Once Go is installed, install the Wails CLI:

```bash
go install github.com/wailsapp/wails/v2/cmd/wails@latest
```

Verify Wails installation:

```bash
wails version
wails doctor
```

### 4. Install GCC Compiler

GCC (GNU Compiler Collection) is required for building Go applications with CGO dependencies.

## Installation

### Pre-built Binaries

Download the latest release for your platform from the [releases page](https://github.com/pompos02/svimpass/releases).

### Build from Source

1. **Clone the repository**:

   ```bash
   git clone https://github.com/pompos02/svimpass
   cd svimpass
   ```

2. **Install Wails CLI** (if not already installed):

   ```bash
   make install-wails
   ```

   Alternatively, install manually:

   ```bash
   go install github.com/wailsapp/wails/v2/cmd/wails@latest
   ```

3. **Build for your platform**:

   #### Linux Build

   ```bash
   make build-linux
   ```

   To be able to run the app you have to run the binary, and to toggle the floating window you should run the binary with the `--toggle` flag (this suits me as i am working on hyprland and could make the global hotkey to work due to wayland conflicts).
   You can easily set a hotkey to run the binary with the flag

   #### Windows Build

   ```bash
   make build-windows
   ```

   Recommended to just run the installer provided by the releases.

   #### macOS Build

   ```bash
   make build-darwin
   ```

   Drag the `.app` you just created in your applications folder so Spotlight/Raycast recognise it

Built binaries will be located in `build/bin/` or specifies otherwise by the build script.

## Platform-Specific Notes

### Linux

- **No global hotkeys**: Use `--toggle` flag while running the binary

### Windows

- **Global hotkey**: `Ctrl+Shift+P`

### macOS

- **Global hotkey**: `Ctrl+Shift+P`
- **Accessibility permissions**: Required for global hotkey functionality
- **Gatekeeper**: You may need to allow the app in System Preferences > Security & Privacy

## Getting Started

### Initial Setup

1. **Launch the application**
2. **Create master password**: Enter a strong master password when prompted
3. **Confirm password**: Re-enter to confirm
4. **Start using**: The app is now ready for password storage

### Basic Usage

#### Search Mode

- Type to search through your password entries
- Use arrow keys to navigate results
- Press Enter to copy password to clipboard
- Press Escape to hide window

Whenver you create or manipulate a specific entry, the application toggles off and the generated/edited password is always saved in your clipboard.

#### Command Mode

All commands start with `:` (colon):

| Command                          | Description                                               |
| -------------------------------- | --------------------------------------------------------- |
| `:add service;username;notes`    | Add entry (password prompted, copied to clipboard)        |
| `:addgen service;username;notes` | Generate + save strong password (copied to clipboard)     |
| `:import /path/to/file.csv`      | Import entries from CSV                                   |
| `:export`                        | Export all entries to `~/Downloads/svimpassPasswords.csv` |
| `:reset!`                        | Full reset (⚠ deletes all data and files produced)       |

## Keyboard Shortcuts

Because the floating window is the only interface available, we manipulate the application and entries with the keyboard.

| Shortcut       | Action                             |
| -------------- | ---------------------------------- |
| **Ctrl+L**     | Lock application (return to login) |
| **Ctrl+D**     | Delete selected entry              |
| **Ctrl+E**     | Edit selected entry’s password     |
| **Escape**     | Hide application window            |
| **Arrow Keys** | Navigate results                   |

### CSV Import/Export Examples

**Format:**

```csv
ServiceName,Username,Password,Notes
Gmail,user@example.com,mypassword123,Work email
GitHub,johndoe,gh_token_xyz,Development account
```

**Commands:**

- **Import**: `:import /absolute/path/to/passwords.csv`
- **Export**: `:export` (saves to `~/Downloads/svimapassPasswords.csv`)

**Requirements:**

- Header row required: `ServiceName,Username,Password,Notes`
- ServiceName, Username, Password cannot be empty
- Use absolute file paths for import
- UTF-8 encoding recommended

## Application Files

svimpass creates these files on your system:

### Data Files

- **`~/.local/share/svimpass/passwords.db`** - SQLite database storing encrypted passwords
- **`~/.config/svimpass/config.json`** - Encrypted Master password configuration

### Runtime Files

- **`$XDG_RUNTIME_DIR/svimpass/app.sock`** - Unix socket for single-instance management (This enables the --toggle flag)
- **`~/Downloads/svimapassPasswords.csv`** - CSV export file (created when using `:export` command)

### Directories

- **`~/.local/share/svimpass/`** - Main data directory (permissions: 700)
- **`~/.config/svimpass/`** - Configuration directory (permissions: 700)
- **`~/.local/share/svimpass/backups/`** - Backup directory (permissions: 700, empty by default)

**Note:** All directories use restrictive permissions (700) for security - only the user can read/write/execute. If you unistall the application these files are not automatically deleted!

## Troubleshooting

### Global Hotkeys Not Working

**Windows:**

- Check if another application is using the same hotkey combination
- Run as administrator if permissions are an issue
- Restart the application after closing other conflicting software

**macOS:**

- Grant Accessibility permissions in System Preferences > Security & Privacy > Accessibility
- Add svimpass to the list of allowed applications
- Restart the application after granting permissions

**Linux:**

- Global hotkeys are not supported due to platform limitations
- Use desktop integration or custom scripts with socket activation (--toggle flag of the binary)

### CSV Import Errors

- Verify CSV format matches the expected structure: `ServiceName,Username,Password,Notes`
- Ensure file encoding is UTF-8
- Check that required fields (ServiceName, Username, Password) are not empty
- Validate file path exists and is accessible

### Build Failures

- Verify Go 1.23+ and Node.js 16+ are installed
- Install Wails CLI: `make install-wails` or `go install github.com/wailsapp/wails/v2/cmd/wails@latest`
- Run `go mod tidy` to ensure dependencies are correct
- Check platform-specific build requirements in build scripts
- Ensure `$(go env GOPATH)/bin` is in your PATH environment variable

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup and contribution guidelines.
