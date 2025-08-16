package hotkey

// HotkeyManager defines the interface for hotkey management across platforms
type HotkeyManager interface {
	// Start initializes the hotkey manager and begins listening for hotkeys
	Start(toggleCallback func()) error
	
	// Stop cleanly shuts down the hotkey manager
	Stop()
	
	// IsEnabled returns true if global hotkeys are supported and active on this platform
	IsEnabled() bool
	
	// GetDescription returns a human-readable description of the hotkey setup
	GetDescription() string
}

// NewManager creates a platform-specific hotkey manager
func NewManager() HotkeyManager {
	return newPlatformManager()
}