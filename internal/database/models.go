package database

import "time"

// PasswordEntry represent a password entry

type PasswordEntry struct {
	ID                int       `db:"id"`
	ServiceName       string    `db:"service_name"`
	Username          string    `db:"username"`
	EncryptedPassword []byte    `db:"encrypted_password"`
	CreatedAt         time.Time `db:"created_at"`
	UpdatedAt         time.Time `db:"updated_at"`
	Notes             string    `db:"notes"`
}

// CreatePasswordRequest represents the data needed for a new entry
type CreatePasswordRequest struct {
	ServiceName string
	Username    string
	Password    string
	Notes       string
}

// UpdatePasswordRequest files for Password upafate
type UpdatePasswordRequest struct {
	ID          int
	ServiceName string
	Username    string
	Password    string
	Notes       string
}
