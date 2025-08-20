# svimpass

A minimal, spotlight-like local password manager with built-in command system and encrypted storage.

## Overview

svimpass is a cross-platform desktop password manager that provides a clean, spotlight-like interface for quick password access and management. It features AES-256-GCM encryption, global hotkey support (Windows/macOS), and a powerful command system for advanced operations.

### Key Features

- **Encrypted Storage**: AES-256-GCM encryption with PBKDF2 key derivation
- **Global Hotkeys**: Quick access via system-wide shortcuts
- **CSV Import/Export**: Bulk password management with standard CSV format
- **Command System**: Built-in commands for password operations
- **Spotlight Interface**: Minimal, keyboard-driven design for efficiency

## Technology Stack

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

### Build from Source

### Pre-built Binaries

Download the latest release for your platform from the [releases page](https://github.com/pompos02/svimpass/releases).

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

   #### Windows Build

   ```bash
   make build-windows
   ```

   #### macOS Build

   ```bash
   make build-darwin
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
- Install Wails CLI: `make install-wails` or `go install github.com/wailsapp/wails/v2/cmd/wails@latest`
- Run `go mod tidy` to ensure dependencies are correct
- Check platform-specific build requirements in build scripts
- Ensure `$(go env GOPATH)/bin` is in your PATH environment variable

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup and contribution guidelines.
