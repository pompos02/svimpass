package main

import (
	"context"
	"embed"
	"fmt"
	"net"
	"os"
	"runtime"

	"svimpass/internal/paths"

	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
)

//go:embed all:frontend/dist
var assets embed.FS

func main() {
	// Initialize application paths
	appPaths, err := paths.New()
	if err != nil {
		fmt.Printf("Failed to initialize application directories: %v\n", err)
		os.Exit(1)
	}

	// Check for --toggle flag
	if len(os.Args) > 1 && os.Args[1] == "--toggle" {
		if err := sendToggleCommand(appPaths); err != nil {
			fmt.Printf("Failed to toggle: %v\n", err)
			os.Exit(1)
		}
		return
	}

	// Create an instance of the app structure
	app := NewApp()
	app.paths = appPaths

	// Start socket listener for toggle commands
	go startSocketListener(app, appPaths)

	// Determine AlwaysOnTop setting based on platform
	// Windows has focus issues with AlwaysOnTop when combined with Frameless
	alwaysOnTop := runtime.GOOS != "windows"

	// Create application with options
	err = wails.Run(&options.App{
		Title:         "svimpass",
		Width:         600, // Exact input width
		Height:        50,  // Exact input height
		MinWidth:      400,
		MinHeight:     50,
		MaxWidth:      800,
		MaxHeight:     300,         // Allow expansion for dropdown
		Frameless:     true,        // Remove window borders/title bar
		StartHidden:   true,        // Start hidden for spotlight-like behavior
		AlwaysOnTop:   alwaysOnTop, // Stay on top like Spotlight (except on Windows)
		DisableResize: true,        // Prevent manual resize
		AssetServer: &assetserver.Options{
			Assets: assets,
		},
		BackgroundColour: &options.RGBA{R: 255, G: 255, B: 255, A: 1}, // White background
		OnStartup:        app.startup,
		OnShutdown: func(ctx context.Context) {
			app.OnShutdown(ctx)
			// Cleanup runtime files
			if err := appPaths.Cleanup(); err != nil {
				fmt.Printf("Warning: Failed to cleanup runtime files: %v\n", err)
			}
		},
		OnBeforeClose:     app.onBeforeClose,
		HideWindowOnClose: true, // Hide instead of quit when window is closed
		Bind: []any{
			app,
		},
	})
	if err != nil {
		println("Error:", err.Error())
	}
}

// Send toggle command to running instance
func sendToggleCommand(appPaths *paths.Paths) error {
	socketPath := appPaths.Socket()
	conn, err := net.Dial("unix", socketPath)
	if err != nil {
		return fmt.Errorf("application not running or socket unavailable")
	}
	defer conn.Close()

	_, err = conn.Write([]byte("toggle"))
	return err
}

// Start socket listener for toggle commands
func startSocketListener(app *App, appPaths *paths.Paths) {
	socketPath := appPaths.Socket()

	// Remove existing socket file
	err := os.Remove(socketPath)
	if err != nil {
		fmt.Printf("Error removing the existing socketfile %v", err)
	}

	listener, err := net.Listen("unix", socketPath)
	if err != nil {
		fmt.Printf("Failed to create socket listener: %v\n", err)
		return
	}
	defer listener.Close()
	defer os.Remove(socketPath)

	for {
		conn, err := listener.Accept()
		if err != nil {
			continue
		}

		go func(c net.Conn) {
			defer c.Close()

			buf := make([]byte, 1024)
			n, err := c.Read(buf)
			if err != nil {
				return
			}

			command := string(buf[:n])
			if command == "toggle" {
				// Call toggle function on main thread
				if app.ctx != nil {
					app.ToggleWindowVisibility()
				}
			}
		}(conn)
	}
}
