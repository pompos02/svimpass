//go:build linux

package hotkey

import "fmt"

// linuxManager implements HotkeyManager for Linux systems
// Linux builds do not include global hotkey support - users should use --toggle flag
type linuxManager struct {
	enabled bool
}

// newPlatformManager creates a new Linux-specific hotkey manager
func newPlatformManager() HotkeyManager {
	return &linuxManager{enabled: false}
}

// Start does nothing on Linux - global hotkeys are not supported
func (m *linuxManager) Start(toggleCallback func()) error {
	fmt.Println("Global hotkey not available on Linux. Use --toggle flag or configure external hotkey tools.")
	return nil
}

// Stop does nothing on Linux as there's nothing to stop
func (m *linuxManager) Stop() {
	// Nothing to stop
}

// IsEnabled always returns false for Linux builds
func (m *linuxManager) IsEnabled() bool {
	return false
}

// GetDescription returns information about Linux hotkey setup
func (m *linuxManager) GetDescription() string {
	return "Global hotkeys not supported on Linux. Use '--toggle' flag or configure external hotkey tools like xbindkeys, sxhkd, or your desktop environment's hotkey settings."
}