package csv

import (
	"encoding/csv"
	"fmt"
	"io"
	"os"
	"strings"

	"svimpass/internal/crypto"
	"svimpass/internal/database"
)

type CSVEntry struct {
	ServiceName string `json:"serviceName"`
	Username    string `json:"username"`
	Password    string `json:"password"`
}

func ImportPasswordFromCSV(db *database.DB, encKey *crypto.EncryptionKey, filepath string) (int, error) {
	file, err := os.Open(filepath)
	if err != nil {
		return -1, fmt.Errorf("Error opening the file: %w", err)
	}
	defer file.Close()
	reader := csv.NewReader(file)

	// skipping the header row
	_, err = reader.Read()
	if err != nil {
		return -1, err
	}

	successCounter := 0
	for {
		row, err := reader.Read()
		if err == io.EOF {
			break
		}
		if err != nil {
			// skipping row
			continue
		}
		if len(row) < 3 {
			continue
		}
		serviceName := strings.TrimSpace(row[0])
		username := strings.TrimSpace(row[1])
		password := strings.TrimSpace(row[2])

		// Basic validation - skip if any field is empty
		if serviceName == "" || username == "" || password == "" {
			continue
		}

		encryptedPassword, err := encKey.Encrypt(password)
		if err != nil {
			continue
		}

		entry := &database.PasswordEntry{
			ServiceName:       serviceName,
			Username:          username,
			EncryptedPassword: encryptedPassword,
			Notes:             "",
		}

		err = db.CreatePasswordEntry(entry)
		if err != nil {
			continue
		}

		successCounter++

	}
	return successCounter, nil
}
