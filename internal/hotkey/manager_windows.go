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
	// hotkeyId stores the ID of the registered hotkey, used for unregistering.
	hotkeyId int
	// isRunning indicates whether the hotkey listener is active.
	isRunning bool
}

// newPlatformManager creates a new Windows-specific hotkey manager.
func newPlatformManager() HotkeyManager {
	return &windowsManager{
		// Initialize hotkeyId to an invalid value.
		hotkeyId: -1,
	}
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
	// This is the recommended way to handle specific hotkey combinations.
	// It handles all the low-level event processing internally.
	m.hotkeyId = hook.Register(hook.KeyDown, []string{"ctrl", "shift", "p"}, func(e hook.Event) {
		log.Println("🔥 Ctrl+Shift+P detected!")
		toggleCallback()
	})

	// Start the event listener loop.
	go hook.Process(hook.Start())

	m.isRunning = true
	log.Println("Global hotkey system started.")

	return nil
}

// Stop unregisters the hotkey and stops the manager.
func (m *windowsManager) Stop() {
	if !m.isRunning || m.hotkeyId < 0 {
		return
	}

	// Unregister the specific hotkey using its ID.
	hook.Unregister(m.hotkeyId)

	// Stop the event listener loop.
	hook.End()

	m.isRunning = false
	m.hotkeyId = -1 // Reset the ID
	log.Println("Global hotkey system stopped and unregistered.")
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
