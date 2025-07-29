package main

import (
	"context"
	"fmt"
	"os"
	"path/filepath"

	"password-manager/internal/crypto"
	"password-manager/internal/database"
)

// App struct
type App struct {
	ctx        context.Context
	db         *database.DB
	masterMgr  *crypto.MasterPasswordManager
	encKey     *crypto.EncryptionKey
	isUnlocked bool
}

type PasswordEntryResponse struct {
	ID          int    `json:"id"`
	ServiceName string `json:"serviceName"`
	Username    string `json:"username"`
	Notes       string `json:"notes"`
	CreatedAt   string `json:"createdAt"`
	UpdatedAt   string `json:"updatedAt"`
}

type CreatePasswordRequest struct {
	ServiceName string `json:"serviceName"`
	Username    string `json:"username"`
	Password    string `json:"password"`
	Notes       string `json:"notes"`
}

// NewApp creates a new App application struct
func NewApp() *App {
	return &App{}
}

// startup is called when the app starts. The context is saved
// so we can call the runtime methods
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
	masterMgr, err := crypto.NewMasterPasswordManager()
	if err != nil {
		fmt.Printf("Error initializing the Master Password: %v \n", err)
		return
	}
	a.masterMgr = masterMgr

	// init the db
	homeDir, err := os.UserHomeDir()
	if err != nil {
		fmt.Printf("Error reading the user directory: %v \n", err)
		return
	}

	dbPath := filepath.Join(homeDir, ".password-manager.db")
	db, err := database.NewDB(dbPath)
	if err != nil {
		fmt.Printf("Error initializing thr db : %v", err)
	}
	a.db = db
}

func (a *App) OnShutdown(ctx context.Context) {
	if a.db != nil {
		a.db.Close()
	}
}

func (a *App) IsInitialized() bool {
	if a.masterMgr == nil {
		return false
	}
	return a.masterMgr.IsInitialized()
}

// SetupMasterPassword sets up the master password for first time
func (a *App) SetupMasterPassword(password, confirmPassword string) error {
	if password != confirmPassword {
		return fmt.Errorf("passwords do not match")
	}

	// if len(password) < 8 {
	// 	return fmt.Errorf("password must be at least 8 characters long")
	// }

	encKey, err := a.masterMgr.SetupMasterPassword(password)
	if err != nil {
		return err
	}

	a.encKey = encKey
	a.isUnlocked = true
	return nil
}

func (a *App) UnlockApp(password string) error {
	encKey, err := a.masterMgr.VerifyMasterPassword(password)
	if err != nil {
		fmt.Printf("Error verifying the password: %v", err)
		return err
	}

	a.encKey = encKey
	a.isUnlocked = true

	return nil
}

func (a *App) LockApp() {
	if a.encKey != nil {
		a.encKey = nil
	}
	a.isUnlocked = false
}

// IsUnlocked returns true if the app is unlocked
func (a *App) IsUnlocked() bool {
	return a.isUnlocked
}

func (a *App) SearchPasswords(query string) ([]PasswordEntryResponse, error) {
	if !a.isUnlocked {
		return nil, fmt.Errorf("The application is locked!")
	}

	var entries []*database.PasswordEntry
	var err error

	if query == "" {
		entries, err = a.db.GetAllPasswordEntries()
	} else {
		entries, err = a.db.SearchPasswordEntries(query)
	}

	if err != nil {
		return nil, err
	}

	response := make([]PasswordEntryResponse, len(entries))
	for i, entry := range entries {
		response[i] = PasswordEntryResponse{
			ID:          entry.ID,
			ServiceName: entry.ServiceName,
			Username:    entry.Username,
			Notes:       entry.Notes,
			CreatedAt:   entry.CreatedAt.Format("2006-01-02 15:04:05"),
			UpdatedAt:   entry.UpdatedAt.Format("2006-01-02 15:04:05"),
		}
	}

	return response, nil
}

func (a *App) GetPassword(id int) (string, error) {
	if !a.isUnlocked {
		return "", fmt.Errorf("app is locked")
	}

	entry, err := a.db.GetPasswordEntry(id)
	if err != nil {
		return "", err
	}

	password, err := a.encKey.Decrypt(entry.EncryptedPassword)
	if err != nil {
		return "", err
	}

	return password, nil
}

func (a *App) CreatePassword(req CreatePasswordRequest) error {
	if !a.isUnlocked {
		return fmt.Errorf("app is locked")
	}

	if req.ServiceName == "" || req.Username == "" || req.Password == "" {
		return fmt.Errorf("service name, username, and password are required")
	}

	// Encrypt the password
	encryptedPassword, err := a.encKey.Encrypt(req.Password)
	if err != nil {
		return fmt.Errorf("failed to encrypt password: %w", err)
	}

	entry := &database.PasswordEntry{
		ServiceName:       req.ServiceName,
		Username:          req.Username,
		EncryptedPassword: encryptedPassword,
		Notes:             req.Notes,
	}

	return a.db.CreatePasswordEntry(entry)
}

func (a *App) DeletePassword(id int) error {
	if !a.isUnlocked {
		return fmt.Errorf("app is locked")
	}

	return a.db.DeletePasswordEntry(id)
}

// Greet returns a greeting for the given name
func (a *App) Greet(name string) string {
	return fmt.Sprintf("Hello %s, It's show time!", name)
}
