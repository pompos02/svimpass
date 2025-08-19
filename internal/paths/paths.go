package paths

import (
	"fmt"
	"os"
	"path/filepath"
)

const appName = "svimpass"

// Paths holds all application directory paths
type Paths struct {
	DataDir    string // ~/.local/share/svimpass
	ConfigDir  string // ~/.config/svimpass
	RuntimeDir string // $XDG_RUNTIME_DIR/svimpass or ~/.local/share/svimpass/runtime
}

// New creates and initializes application directories
func New() (*Paths, error) {
	homeDir, err := os.UserHomeDir()
	if err != nil {
		return nil, err
	}

	paths := &Paths{
		DataDir:    getXDGDataDir(homeDir),
		ConfigDir:  getXDGConfigDir(homeDir),
		RuntimeDir: getXDGRuntimeDir(homeDir),
	}

	// Create directories if they don't exist
	if err := paths.EnsureDirectories(); err != nil {
		return nil, err
	}

	return paths, nil
}

// Database returns the path to the SQLite database file
func (p *Paths) Database() string {
	return filepath.Join(p.DataDir, "passwords.db")
}

// Config returns the path to the master password config file
func (p *Paths) Config() string {
	return filepath.Join(p.ConfigDir, "config.json")
}

// Socket returns the path to the Unix domain socket
func (p *Paths) Socket() string {
	return filepath.Join(p.RuntimeDir, "app.sock")
}

// BackupDir returns the path to the backup directory
func (p *Paths) BackupDir() string {
	return filepath.Join(p.DataDir, "backups")
}

// EnsureDirectories creates all necessary directories with proper permissions
func (p *Paths) EnsureDirectories() error {
	directories := []struct {
		path string
		perm os.FileMode
	}{
		{p.DataDir, 0o700},     // User only - contains sensitive database
		{p.ConfigDir, 0o700},   // User only - contains master password config
		{p.RuntimeDir, 0o700},  // User only - contains socket
		{p.BackupDir(), 0o700}, // User only - contains database backups
	}

	for _, dir := range directories {
		if err := os.MkdirAll(dir.path, dir.perm); err != nil {
			return err
		}
	}

	return nil
}

// getXDGDataDir returns XDG_DATA_HOME/appName or ~/.local/share/appName
func getXDGDataDir(homeDir string) string {
	if dataHome := os.Getenv("XDG_DATA_HOME"); dataHome != "" {
		return filepath.Join(dataHome, appName)
	}
	return filepath.Join(homeDir, ".local", "share", appName)
}

// getXDGConfigDir returns XDG_CONFIG_HOME/appName or ~/.config/appName
func getXDGConfigDir(homeDir string) string {
	if configHome := os.Getenv("XDG_CONFIG_HOME"); configHome != "" {
		return filepath.Join(configHome, appName)
	}
	return filepath.Join(homeDir, ".config", appName)
}

// getXDGRuntimeDir returns XDG_RUNTIME_DIR/appName or fallback to data dir
func getXDGRuntimeDir(homeDir string) string {
	if runtimeDir := os.Getenv("XDG_RUNTIME_DIR"); runtimeDir != "" {
		return filepath.Join(runtimeDir, appName)
	}
	// Fallback to data directory runtime subdirectory
	return filepath.Join(getXDGDataDir(homeDir), "runtime")
}

// Cleanup removes runtime files (should be called on app shutdown)
func (p *Paths) Cleanup() error {
	// Remove socket file
	socketPath := p.Socket()
	if err := os.Remove(socketPath); err != nil && !os.IsNotExist(err) {
		return err
	}

	// If using XDG_RUNTIME_DIR, try to remove the directory if empty
	if runtimeDir := os.Getenv("XDG_RUNTIME_DIR"); runtimeDir != "" {
		// Only remove if directory is empty (ignore error if not empty)
		os.Remove(p.RuntimeDir)
	}

	return nil
}

func (p *Paths) ResetAll() error {
	files := []string{
		p.Database(),
		p.Config(),
		p.Socket(),
	}

	for _, file := range files {
		err := os.Remove(file)
		if err != nil && !os.IsNotExist(err) {
			return fmt.Errorf("error deleting file %s with error %w", file, err)
		}
	}

	directories := []string{
		p.BackupDir(), // ~/.local/share/svimpass/backups
		p.RuntimeDir,  // runtime directory
		p.ConfigDir,   // ~/.config/svimpass
		p.DataDir,     // ~/.local/share/svimpass
	}

	for _, dir := range directories {
		err := os.RemoveAll(dir)
		if err != nil && !os.IsNotExist(err) {
			return fmt.Errorf("error deleting direcotry  %s with error %w", dir, err)
		}
	}
	return nil
}
