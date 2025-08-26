//go:build darwin

package systray

import "fmt"

// InitTray does nothing on macOS due to AppDelegate conflicts with Wails
func InitTray(iconData []byte, callbacks TrayCallbacks) {
	fmt.Println("System tray not available on macOS due to AppDelegate conflicts, continuing without it")
}
