package services

import (
	"fmt"
	"svimpass/internal/csv"
	"svimpass/internal/database"
	"svimpass/internal/generator"
)

type PasswordService struct {
	db      *database.DB
	authSvc *AuthService
}

func NewPasswordService(db *database.DB, authSvc *AuthService) *PasswordService {
	return &PasswordService{
		db:      db,
		authSvc: authSvc,
	}
}

func (ps *PasswordService) SearchPasswords(query string) ([]PasswordEntryResponse, error) {
	if !ps.authSvc.IsUnlocked() {
		return nil, fmt.Errorf("the application is locked")
	}

	var entries []*database.PasswordEntry
	var err error

	if query == "" {
		entries, err = ps.db.GetAllPasswordEntries()
	} else {
		entries, err = ps.db.SearchPasswordEntries(query)
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

func (ps *PasswordService) GeneratePassword() (string, error) {
	return generator.GeneratePassword()
}

func (ps *PasswordService) GenerateAndSavePassword(req CreatePasswordRequest) (string, error) {
	if !ps.authSvc.IsUnlocked() {
		return "", fmt.Errorf("you must be logged in")
	}

	if req.ServiceName == "" || req.Username == "" {
		return "", fmt.Errorf("service name and username are required")
	}

	password, err := generator.GeneratePassword()
	if err != nil {
		return "", fmt.Errorf("failed to generate password: %w", err)
	}

	req.Password = password

	encryptedPassword, err := ps.authSvc.GetEncryptionKey().Encrypt(password)
	if err != nil {
		return "", fmt.Errorf("error encrypting the password")
	}

	entry := &database.PasswordEntry{
		ServiceName:       req.ServiceName,
		Username:          req.Username,
		EncryptedPassword: encryptedPassword,
		Notes:             req.Notes,
	}

	err = ps.db.CreatePasswordEntry(entry)
	if err != nil {
		return "", err
	}

	return password, nil
}

func (ps *PasswordService) GetPassword(id int) (string, error) {
	if !ps.authSvc.IsUnlocked() {
		return "", fmt.Errorf("app is locked")
	}

	entry, err := ps.db.GetPasswordEntry(id)
	if err != nil {
		return "", err
	}

	password, err := ps.authSvc.GetEncryptionKey().Decrypt(entry.EncryptedPassword)
	if err != nil {
		return "", err
	}

	return password, nil
}

func (ps *PasswordService) CreatePassword(req CreatePasswordRequest) error {
	if !ps.authSvc.IsUnlocked() {
		return fmt.Errorf("app is locked")
	}

	if req.ServiceName == "" || req.Username == "" || req.Password == "" {
		return fmt.Errorf("service name, username, and password are required")
	}

	encryptedPassword, err := ps.authSvc.GetEncryptionKey().Encrypt(req.Password)
	if err != nil {
		return fmt.Errorf("failed to encrypt password: %w", err)
	}

	entry := &database.PasswordEntry{
		ServiceName:       req.ServiceName,
		Username:          req.Username,
		EncryptedPassword: encryptedPassword,
		Notes:             req.Notes,
	}

	return ps.db.CreatePasswordEntry(entry)
}

func (ps *PasswordService) DeletePassword(id int) error {
	if !ps.authSvc.IsUnlocked() {
		return fmt.Errorf("app is locked")
	}

	return ps.db.DeletePasswordEntry(id)
}

func (ps *PasswordService) ImportPasswordFromCSV(filepath string) (int, error) {
	if !ps.authSvc.IsUnlocked() {
		return -1, fmt.Errorf("you must unlock the application")
	}
	return csv.ImportPasswordFromCSV(ps.db, ps.authSvc.GetEncryptionKey(), filepath)
}
