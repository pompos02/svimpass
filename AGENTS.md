# Agent Guidelines for Password Manager

## Build/Test Commands
- **Build**: `wails build` (builds the entire app)
- **Dev**: `wails dev` (runs development server with hot reload)
- **Frontend only**: `cd frontend && npm run build` or `npm run dev`
- **Go build**: `go build` (builds backend only)
- **Go test**: `go test ./...` (runs all Go tests)
- **Frontend test**: No test framework configured

## Project Structure
- **Backend**: Go with Wails v2 framework, SQLite database
- **Frontend**: React + TypeScript + Vite
- **Database**: SQLite with custom ORM in `internal/database/`
- **Crypto**: Custom encryption in `internal/crypto/`

## Code Style Guidelines

### Go
- Use standard Go formatting (`gofmt`)
- Package comments start with package name
- Struct fields use PascalCase, JSON tags use camelCase
- Error handling: return errors, use `fmt.Errorf` with `%w` for wrapping
- Database models in `internal/database/models.go`

### TypeScript/React
- Use TypeScript strict mode
- Functional components with hooks
- Import Wails generated types from `../wailsjs/go/models`
- Interface names use PascalCase
- Use `export default` for components
- Error handling with try/catch blocks