#!/bin/bash

# Build script for Windows - includes hotkey dependency
set -e

echo "Building svimpass for Windows (with global hotkey support)..."

# Ensure hotkey dependency is available
echo "Downloading dependencies..."
go mod download
go mod tidy

# Build for Windows
echo "Running wails build for Windows..."
GOOS=windows GOARCH=amd64 wails build -tags "desktop,production,windows"

echo "Windows build completed successfully!"
echo "Binary location: build/bin/svimpass.exe"
echo "Global hotkey: Ctrl+Alt+Space"