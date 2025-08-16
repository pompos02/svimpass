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

	// Register Ctrl+Shift+P hotkey combination using pure register pattern
	hook.Register(hook.KeyDown, []string{"p", "ctrl", "shift"}, func(e hook.Event) {
		fmt.Println("🔥 Hotkey Ctrl+Shift+P triggered!") // Debug logging
		if m.toggleCallback != nil {
			fmt.Println("🔄 Calling toggle callback...")
			m.toggleCallback()
		} else {
			fmt.Println("❌ Toggle callback is nil!")
		}
	})

	// Start the hook event system - no manual event processing needed
	hook.Start()
	m.enabled = true
	m.isRunning = true

	fmt.Println("Global hotkey registered: Ctrl+Shift+P")

	// Simple background goroutine to handle stop signal
	go func() {
		<-m.stop
		fmt.Println("Hotkey manager stopping...")
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
