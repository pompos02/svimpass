package main

import (
	"context"
	"embed"

	"github.com/robotn/gohook"
	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
)

//go:embed all:frontend/dist
var assets embed.FS

// Global reference to the Wails context
var wailsCtx context.Context

func main() {
	// Create an instance of the app structure
	app := NewApp()

	// Set up global hotkey in a separate goroutine
	go setupGlobalHotkey(app)

	// Create application with options
	err := wails.Run(&options.App{
		Title:         "Password Manager",
		Width:         600, // Spotlight-like width
		Height:        50,  // Collapsed height (search input only)
		MinWidth:      400,
		MinHeight:     50,
		MaxWidth:      800,
		MaxHeight:     300,  // Allow expansion for dropdown
		Frameless:     true, // Remove window borders/title bar
		StartHidden:   true, // Start hidden for spotlight-like behavior
		AlwaysOnTop:   true, // Stay on top like Spotlight
		DisableResize: true, // Prevent manual resize
		AssetServer: &assetserver.Options{
			Assets: assets,
		},
		BackgroundColour:  &options.RGBA{R: 255, G: 255, B: 255, A: 1}, // White background
		OnStartup:         app.startup,
		OnBeforeClose:     app.onBeforeClose,
		HideWindowOnClose: true, // Hide instead of quit when window is closed
		Bind: []interface{}{
			app,
		},
	})
	if err != nil {
		println("Error:", err.Error())
	}
}

// setupGlobalHotkey sets up the Ctrl+P global hotkey
func setupGlobalHotkey(app *App) {
	// Register Ctrl+P combination - gohook handles the combination internally
	hook.Register(hook.KeyDown, []string{"p", "ctrl"}, func(e hook.Event) {
		if app.ctx != nil {
			app.ToggleWindowVisibility()
		}
	})

	s := hook.Start()
	<-hook.Process(s)
}
