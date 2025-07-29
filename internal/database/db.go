package database

import (
	"database/sql"
	"fmt"
	"time"

	_ "github.com/mattn/go-sqlite3"
)

type DB struct {
	conn *sql.DB
}

// NewDB creates a new database connection and initializes the schema
func NewDB(dbPath string) (*DB, error) {
	conn, err := sql.Open("sqlite3", dbPath)
	if err != nil {
		return nil, fmt.Errorf("failed to open database: %w", err)
	}

	db := &DB{conn: conn}

	if err := db.createTables(); err != nil {
		return nil, fmt.Errorf("failed to create tables: %w", err)
	}

	return db, nil
}

// createTables creates the necessary tables if they don't exist
func (db *DB) createTables() error {
	query := `
	CREATE TABLE IF NOT EXISTS password_entries (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		service_name TEXT NOT NULL,
		username TEXT NOT NULL,
		encrypted_password BLOB NOT NULL,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		notes TEXT DEFAULT ''
	);

	CREATE INDEX IF NOT EXISTS idx_service_name ON password_entries(service_name);
	CREATE INDEX IF NOT EXISTS idx_username ON password_entries(username);
	`

	_, err := db.conn.Exec(query)
	return err
}

// CreatePasswordEntry creates a new password entry in the database
func (db *DB) CreatePasswordEntry(entry *PasswordEntry) error {
	query := `
	INSERT INTO password_entries (service_name, username, encrypted_password, notes, created_at, updated_at)
	VALUES (?, ?, ?, ?, ?, ?)
	`

	now := time.Now()
	result, err := db.conn.Exec(query,
		entry.ServiceName,
		entry.Username,
		entry.EncryptedPassword,
		entry.Notes,
		now,
		now,
	)
	if err != nil {
		return fmt.Errorf("failed to create password entry: %w", err)
	}

	id, err := result.LastInsertId()
	if err != nil {
		return fmt.Errorf("failed to get last insert id: %w", err)
	}

	entry.ID = int(id)
	entry.CreatedAt = now
	entry.UpdatedAt = now

	return nil
}

// GetPasswordEntry retrieves a password entry by ID
func (db *DB) GetPasswordEntry(id int) (*PasswordEntry, error) {
	query := `
	SELECT id, service_name, username, encrypted_password, created_at, updated_at, notes
	FROM password_entries WHERE id = ?
	`

	entry := &PasswordEntry{}
	err := db.conn.QueryRow(query, id).Scan(
		&entry.ID,
		&entry.ServiceName,
		&entry.Username,
		&entry.EncryptedPassword,
		&entry.CreatedAt,
		&entry.UpdatedAt,
		&entry.Notes,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("password entry not found")
		}
		return nil, fmt.Errorf("failed to get password entry: %w", err)
	}

	return entry, nil
}

// GetAllPasswordEntries retrieves all password entries
func (db *DB) GetAllPasswordEntries() ([]*PasswordEntry, error) {
	query := `
	SELECT id, service_name, username, encrypted_password, created_at, updated_at, notes
	FROM password_entries ORDER BY service_name, username
	`

	rows, err := db.conn.Query(query)
	if err != nil {
		return nil, fmt.Errorf("failed to query password entries: %w", err)
	}
	defer rows.Close()

	var entries []*PasswordEntry
	for rows.Next() {
		entry := &PasswordEntry{}
		err := rows.Scan(
			&entry.ID,
			&entry.ServiceName,
			&entry.Username,
			&entry.EncryptedPassword,
			&entry.CreatedAt,
			&entry.UpdatedAt,
			&entry.Notes,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan password entry: %w", err)
		}
		entries = append(entries, entry)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating over rows: %w", err)
	}

	return entries, nil
}

// SearchPasswordEntries searches for password entries by service name or username
func (db *DB) SearchPasswordEntries(searchTerm string) ([]*PasswordEntry, error) {
	query := `
	SELECT id, service_name, username, encrypted_password, created_at, updated_at, notes
	FROM password_entries 
	WHERE service_name LIKE ? OR username LIKE ?
	ORDER BY service_name, username
	`

	searchPattern := "%" + searchTerm + "%"
	rows, err := db.conn.Query(query, searchPattern, searchPattern)
	if err != nil {
		return nil, fmt.Errorf("failed to search password entries: %w", err)
	}
	defer rows.Close()

	var entries []*PasswordEntry
	for rows.Next() {
		entry := &PasswordEntry{}
		err := rows.Scan(
			&entry.ID,
			&entry.ServiceName,
			&entry.Username,
			&entry.EncryptedPassword,
			&entry.CreatedAt,
			&entry.UpdatedAt,
			&entry.Notes,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan password entry: %w", err)
		}
		entries = append(entries, entry)
	}

	return entries, nil
}

// UpdatePasswordEntry updates an existing password entry
func (db *DB) UpdatePasswordEntry(entry *PasswordEntry) error {
	query := `
	UPDATE password_entries 
	SET service_name = ?, username = ?, encrypted_password = ?, notes = ?, updated_at = ?
	WHERE id = ?
	`

	now := time.Now()
	result, err := db.conn.Exec(query,
		entry.ServiceName,
		entry.Username,
		entry.EncryptedPassword,
		entry.Notes,
		now,
		entry.ID,
	)
	if err != nil {
		return fmt.Errorf("failed to update password entry: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("password entry not found")
	}

	entry.UpdatedAt = now
	return nil
}

// DeletePasswordEntry deletes a password entry by ID
func (db *DB) DeletePasswordEntry(id int) error {
	query := `DELETE FROM password_entries WHERE id = ?`

	result, err := db.conn.Exec(query, id)
	if err != nil {
		return fmt.Errorf("failed to delete password entry: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("password entry not found")
	}

	return nil
}

// Close closes the database connection
func (db *DB) Close() error {
	return db.conn.Close()
}
