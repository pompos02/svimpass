// Package generator contains the password generator
package generator

import (
	"crypto/rand"
	"math/big"
)

const (
	// Secure defaults: 20 chars, all character types, no ambiguous chars
	DefaultLength = 20
	charset       = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%^&*"
)

func GeneratePassword() (string, error) {
	password := make([]byte, DefaultLength)

	for i := range password {
		num, err := rand.Int(rand.Reader, big.NewInt(int64(len(charset))))
		if err != nil {
			return "", err
		}
		password[i] = charset[num.Int64()]
	}

	return string(password), nil
}
