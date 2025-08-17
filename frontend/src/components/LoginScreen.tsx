import React, { useState, useEffect, useRef } from 'react';
import { IsInitialized, SetupMasterPassword, UnlockApp } from '../../wailsjs/go/main/App';

interface LoginScreenProps {
  onLogin: () => void;
}

export default function LoginScreen({ onLogin }: LoginScreenProps) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSetup, setIsSetup] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState<'password' | 'confirm'>('password');
  const [placeholder, setPlaceholder] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    checkInitialization();
  }, []);

  useEffect(() => {
    // Auto-focus on the input field
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [isSetup, loading, currentStep]);

  useEffect(() => {
    // Update placeholder based on current state
    if (loading) {
      setPlaceholder('Initializing...');
    } else if (isSetup) {
      if (currentStep === 'password') {
        setPlaceholder('Create Master Password');
      } else {
        setPlaceholder('Confirm Master Password');
      }
    } else {
      setPlaceholder('Enter Master Password');
    }
  }, [loading, isSetup, currentStep]);

  const checkInitialization = async () => {
    try {
      const initialized = await IsInitialized();
      setIsSetup(!initialized);
      setLoading(false);
    } catch (err) {
      setPlaceholder('Failed to initialize');
      setLoading(false);
      setTimeout(() => setPlaceholder('Enter Master Password'), 2000);
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 100);
    }
  };

  const handleSubmit = async () => {
    if (loading) return;

    if (isSetup) {
      // Setup mode
      if (currentStep === 'password') {
        if (password.length < 1) {
          setPlaceholder('Password cannot be empty');
          setTimeout(() => setPlaceholder('Create Master Password'), 2000);
          return;
        }
        // Move to confirmation step
        setCurrentStep('confirm');
        return;
      } else {
        // Confirm step
        if (confirmPassword.length < 1) {
          setPlaceholder('Please confirm password');
          setTimeout(() => setPlaceholder('Confirm Master Password'), 2000);
          return;
        }
        if (password !== confirmPassword) {
          setPlaceholder('Passwords do not match');
          setConfirmPassword('');
          setTimeout(() => setPlaceholder('Confirm Master Password'), 2000);
          return;
        }

        try {
          await SetupMasterPassword(password, confirmPassword);
          onLogin();
        } catch (err) {
          setPlaceholder('Failed to setup master password');
          setConfirmPassword('');
          setTimeout(() => setPlaceholder('Confirm Master Password'), 2000);
          setTimeout(() => {
            if (inputRef.current) {
              inputRef.current.focus();
            }
          }, 100);
        }
      }
    } else {
      // Login mode
      if (password.length < 1) {
        setPlaceholder('Password cannot be empty');
        setTimeout(() => setPlaceholder('Enter Master Password'), 2000);
        return;
      }

      try {
        await UnlockApp(password);
        onLogin();
      } catch (err) {
        setPlaceholder('Wrong Master Password');
        setPassword('');
        setTimeout(() => setPlaceholder('Enter Master Password'), 2000);
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
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === 'Escape') {
      if (isSetup && currentStep === 'confirm') {
        // Go back to password step
        setCurrentStep('password');
        setConfirmPassword('');
      } else {
        setPassword('');
        setConfirmPassword('');
        setCurrentStep('password');
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (isSetup && currentStep === 'confirm') {
      setConfirmPassword(value);
    } else {
      setPassword(value);
    }
  };

  const getCurrentValue = () => {
    if (isSetup && currentStep === 'confirm') {
      return confirmPassword;
    }
    return password;
  };

  return (
    <div className="spotlight-window">
      <div className="search-container">
        <input
          ref={inputRef}
          type="password"
          value={getCurrentValue()}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="spotlight-input"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck="false"
          disabled={loading}
        />
      </div>
    </div>
  );
}