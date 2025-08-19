# Contributing to svimpass

Thank you for your interest in contributing to svimpass! This guide will help you get started with development and understand our contribution process.

## Development Setup

### Prerequisites

- **Go 1.23+**
- **Node.js 16+**
- **Wails CLI v2**: `go install github.com/wailsapp/wails/v2/cmd/wails@latest`
- **Git**

### Clone and Setup

```bash
git clone https://github.com/your-username/svimpass
cd svimpass
go mod download
cd frontend && npm install && cd ..
```

### Development Workflow

#### Platform-Specific Development Builds

````bash
# Build for your current platform
make build-linux    # Linux (no global hotkeys)
make build-windows  # Windows (with global hotkeys)
make build-darwin   # macOS (with global hotkeys)


#### Running Tests
```bash
# Go backend tests
go test ./...

# Note: Frontend tests not yet implemented
````

## Project Architecture

### System Overview

svimpass uses the **Wails v2 framework** which combines:

- **Go backend**: Business logic, database, encryption, system integration
- **React frontend**: User interface, component management
- **IPC Communication**: Method bindings and events between frontend/backend

### Data Flow

```
Frontend → App (app.go) → Services → Database
                    ↓
              Commands → Parser → Execution
```

### Backend Architecture

```
internal/
├── commands/         # Command parser and execution system
│   ├── commands.go   # Command implementations (Add, Import, Export, Reset)
│   ├── interface.go  # Command interface definition
│   └── parser.go     # Command parsing logic
├── crypto/           # Encryption and master password management
│   ├── encryption.go # AES-256-GCM encryption/decryption
│   └── master.go     # PBKDF2 key derivation, master password handling
├── database/         # SQLite ORM and models
│   ├── db.go         # Database connection, CRUD operations
│   └── models.go     # PasswordEntry struct, request types
├── hotkey/           # Platform-specific global shortcuts
│   ├── interface.go          # Common hotkey interface
│   ├── manager_linux.go      # Linux implementation (no-op)
│   ├── manager_windows.go    # Windows hotkey implementation
│   └── manager_darwin.go     # macOS hotkey implementation
├── paths/            # XDG-compliant file organization
│   └── paths.go      # Config, data, cache directory management
├── services/         # Business logic layer
│   ├── auth.go       # Authentication service (login/unlock)
│   ├── password.go   # Password service (CRUD, generation)
│   └── types.go      # Service request/response types
├── csv/              # Import/export functionality
│   ├── exporter.go   # CSV export logic
│   └── importer.go   # CSV import with validation
└── generator/        # Secure password generation
    └── generator.go  # Cryptographically secure random passwords
```

### Frontend Architecture

```
frontend/src/
├── components/
│   ├── LoginScreen.tsx      # Master password entry
│   ├── MainScreen.tsx       # Main application interface
│   └── PasswordDropdown.tsx # Search results display
├── hooks/
│   └── useSimpleNavigation.ts # Keyboard navigation logic
├── assets/           # Static resources (fonts, images)
├── types.ts          # TypeScript type definitions
└── main.tsx          # Application entry point
```

**Key Frontend Patterns:**

- **Functional components** with React hooks
- **TypeScript strict mode** for type safety
- **Wails bindings** for backend communication
- **Event-driven architecture** for window management

### Security Architecture

#### Encryption Layer

- **Algorithm**: AES-256-GCM (authenticated encryption)
- **Key Derivation**: PBKDF2 with 100,000 iterations + salt
- **Implementation**: `internal/crypto/encryption.go`

#### File Security

- **Permissions**: 0700 (user-only) on all sensitive files
- **Location**: XDG-compliant directories (Linux) or platform equivalents
- **Database**: SQLite with only encrypted passwords stored

#### Memory Safety

- Master key handling in `internal/crypto/master.go`
- Minimal plaintext exposure
- **TODO**: Implement memory zeroing for enhanced security

## Code Organization and Standards

### Go Backend Standards

#### Code Style

```go
// Use standard Go formatting
go fmt ./...

// Package comments start with package name
// Package database handles all database operations
package database

// Struct fields: PascalCase with JSON tags in camelCase
type PasswordEntry struct {
    ID                int       `db:"id" json:"id"`
    ServiceName       string    `db:"service_name" json:"serviceName"`
    Username          string    `db:"username" json:"username"`
    EncryptedPassword []byte    `db:"encrypted_password" json:"-"`
    CreatedAt         time.Time `db:"created_at" json:"createdAt"`
}
```

#### Error Handling

```go
// Return errors, don't panic
func (s *PasswordService) CreatePassword(req CreatePasswordRequest) error {
    if req.ServiceName == "" {
        return fmt.Errorf("service name is required")
    }

    // Wrap errors with context
    if err := s.db.CreatePasswordEntry(entry); err != nil {
        return fmt.Errorf("failed to create password entry: %w", err)
    }

    return nil
}
```

#### Database Models

- All models in `internal/database/models.go`
- Use struct tags for both database and JSON serialization
- Implement proper validation in service layer

#### Type Definitions

```typescript
// Use generated Wails types
import { services } from "../wailsjs/go/models";

// Extend with local types as needed
interface LocalPasswordEntry extends services.PasswordEntryResponse {
  isSelected?: boolean;
  displayName?: string;
}
```

### Build System

#### Makefile Targets

- `make help` - Show all available commands
- `make dev` - Start development mode
- `make test` - Run all tests
- `make build-linux` - Linux build (excludes hotkey dependencies)
- `make build-windows` - Windows build (includes hotkeys)
- `make build-darwin` - macOS build (includes hotkeys)
- `make clean` - Clean build artifacts

#### Platform-Specific Builds

The build system handles conditional compilation for global hotkey support:

**Linux Build (`scripts/build-linux.sh`)**:

```bash
# Removes hotkey dependencies from go.mod temporarily as i had problems with this dependency in my wayland based env
sed '/golang.design\/x\/hotkey/d' go.mod > go.mod.tmp && mv go.mod.tmp go.mod
GOOS=linux GOARCH=amd64 wails build -tags "desktop,production,linux"
```

**Windows/macOS Build**:

```bash
# Includes all dependencies including hotkey support
GOOS=windows GOARCH=amd64 wails build -tags "desktop,production,windows"
```

### Wails Configuration

The `wails.json` file defines build and development settings:

```json
{
  "name": "svimpass",
  "outputfilename": "svimpass",
  "frontend:install": "npm install",
  "frontend:build": "npm run build",
  "frontend:dev:watcher": "npm run dev",
  "frontend:dev:serverUrl": "auto"
}
```

## Development Workflow

### 1. Fork and Clone

```bash
git clone https://github.com/your-username/svimpass
cd svimpass
```

### 2. Create Feature Branch

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/issue-description
```

### 3. Development Setup

```bash
# Install dependencies
go mod download
cd frontend && npm install && cd ..

# Built and test
make ....
```

### 4. Make Changes

- Follow the coding standards above
- Add tests for new functionality
- Update documentation if needed

### 5. Test Your Changes

```bash
# Run Go tests
go test ./...

# Test builds for your platform
make build-linux   # or build-windows/build-darwin

# Test the built binary
./build/bin/svimpass
```

### 6. Commit and Push

```bash
git add .
git commit -m "feat: add new feature description"
git push origin feature/your-feature-name
```

### 7. Create Pull Request

## API Reference

### Go Backend Methods

#### App Methods (app.go)

```go
// Authentication
func (a *App) SetupMasterPassword(password, confirmPassword string) error
func (a *App) UnlockApp(password string) error
func (a *App) LockApp()
func (a *App) IsUnlocked() bool

// Password Management
func (a *App) SearchPasswords(query string) ([]services.PasswordEntryResponse, error)
func (a *App) CreatePassword(req services.CreatePasswordRequest) error
func (a *App) GetPassword(id int) (string, error)
func (a *App) UpdatePassword(id int, newpassword string) error
func (a *App) DeletePassword(id int) error

// Password Generation
func (a *App) GeneratePassword() (string, error)
func (a *App) GenerateAndSavePassword(req services.CreatePasswordRequest) (string, error)

// Import/Export
func (a *App) ImportPasswordFromCSV(filepath string) (int, error)

// Window Management
func (a *App) ShowSpotlight()
func (a *App) HideSpotlight()
func (a *App) ToggleWindow()
func (a *App) ResizeWindow(width, height int)

// Command System
func (a *App) ExecuteCommand(input string) (any, error)
```

#### Command System API

**Parser Interface:**

```go
func ParseCommand(input string, passwordSvc *services.PasswordService, paths *paths.Paths) (Command, error)
```

**Command Interface:**

```go
type Command interface {
    Execute(ctx context.Context) (any, error)
}
```

**Supported Commands:**

- `:add service;username;notes` - Manual password entry
- `:addgen service;username;notes` - Generated password
- `:import /path/to/file.csv` - CSV import
- `:export` - CSV export
- `:reset!` - Application reset

### Database Schema

#### PasswordEntry Table

```sql
CREATE TABLE password_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    service_name TEXT NOT NULL,
    username TEXT NOT NULL,
    encrypted_password BLOB NOT NULL,
    notes TEXT DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_service_name ON password_entries(service_name);
CREATE INDEX idx_username ON password_entries(username);
```

## Testing Guidelines

### Build Issues

#### Linux Build Failing

- **Cause**: Hotkey dependencies not properly excluded
- **Solution**: Run `make build-linux` which handles dependency management

#### Windows Cross-Compilation Issues

- **Cause**: CGO dependencies for SQLite
- **Solution**: Build on Windows machine or use Docker with Windows build environment

#### Wails CLI Not Found

- **Cause**: Wails CLI not in PATH
- **Solution**: `go install github.com/wailsapp/wails/v2/cmd/wails@latest`

### Runtime Issues

#### Window Not Showing on Linux

- **Cause**: X11 display issues or window manager compatibility
- **Solution**: Check DISPLAY environment variable, test with different WM

#### Permission Errors on macOS

- **Cause**: Gatekeeper or missing Accessibility permissions
- **Solution**: Allow app in System Preferences, grant Accessibility permissions

## Project Roadmap and Needs

Thank you for contributing to svimpass!
