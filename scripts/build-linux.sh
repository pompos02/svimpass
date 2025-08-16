#!/bin/bash

# Build script for Linux - excludes hotkey dependency
set -e

echo "Building svimpass for Linux (no global hotkey support)..."

# Backup original go.mod
cp go.mod go.mod.backup

# Remove hotkey dependency from go.mod for Linux build
sed '/golang.design\/x\/hotkey/d' go.mod > go.mod.tmp && mv go.mod.tmp go.mod

# Clean go modules cache to ensure dependency is not pulled
go clean -modcache || true

# Build for Linux
echo "Running wails build for Linux..."
GOOS=linux GOARCH=amd64 wails build -tags "desktop,production,linux"

# Restore original go.mod
mv go.mod.backup go.mod

echo "Linux build completed successfully!"
echo "Binary location: build/bin/svimpass"
echo "Note: Global hotkeys not supported on Linux. Use --toggle flag."