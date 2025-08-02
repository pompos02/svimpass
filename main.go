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
		Title:            "Password Manager",
		Width:            1024,
		Height:           768,
		AssetServer: &assetserver.Options{
			Assets: assets,
		},
		BackgroundColour: &options.RGBA{R: 27, G: 38, B: 54, A: 1},
		OnStartup:        app.startup,
		OnBeforeClose:    app.onBeforeClose,
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
	hook.Register(hook.KeyDown, []string{"ctrl", "p"}, func(e hook.Event) {
		if app.ctx != nil {
			app.ToggleWindowVisibility()
		}
	})

	s := hook.Start()
	<-hook.Process(s)
}
