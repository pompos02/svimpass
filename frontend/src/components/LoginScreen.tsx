import React, { useState, useEffect, useRef } from 'react';
import { IsInitialized, SetupMasterPassword, UnlockApp } from '../../wailsjs/go/main/App';

interface LoginScreenProps {
  onLogin: () => void;
}

export default function LoginScreen({ onLogin }: LoginScreenProps) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSetup, setIsSetup] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    checkInitialization();
  }, []);

  useEffect(() => {
    // Auto-focus on the input field
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [isSetup, loading]);

  const checkInitialization = async () => {
    try {
      const initialized = await IsInitialized();
      setIsSetup(!initialized);
      setLoading(false);
    } catch (err) {
      setError('Failed to check initialization status');
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (isSetup) {
      // Setup mode
      if (password !== confirmPassword) {
        setError('Passwords do not match');
        return;
      }
      if (password.length < 1) {
        setError('Password cannot be empty');
        return;
      }

      try {
        await SetupMasterPassword(password, confirmPassword);
        onLogin();
      } catch (err) {
        setError('Failed to setup master password');
      }
    } else {
      // Login mode
      if (password.length < 1) {
        setError('Password cannot be empty');
        return;
      }

      try {
        await UnlockApp(password);
        onLogin();
      } catch (err) {
        setError('Invalid master password');
        setPassword('');
        // Re-focus the input after clearing
        setTimeout(() => {
          if (inputRef.current) {
            inputRef.current.focus();
          }
        }, 100);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setPassword('');
      setConfirmPassword('');
      setError('');
    }
  };

  if (loading) {
    return (
      <div className="login-screen">
        <div className="login-container">
          <div className="loading">Initializing...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="login-screen">
      <div className="login-container">
        <h2>{isSetup ? 'Setup Master Password' : 'Enter Master Password'}</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <input
              ref={inputRef}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isSetup ? 'Create master password' : 'Master password'}
              className="password-input"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck="false"
            />
          </div>

          {isSetup && (
            <div className="input-group">
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Confirm master password"
                className="password-input"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck="false"
              />
            </div>
          )}

          {error && <div className="error-message">{error}</div>}

          <button type="submit" className="submit-button">
            {isSetup ? 'Create' : 'Unlock'}
          </button>
        </form>

        <div className="help-text">
          Press Enter to {isSetup ? 'create' : 'unlock'} • Press Escape to clear
        </div>
      </div>
    </div>
  );
}