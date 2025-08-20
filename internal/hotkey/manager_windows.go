//go:build windows

package hotkey

import (
	"fmt"
	"log"

	hook "github.com/robotn/gohook"
)

// windowsManager implements HotkeyManager for Windows systems using github.com/robotn/gohook.
// It manages the lifecycle of a global hotkey by registering it directly with the library.
type windowsManager struct {
	// isRunning indicates whether the hotkey listener is active.
	isRunning bool
}

// newPlatformManager creates a new Windows-specific hotkey manager.
func newPlatformManager() HotkeyManager {
	return &windowsManager{}
}

// Start initializes and registers the global hotkey (Ctrl+Shift+P) on Windows.
func (m *windowsManager) Start(toggleCallback func()) error {
	if m.isRunning {
		return fmt.Errorf("hotkey manager is already running")
	}

	if toggleCallback == nil {
		return fmt.Errorf("toggleCallback cannot be nil")
	}

	log.Println("Registering global hotkey: Ctrl+Shift+P...")

	// Use the library's high-level Register function.
	// This function registers a callback and does not return a value.
	// The library handles all the low-level event processing internally.
	hook.Register(hook.KeyDown, []string{"ctrl", "shift", "p"}, func(e hook.Event) {
		log.Println("🔥 Ctrl+Shift+P detected!")
		toggleCallback()
	})

	// Start the event listener loop in a separate goroutine.
	// hook.Start() returns a channel that hook.Process listens on.
	go hook.Process(hook.Start())

	m.isRunning = true
	log.Println("Global hotkey system started.")

	return nil
}

// Stop stops the global event listener and effectively unregisters all hotkeys.
func (m *windowsManager) Stop() {
	if !m.isRunning {
		return
	}

	// Stop the event listener loop. This is the correct way to "unregister"
	// all listeners and clean up resources with this library.
	hook.End()

	m.isRunning = false
	log.Println("Global hotkey system stopped.")
}

// IsEnabled returns true if the hotkey is successfully registered.
func (m *windowsManager) IsEnabled() bool {
	return m.isRunning
}

// GetDescription provides a human-readable status of the hotkey manager.
func (m *windowsManager) GetDescription() string {
	if m.isRunning {
		return "Global hotkey active: Ctrl+Shift+P"
	}
	return "Global hotkey is not active."
}

