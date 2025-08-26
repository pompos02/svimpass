//go:build !darwin

package systray

import (
	"fmt"

	"github.com/energye/systray"
)

// InitTray initializes the system tray on non-macOS platforms
func InitTray(iconData []byte, callbacks TrayCallbacks) {
	// Try to initialize system tray in a goroutine with automatic fallback
	go tryInitTray(iconData, callbacks)
}

// tryInitTray attempts to initialize the system tray with automatic fallback
func tryInitTray(iconData []byte, callbacks TrayCallbacks) {
	// Try to run systray - if it fails, the application continues without it
	go func() {
		defer func() {
			if r := recover(); r != nil {
				// Silently continue without system tray
				fmt.Println("System tray not available, continuing without it")
			}
		}()

		systray.Run(func() {
			// Use embedded icon data
			systray.SetIcon(iconData)

			systray.SetTitle("Svimpass")
			systray.SetTooltip("Svimpass Password Manager")

			// Create menu items
			mShow := systray.AddMenuItem("Show", "Show password manager")
			mHide := systray.AddMenuItem("Hide", "Hide password manager")
			systray.AddSeparator()
			mQuit := systray.AddMenuItem("Quit", "Quit application")

			// Register click handlers
			mShow.Click(func() {
				callbacks.ShowWindow()
			})
			mHide.Click(func() {
				callbacks.HideWindow()
			})
			mQuit.Click(func() {
				systray.Quit()
				callbacks.QuitApp()
			})
		}, func() {
			// Cleanup function - called when systray stops
		})
	}()
}
