//go:build darwin

package hotkey

import (
	"fmt"

	"golang.design/x/hotkey"
	"golang.design/x/hotkey/mainthread"
)

// darwinManager implements HotkeyManager for macOS systems using golang.design/x/hotkey
type darwinManager struct {
	hk             *hotkey.Hotkey
	enabled        bool
	stop           chan struct{}
	toggleCallback func()
}

// newPlatformManager creates a new macOS-specific hotkey manager
func newPlatformManager() HotkeyManager {
	return &darwinManager{
		stop: make(chan struct{}),
	}
}

// Start initializes the global hotkey (Cmd+Space) on macOS
func (m *darwinManager) Start(toggleCallback func()) error {
	m.toggleCallback = toggleCallback
	
	// macOS hotkey registration requires main thread
	var startErr error
	mainthread.Init(func() {
		startErr = m.startHotkey()
	})
	return startErr
}

// startHotkey registers the global hotkey and starts listening
func (m *darwinManager) startHotkey() error {
	// Register Ctrl+Shift+Space (more compatible across platforms)
	// Note: macOS Command key is typically mapped to Mod1 in X11 systems
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
func (m *darwinManager) Stop() {
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
func (m *darwinManager) IsEnabled() bool {
	return m.enabled
}

// GetDescription returns information about the macOS hotkey setup
func (m *darwinManager) GetDescription() string {
	if m.enabled {
		return "Global hotkey active: Ctrl+Shift+Space"
	}
	return "Global hotkey not active. Press Ctrl+Shift+Space to toggle svimpass."
}