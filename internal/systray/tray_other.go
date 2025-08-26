//go:build !darwin

package systray

import (
	"fmt"

	"github.com/energye/systray"
)

// InitTray initializes the system tray on non-macOS platforms
func InitTray(iconData []byte, callbacks TrayCallbacks) {
	// Remove double goroutine nesting - systray.Run is already designed to be blocking
	defer func() {
		if r := recover(); r != nil {
			fmt.Printf("System tray initialization failed: %v\n", r)
			fmt.Println("Continuing without system tray")
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
		fmt.Println("System tray stopped")
	})
}
