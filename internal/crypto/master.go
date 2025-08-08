package crypto

import (
	"encoding/hex"
	"fmt"
	"os"
	"path/filepath"
	
	"password-manager/internal/paths"
)

const (
	verificationToken = "PASSWORD_MANAGER_VERIFICATION_TOKEN_2024"
	configFileName    = ".password-manager-config"
)

// MasterPasswordConfig holds the configuration for master password verification
type MasterPasswordConfig struct {
	Salt           []byte `json:"salt"`
	EncryptedToken []byte `json:"encrypted_token"`
	IsInitialized  bool   `json:"is_initialized"`
}

// MasterPasswordManager handles master password setup and verification
type MasterPasswordManager struct {
	configPath string
	config     *MasterPasswordConfig
}

// NewMasterPasswordManager creates a new master password manager (legacy)
func NewMasterPasswordManager() (*MasterPasswordManager, error) {
	homeDir, err := os.UserHomeDir()
	if err != nil {
		return nil, fmt.Errorf("failed to get home directory: %w", err)
	}

	configPath := filepath.Join(homeDir, configFileName)

	manager := &MasterPasswordManager{
		configPath: configPath,
	}

	// Load existing config or create new one
	if err := manager.loadConfig(); err != nil {
		return nil, fmt.Errorf("failed to load config: %w", err)
	}

	return manager, nil
}

// NewMasterPasswordManagerWithPaths creates a new master password manager with organized paths
func NewMasterPasswordManagerWithPaths(appPaths *paths.Paths) (*MasterPasswordManager, error) {
	configPath := appPaths.Config()

	manager := &MasterPasswordManager{
		configPath: configPath,
	}

	// Load existing config or create new one
	if err := manager.loadConfig(); err != nil {
		return nil, fmt.Errorf("failed to load config: %w", err)
	}

	return manager, nil
}

// IsInitialized returns true if the master password has been set up
func (mpm *MasterPasswordManager) IsInitialized() bool {
	return mpm.config.IsInitialized
}

// SetupMasterPassword sets up the master password for the first time
func (mpm *MasterPasswordManager) SetupMasterPassword(masterPassword string) (*EncryptionKey, error) {
	if mpm.config.IsInitialized {
		return nil, fmt.Errorf("master password already initialized")
	}

	// Generate a random salt
	salt := generateSalt()

	// Derive encryption key
	encKey := DeriveKey(masterPassword, salt)

	// Encrypt the verification token
	encryptedToken, err := encKey.Encrypt(verificationToken)
	if err != nil {
		return nil, fmt.Errorf("failed to encrypt verification token: %w", err)
	}

	// Update config
	mpm.config.Salt = salt
	mpm.config.EncryptedToken = encryptedToken
	mpm.config.IsInitialized = true

	// Save config
	if err := mpm.saveConfig(); err != nil {
		return nil, fmt.Errorf("failed to save config: %w", err)
	}

	return encKey, nil
}

// VerifyMasterPassword verifies the master password and returns the encryption key if correct
func (mpm *MasterPasswordManager) VerifyMasterPassword(masterPassword string) (*EncryptionKey, error) {
	if !mpm.config.IsInitialized {
		return nil, fmt.Errorf("master password not initialized")
	}

	// Derive key using stored salt
	encKey := DeriveKey(masterPassword, mpm.config.Salt)

	// Try to decrypt the verification token
	decryptedToken, err := encKey.Decrypt(mpm.config.EncryptedToken)
	if err != nil {
		return nil, fmt.Errorf("invalid master password")
	}

	// Verify the token matches
	if decryptedToken != verificationToken {
		return nil, fmt.Errorf("invalid master password")
	}

	// Clear the decrypted token from memory

	return encKey, nil
}

// ChangeMasterPassword changes the master password
func (mpm *MasterPasswordManager) ChangeMasterPassword(oldPassword, newPassword string) (*EncryptionKey, error) {
	// First verify the old password
	_, err := mpm.VerifyMasterPassword(oldPassword)
	if err != nil {
		return nil, fmt.Errorf("invalid old password: %w", err)
	}

	// Generate new salt
	newSalt := generateSalt()

	// Derive new encryption key
	newEncKey := DeriveKey(newPassword, newSalt)

	// Encrypt verification token with new key
	encryptedToken, err := newEncKey.Encrypt(verificationToken)
	if err != nil {
		return nil, fmt.Errorf("failed to encrypt verification token: %w", err)
	}

	// Update config
	mpm.config.Salt = newSalt
	mpm.config.EncryptedToken = encryptedToken

	// Save config
	if err := mpm.saveConfig(); err != nil {
		return nil, fmt.Errorf("failed to save config: %w", err)
	}

	return newEncKey, nil
}

// loadConfig loads the configuration from disk
func (mpm *MasterPasswordManager) loadConfig() error {
	// Check if config file exists
	if _, err := os.Stat(mpm.configPath); os.IsNotExist(err) {
		// Create new config
		mpm.config = &MasterPasswordConfig{
			IsInitialized: false,
		}
		return nil
	}

	// Read config file
	data, err := os.ReadFile(mpm.configPath)
	if err != nil {
		return fmt.Errorf("failed to read config file: %w", err)
	}

	// Parse the simple format: salt_hex:encrypted_token_hex:initialized
	parts := splitConfig(string(data))
	if len(parts) != 3 {
		return fmt.Errorf("invalid config file format")
	}

	salt, err := hex.DecodeString(parts[0])
	if err != nil {
		return fmt.Errorf("failed to decode salt: %w", err)
	}

	encryptedToken, err := hex.DecodeString(parts[1])
	if err != nil {
		return fmt.Errorf("failed to decode encrypted token: %w", err)
	}

	isInitialized := parts[2] == "true"

	mpm.config = &MasterPasswordConfig{
		Salt:           salt,
		EncryptedToken: encryptedToken,
		IsInitialized:  isInitialized,
	}

	return nil
}

// saveConfig saves the configuration to disk
func (mpm *MasterPasswordManager) saveConfig() error {
	// Create simple format: salt_hex:encrypted_token_hex:initialized
	saltHex := hex.EncodeToString(mpm.config.Salt)
	tokenHex := hex.EncodeToString(mpm.config.EncryptedToken)
	initialized := "false"
	if mpm.config.IsInitialized {
		initialized = "true"
	}

	data := fmt.Sprintf("%s:%s:%s", saltHex, tokenHex, initialized)

	// Write to file with restricted permissions (only owner can read/write)
	err := os.WriteFile(mpm.configPath, []byte(data), 0o600)
	if err != nil {
		return fmt.Errorf("failed to write config file: %w", err)
	}

	return nil
}

// splitConfig splits the config string by colons
func splitConfig(config string) []string {
	parts := make([]string, 0, 3)
	current := ""

	for _, char := range config {
		if char == ':' {
			parts = append(parts, current)
			current = ""
		} else {
			current += string(char)
		}
	}

	if current != "" {
		parts = append(parts, current)
	}

	return parts
}

// ResetMasterPassword removes the master password configuration (emergency use only)
func (mpm *MasterPasswordManager) ResetMasterPassword() error {
	if err := os.Remove(mpm.configPath); err != nil && !os.IsNotExist(err) {
		return fmt.Errorf("failed to remove config file: %w", err)
	}

	mpm.config = &MasterPasswordConfig{
		IsInitialized: false,
	}

	return nil
}
