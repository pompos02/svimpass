# Makefile for svimpass - Cross-platform builds with conditional hotkey support

.PHONY: help install-wails build-linux build-windows build-darwin clean dev

# Default target
help:
	@echo "Available targets:"
	@echo "  install-wails  - Install Wails CLI (required for building)"
	@echo "  build-linux    - Build for Linux (no global hotkey dependency)"
	@echo "  build-windows  - Build for Windows (with global hotkey support)"
	@echo "  build-darwin   - Build for macOS (with global hotkey support)"
	@echo "  clean          - Clean build artifacts"
	@echo "  help          - Show this help message"

# Install Wails CLI
install-wails:
	@echo "Installing Wails CLI..."
	@go install github.com/wailsapp/wails/v2/cmd/wails@latest
	@echo "Wails CLI installed successfully. Make sure $(shell go env GOPATH)/bin is in your PATH."

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


# Clean build artifacts
clean:
	@echo "Cleaning build artifacts..."
	@rm -rf build/bin/*
	@echo "Build artifacts cleaned."


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
