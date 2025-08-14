// Package csv defines the function for import and export of the password entries
package csv

import (
	"encoding/csv"
	"fmt"
	"os"
	"path/filepath"

	"svimpass/internal/crypto"
	"svimpass/internal/database"
)

func ExportPasswordToCSV(db *database.DB, encKey *crypto.EncryptionKey) error {
	homeDir, err := os.UserHomeDir()
	if err != nil {
		return err
	}
	filePath := filepath.Join(homeDir, "Downloads", "svimapassPasswords.csv")
	file, err := os.Create(filePath)
	if err != nil {
		return err
	}
	defer file.Close()

	entries, err := db.GetAllPasswordEntries()
	if err != nil {
		return fmt.Errorf("error getting the entries from the database %v", err)
	}

	writer := csv.NewWriter(file)
	defer writer.Flush()
	header := []string{"ServiceName", "Username", "Password", "Notes"}
	err = writer.Write(header)
	if err != nil {
		return fmt.Errorf("error writing the header %w", err)
	}

	for _, entry := range entries {
		password, err := encKey.Decrypt(entry.EncryptedPassword)
		if err != nil {
			return fmt.Errorf("error decrypting the password %v", err)
		}
		row := []string{
			entry.ServiceName,
			entry.Username,
			password,
			entry.Notes,
		}
		err = writer.Write(row)
		if err != nil {
			return fmt.Errorf(" error importing a row, returning %w", err)
		}
	}
	// checking if any errors occured during flashing
	if err := writer.Error(); err != nil {
		return fmt.Errorf("an error occured while flashing the csv writer %w", err)
	}

	return nil
}
