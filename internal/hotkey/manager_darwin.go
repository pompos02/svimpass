//go:build darwin

package hotkey

import (
	"fmt"

	hook "github.com/robotn/gohook"
)

// darwinManager implements HotkeyManager for macOS systems using github.com/robotn/gohook
type darwinManager struct {
	enabled        bool
	stop           chan struct{}
	toggleCallback func()
	isRunning      bool
}

// newPlatformManager creates a new macOS-specific hotkey manager
func newPlatformManager() HotkeyManager {
	return &darwinManager{
		stop: make(chan struct{}),
	}
}

// Start initializes the global hotkey (Ctrl+Shift+P) on macOS
func (m *darwinManager) Start(toggleCallback func()) error {
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

				// Log all events for analysis

				// Update modifier states based on mask
				// Common macOS modifier masks - using proper uint16 values
				// Ctrl = mask & 0x1000 or specific values
				// Shift = mask & 0x2 or other specific values
				ctrlPressed = (ev.Mask&0x1000) != 0 || (ev.Mask&0x8000) != 0
				shiftPressed = (ev.Mask&0x2) != 0 || (ev.Mask&0x4000) != 0

				// Check for Ctrl+Shift+P in multiple event types
				if ctrlPressed && shiftPressed {
					// Method 1: Check KeyDown events (Kind=4) with keycode 25 (P key)
					if ev.Kind == 4 && ev.Keycode == 25 {
						fmt.Println("CTRL+SHIFT+P DETECTED via KEYCODE 25! ")
						if m.toggleCallback != nil {
							fmt.Println(" Calling toggle callback...")
							m.toggleCallback()
						} else {
							fmt.Println(" Toggle callback is nil!")
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
func (m *darwinManager) Stop() {
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
func (m *darwinManager) IsEnabled() bool {
	return m.enabled
}

// GetDescription returns information about the macOS hotkey setup
func (m *darwinManager) GetDescription() string {
	if m.enabled {
		return "Global hotkey active: Ctrl+Shift+P"
	}
	return "Global hotkey not active. Press Ctrl+Shift+P to toggle svimpass."
}
