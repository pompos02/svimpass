# svimpass

A minimal, spotlight-like local password manager with built-in command system and encrypted storage.

## Overview

svimpass is a cross-platform desktop password manager that provides a clean, spotlight-like interface for quick password access and management. It features AES-256-GCM encryption, global hotkey support (Windows/macOS), and a powerful command system for advanced operations.

### Key Features

- **Encrypted Storage**: AES-256-GCM encryption with PBKDF2 key derivation
- **Global Hotkeys**: Quick access via system-wide shortcuts (Windows/macOS only)
- **CSV Import/Export**: Bulk password management with standard CSV format
- **Command System**: Built-in commands for password operations
- **Cross-platform**: Native builds for Linux, Windows, and macOS
- **Spotlight Interface**: Minimal, keyboard-driven design for efficiency

## Technology Stack

- **Backend**: Go 1.23, Wails v2, SQLite
- **Frontend**: React 18, TypeScript, Vite
- **Crypto**: AES-256-GCM encryption, PBKDF2 key derivation
- **Cross-platform**: Linux, Windows, macOS (with platform-specific builds)

## Prerequisites

- **Go 1.23+**
- **Node.js 16+**
- **Wails CLI v2**: Install with `go install github.com/wailsapp/wails/v2/cmd/wails@latest`

## Installation

### Pre-built Binaries

Download the latest release for your platform from the [releases page](https://github.com/pompos02/svimpass/releases).

### Build from Source

#### Linux Build

```bash
git clone https://github.com/pompos02/svimpass
cd svimpass
make build-linux
```

#### Windows Build

```bash
git clone https://github.com/pompos02/svimpass
cd svimpass
make build-windows
```

#### macOS Build

```bash
git clone https://github.com/pompos02/svimpass
cd svimpass
make build-darwin
```

#### All Platforms

```bash
make build-all
```

Built binaries will be located in `build/bin/`.

## Platform-Specific Notes

### Linux

- **No global hotkeys**: Use `--toggle` flag while running the binary

### Windows

- **Global hotkey**: `Ctrl+Alt+Space`

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

#### Command Mode

All commands start with `:` (colon):

- **`:add service;username;notes`** - Add password entry (password prompted) (automatically saved to your clipboard)
- **`:addgen service;username;notes`** - Generate and save secure password (automatically saved to your clipboard)
- **`:import /path/to/file.csv`** - Import passwords from CSV file (full path required)
- **`:export`** - Export all passwords to CSV (saved to ~/Downloads/svimapassPasswords.csv)
- **`:reset!`** - Complete application reset (WARNING: Deletes all data)

#### Keyboard Shortcuts

- **Ctrl+L** - Lock application (return to login screen)
- **Ctrl+D** - Delete selected password entry
- **Ctrl+E** - Edit selected entry's password
- **Escape** - Hide application window
- **Arrow Keys** - Navigate through search results

### CSV Import/Export Format

The application uses a standard CSV format with the following columns:

```csv
ServiceName,Username,Password,Notes
Gmail,user@example.com,mypassword123,Work email
GitHub,johndoe,gh_token_xyz,Development account
```

**Format Requirements:**

- **Header row required**: `ServiceName,Username,Password,Notes`
- **Minimum fields**: ServiceName, Username, Password (Notes optional)
- **Empty fields**: Entries with empty required fields are skipped during import
- **Export location**: `~/Downloads/svimapassPasswords.csv`

### Global Hotkeys

#### Windows: `Ctrl+Alt+Space`

- Toggles application visibility
- Works from any application
- Requires no additional setup

#### macOS: `Ctrl+Shift+P`

- Toggles application visibility
- May require Accessibility permissions in System Preferences
- Grant permissions when prompted on first use

#### Linux: Not Supported

- Use application menu or desktop integration
- Advanced users can use socket/IPC for custom integrations
- Consider `--toggle` flag for external activation scripts

## Architecture

### Backend Structure

```
internal/
├── commands/     # Command parser and execution
├── crypto/       # Encryption and master password management
├── database/     # SQLite ORM and models
├── hotkey/       # Platform-specific global shortcuts
├── paths/        # XDG-compliant file organization
├── services/     # Business logic layer
├── csv/          # Import/export functionality
└── generator/    # Secure password generation
```

### Frontend Structure

```
frontend/src/
├── components/   # React components (LoginScreen, MainScreen, PasswordDropdown)
├── hooks/        # Custom hooks (useSimpleNavigation)
├── assets/       # Static resources
└── types.ts      # TypeScript type definitions
```

### Security Design

- **Encryption**: AES-256-GCM with authenticated encryption
- **Key Derivation**: PBKDF2 with salt for master password
- **File Permissions**: 0700 (user-only access) on all sensitive files
- **Memory Safety**: Minimal plaintext exposure in memory
- **Database**: SQLite with encrypted password storage only

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
- Install Wails CLI: `go install github.com/wailsapp/wails/v2/cmd/wails@latest`
- Run `go mod tidy` to ensure dependencies are correct
- Check platform-specific build requirements in build scripts

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup and contribution guidelines.
