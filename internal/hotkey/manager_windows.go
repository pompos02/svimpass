//go:build windows

package hotkey

import (
	"fmt"
	"log"

	hook "github.com/robotn/gohook"
)

// windowsManager implements HotkeyManager for Windows systems using github.com/robotn/gohook.
// It manages the lifecycle of a global hotkey listener.
type windowsManager struct {
	// stop is a channel used to signal the event processing goroutine to terminate.
	stop chan struct{}
	// toggleCallback is the function executed when the hotkey is detected.
	toggleCallback func()
	// isRunning indicates whether the hotkey listener is active.
	isRunning bool
}

// newPlatformManager creates a new Windows-specific hotkey manager.
func newPlatformManager() HotkeyManager {
	return &windowsManager{}
}

// Start initializes the global hotkey (Ctrl+Shift+P) listener on Windows.
// It launches a background goroutine to monitor for the key combination.
func (m *windowsManager) Start(toggleCallback func()) error {
	if m.isRunning {
		return fmt.Errorf("hotkey manager is already running")
	}

	m.toggleCallback = toggleCallback
	m.stop = make(chan struct{})

	// Start the hook event system. It returns a channel that receives all global keyboard and mouse events.
	evChan := hook.Start()
	if evChan == nil {
		return fmt.Errorf("failed to start the gohook event system")
	}

	m.isRunning = true
	log.Println("Global hotkey system started. Listening for Ctrl+Shift+P...")

	// Launch a goroutine to process keyboard events.
	go m.processEvents(evChan)

	return nil
}

// processEvents listens on the event channel for the specific hotkey combination.
func (m *windowsManager) processEvents(evChan <-chan hook.Event) {
	for {
		select {
		// Case for receiving a keyboard/mouse event.
		case ev, ok := <-evChan:
			if !ok {
				log.Println("Event channel closed by hook system. Goroutine stopping.")
				return
			}

			// We are only interested in keyboard press events.
			if ev.Kind != hook.KeyDown {
				continue
			}

			// Check for the specific combination: Ctrl+Shift+P.
			// This uses library constants for clarity and reliability instead of magic numbers.
			isCtrlPressed := (ev.Mask & hook.MaskCtrl) != 0
			isShiftPressed := (ev.Mask & hook.MaskShift) != 0

			if isCtrlPressed && isShiftPressed && ev.Keycode == hook.KeyP {
				log.Println("🔥 Ctrl+Shift+P detected!")
				if m.toggleCallback != nil {
					// Execute the provided callback function.
					m.toggleCallback()
				} else {
					log.Println("❌ Warning: Hotkey detected but toggleCallback is nil.")
				}
			}

		// Case for receiving the stop signal from the Stop() method.
		case <-m.stop:
			log.Println("Stop signal received. Event processing goroutine is shutting down.")
			return
		}
	}
}

// Stop gracefully shuts down the hotkey listener.
// It signals the event processing goroutine to exit and then unregisters the global hook.
func (m *windowsManager) Stop() {
	if !m.isRunning {
		return
	}

	// 1. Signal our event processing goroutine to stop.
	// We close the channel, which broadcasts the signal to the receiver.
	close(m.stop)

	// 2. Unregister the global hook and clean up resources used by the gohook library.
	// This also closes the event channel, which would also stop the goroutine
	// if it hadn't already been stopped by our signal.
	hook.End()

	m.isRunning = false
	log.Println("Global hotkey system stopped.")
}

// IsEnabled returns true if the hotkey listener is currently active.
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
