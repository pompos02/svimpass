#!/bin/bash

# Build script for macOS - includes hotkey dependency
set -e

echo "Building svimpass for macOS (with global hotkey support)..."

# Ensure hotkey dependency is available
echo "Downloading dependencies..."
go mod download
go mod tidy

# Build for macOS
echo "Running wails build for macOS..."
GOOS=darwin GOARCH=amd64 wails build -tags "desktop,production,darwin"

echo "macOS build completed successfully!"
echo "Binary location: build/bin/svimpass.app"
echo "Global hotkey: Ctrl+Shift+P"
