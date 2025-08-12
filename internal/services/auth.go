package services

import (
	"fmt"

	"svimpass/internal/crypto"
)

type AuthService struct {
	masterMgr *crypto.MasterPasswordManager
	encKey    *crypto.EncryptionKey
	unlocked  bool
}

func NewAuthService(masterMgr *crypto.MasterPasswordManager) *AuthService {
	return &AuthService{
		masterMgr: masterMgr,
		unlocked:  false,
	}
}

func (as *AuthService) IsInitialized() bool {
	if as.masterMgr == nil {
		return false
	}
	return as.masterMgr.IsInitialized()
}

func (as *AuthService) SetupMasterPassword(password, confirmPassword string) error {
	if password != confirmPassword {
		return fmt.Errorf("passwords do not match")
	}

	encKey, err := as.masterMgr.SetupMasterPassword(password)
	if err != nil {
		return err
	}

	as.encKey = encKey
	as.unlocked = true
	return nil
}

func (as *AuthService) UnlockApp(password string) error {
	encKey, err := as.masterMgr.VerifyMasterPassword(password)
	if err != nil {
		return err
	}

	as.encKey = encKey
	as.unlocked = true
	return nil
}

func (as *AuthService) LockApp() {
	if as.encKey != nil {
		as.encKey = nil
	}
	as.unlocked = false
}

func (as *AuthService) IsUnlocked() bool {
	return as.unlocked
}

func (as *AuthService) GetEncryptionKey() *crypto.EncryptionKey {
	return as.encKey
}

