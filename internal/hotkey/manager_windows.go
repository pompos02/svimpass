//go:build windows

package hotkey

import (
	"fmt"

	hook "github.com/robotn/gohook"
)

// windowsManager implements HotkeyManager for Windows systems using github.com/robotn/gohook
type windowsManager struct {
	enabled        bool
	stop           chan struct{}
	toggleCallback func()
	isRunning      bool
}

// newPlatformManager creates a new Windows-specific hotkey manager
func newPlatformManager() HotkeyManager {
	return &windowsManager{
		stop: make(chan struct{}),
	}
}

// Start initializes the global hotkey (Ctrl+Shift+P) on Windows
func (m *windowsManager) Start(toggleCallback func()) error {
	if m.isRunning {
		return fmt.Errorf("hotkey manager already running")
	}

	m.toggleCallback = toggleCallback

	// Start the hook event system and capture the channel for raw processing
	evChan := hook.Start()

	if evChan == nil {
		return fmt.Errorf("failed to start hook system")
	}

	m.enabled = true
	m.isRunning = true

	fmt.Println("Global hotkey system started: Ctrl+Shift+P")

	// Process raw events and manually detect Ctrl+Shift+P
	go func() {
		// Track modifier states
		ctrlPressed := false
		shiftPressed := false

		for {
			select {
			case ev, ok := <-evChan:
				if !ok {
					fmt.Println("Event channel closed!")
					return
				}

				// Windows modifier masks (different from macOS)
				// Ctrl = mask & 0x0008 (left) or mask & 0x0004 (right)
				// Shift = mask & 0x0001 (left) or mask & 0x0002 (right)
				ctrlPressed = (ev.Mask&0x0008) != 0 || (ev.Mask&0x0004) != 0
				shiftPressed = (ev.Mask&0x0001) != 0 || (ev.Mask&0x0002) != 0

				// Check for Ctrl+Shift+P combination
				if ctrlPressed && shiftPressed {
					// Check KeyDown events (Kind=4) with keycode for P key
					// Windows P key typically has keycode 80 or virtual key code 0x50
					if ev.Kind == 4 && (ev.Keycode == 80 || ev.Keycode == 0x50 || ev.Rawcode == 0x50) {
						fmt.Println("🔥 CTRL+SHIFT+P DETECTED on Windows!")
						if m.toggleCallback != nil {
							fmt.Println("🔄 Calling toggle callback...")
							m.toggleCallback()
						} else {
							fmt.Println("❌ Toggle callback is nil!")
						}
					}
				}
			case <-m.stop:
				fmt.Println("Event processor stopping...")
				return
			}
		}
	}()

	return nil
}

// Stop unregisters the hotkey and stops the manager
func (m *windowsManager) Stop() {
	if !m.isRunning {
		return
	}

	// End the hook system
	hook.End()
	fmt.Println("Global hotkey unregistered")

	if m.stop != nil {
		close(m.stop)
	}

	m.enabled = false
	m.isRunning = false
}

// IsEnabled returns true if the hotkey is successfully registered
func (m *windowsManager) IsEnabled() bool {
	return m.enabled
}

// GetDescription returns information about the Windows hotkey setup
func (m *windowsManager) GetDescription() string {
	if m.enabled {
		return "Global hotkey active: Ctrl+Shift+P"
	}
	return "Global hotkey not active. Press Ctrl+Shift+P to toggle svimpass."
}
