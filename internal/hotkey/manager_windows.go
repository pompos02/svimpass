//go:build windows

package hotkey

import (
	"fmt"

	"golang.design/x/hotkey"
	"golang.design/x/hotkey/mainthread"
)

// windowsManager implements HotkeyManager for Windows systems using golang.design/x/hotkey
type windowsManager struct {
	hk             *hotkey.Hotkey
	enabled        bool
	stop           chan struct{}
	toggleCallback func()
}

// newPlatformManager creates a new Windows-specific hotkey manager
func newPlatformManager() HotkeyManager {
	return &windowsManager{
		stop: make(chan struct{}),
	}
}

// Start initializes the global hotkey (Ctrl+Alt+Space) on Windows
func (m *windowsManager) Start(toggleCallback func()) error {
	m.toggleCallback = toggleCallback
	
	// Windows hotkey registration must happen on main thread
	var startErr error
	mainthread.Init(func() {
		startErr = m.startHotkey()
	})
	return startErr
}

// startHotkey registers the global hotkey and starts listening
func (m *windowsManager) startHotkey() error {
	// Register Ctrl+Shift+Space (using available modifiers)
	m.hk = hotkey.New([]hotkey.Modifier{hotkey.ModCtrl, hotkey.ModShift}, hotkey.KeySpace)
	if err := m.hk.Register(); err != nil {
		return fmt.Errorf("failed to register hotkey Ctrl+Shift+Space: %w", err)
	}
	
	m.enabled = true
	fmt.Println("Global hotkey registered: Ctrl+Shift+Space")
	
	// Start listening for hotkey events
	go func() {
		for {
			select {
			case <-m.hk.Keydown():
				if m.toggleCallback != nil {
					m.toggleCallback()
				}
			case <-m.stop:
				return
			}
		}
	}()
	
	return nil
}

// Stop unregisters the hotkey and stops the manager
func (m *windowsManager) Stop() {
	if m.hk != nil {
		m.hk.Unregister()
		fmt.Println("Global hotkey unregistered")
	}
	
	if m.stop != nil {
		close(m.stop)
	}
	
	m.enabled = false
}

// IsEnabled returns true if the hotkey is successfully registered
func (m *windowsManager) IsEnabled() bool {
	return m.enabled
}

// GetDescription returns information about the Windows hotkey setup
func (m *windowsManager) GetDescription() string {
	if m.enabled {
		return "Global hotkey active: Ctrl+Shift+Space"
	}
	return "Global hotkey not active. Press Ctrl+Shift+Space to toggle svimpass."
}