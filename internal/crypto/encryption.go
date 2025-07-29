// Package crypto provides functions for deriving encryption keys,
// generating salts, and performing AES-GCM encryption and decryption.
package crypto

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"crypto/sha256"
	"fmt"
	"io"

	"golang.org/x/crypto/pbkdf2"
)

const (
	saltSize   = 32
	keySize    = 32 // this should be AES-256
	iterations = 1000
)

type EncryptionKey struct {
	key  []byte
	salt []byte
}

func DeriveKey(masterPassword string, salt []byte) *EncryptionKey {
	if salt == nil {
		salt = generateSalt()
	}

	key := pbkdf2.Key([]byte(masterPassword), salt, iterations, keySize, sha256.New)

	return &EncryptionKey{
		key:  key,
		salt: salt,
	}
}

func generateSalt() []byte {
	salt := make([]byte, saltSize)
	if _, err := rand.Read(salt); err != nil {
		panic(fmt.Sprintf("failed to generateSalt: %v", err))
	}
	return salt
}

func (ek *EncryptionKey) GetSalt() []byte {
	return ek.salt
}

func (ek *EncryptionKey) Encrypt(plaintext string) ([]byte, error) {
	if plaintext == "" {
		return nil, fmt.Errorf("your password cannot be blank")
	}

	block, err := aes.NewCipher(ek.key)
	if err != nil {
		return nil, fmt.Errorf("failed to create a cipher %w", err)
	}
	// Create GCM mode
	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return nil, fmt.Errorf("failed to create GCM: %w", err)
	}

	// Generate nonce
	nonce := make([]byte, gcm.NonceSize())
	if _, err := io.ReadFull(rand.Reader, nonce); err != nil {
		return nil, fmt.Errorf("failed to generate nonce: %w", err)
	}

	// encrypt the data
	ciphertext := gcm.Seal(nonce, nonce, []byte(plaintext), nil)

	return ciphertext, nil
}

func (ek *EncryptionKey) Decrypt(ciphertext []byte) (string, error) {
	if len(ciphertext) == 0 {
		return "", fmt.Errorf("the cipher text must not be empty")
	}
	block, err := aes.NewCipher(ek.key)
	if err != nil {
		return "", fmt.Errorf("failed to create cipher: %w", err)
	}

	// Create GCM mode
	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return "", fmt.Errorf("failed to create GCM: %w", err)
	}

	// Extract nonce and encrypted data
	nonceSize := gcm.NonceSize()
	if len(ciphertext) < nonceSize {
		return "", fmt.Errorf("ciphertext too short")
	}

	nonce, encryptedData := ciphertext[:nonceSize], ciphertext[nonceSize:]

	// Decrypt the data
	plaintext, err := gcm.Open(nil, nonce, encryptedData, nil)
	if err != nil {
		return "", fmt.Errorf("failed to decrypt: %w", err)
	}

	return string(plaintext), nil
}

// TODO: ZEROout all the stata from the memory for security
