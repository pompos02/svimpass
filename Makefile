# Makefile for svimpass - Cross-platform builds with conditional hotkey support

.PHONY: help build-linux build-windows build-darwin build-all clean test dev

# Default target
help:
	@echo "Available targets:"
	@echo "  build-linux    - Build for Linux (no global hotkey dependency)"
	@echo "  build-windows  - Build for Windows (with global hotkey support)"
	@echo "  build-darwin   - Build for macOS (with global hotkey support)"
	@echo "  build-all      - Build for all platforms"
	@echo "  clean          - Clean build artifacts"
	@echo "  test          - Run tests"
	@echo "  dev           - Start development mode"
	@echo "  help          - Show this help message"

# Linux build - excludes hotkey dependency
build-linux:
	@echo "Building for Linux..."
	@./scripts/build-linux.sh

# Windows build - includes hotkey dependency
build-windows:
	@echo "Building for Windows..."
	@./scripts/build-windows.sh

# macOS build - includes hotkey dependency
build-darwin:
	@echo "Building for macOS..."
	@./scripts/build-darwin.sh

# Build for all platforms
build-all: build-linux build-windows build-darwin
	@echo "All platform builds completed!"

# Clean build artifacts
clean:
	@echo "Cleaning build artifacts..."
	@rm -rf build/bin/*
	@echo "Build artifacts cleaned."

# Run tests
test:
	@echo "Running tests..."
	@go test ./...

# Development mode
dev:
	@echo "Starting development mode..."
	@wails dev

# Install dependencies (platform-specific)
deps-linux:
	@echo "Installing Linux dependencies (no hotkey library)..."
	@cp go.mod go.mod.backup
	@sed '/golang.design\/x\/hotkey/d' go.mod > go.mod.tmp && mv go.mod.tmp go.mod
	@go mod tidy
	@mv go.mod.backup go.mod

deps-windows:
	@echo "Installing Windows dependencies (including hotkey library)..."
	@go mod download
	@go mod tidy

deps-darwin:
	@echo "Installing macOS dependencies (including hotkey library)..."
	@go mod download
	@go mod tidy