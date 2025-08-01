import React, { useState, useEffect, useRef, useCallback } from 'react';
import { SearchPasswords, CreatePassword, DeletePassword, GetPassword, LockApp, GenerateAndSavePassword, ImportPasswordFromCSV } from '../../wailsjs/go/main/App';
import { PasswordEntry, PasswordEntryState, AddGenCommand, InputMode } from '../types';
import { main } from '../../wailsjs/go/models';
import { parseCommand, isValidAddCommand, isValidAddGenCommand, isValidImportCommand, formatAddCommandExample, formatAddGenCommandExample, formatImportCommandExample, getCurrentMode, isSearchMode } from '../utils/commandParser';
import { useSimpleNavigation } from '../hooks/useSimpleNavigation';
import PasswordDropdown from './PasswordDropdown';

const { CreatePasswordRequest } = main;

interface MainScreenProps {
  onLogout: () => void;
}

export default function MainScreen({ onLogout }: MainScreenProps) {
  const [input, setInput] = useState('');
  const [results, setResults] = useState<PasswordEntry[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [passwordEntryState, setPasswordEntryState] = useState<PasswordEntryState>({
    isActive: false,
    serviceName: '',
    username: '',
    notes: '',
    showPassword: false
  });

  // Derived mode - no state needed, computed from current application state
  const getCurrentMode = (): InputMode => {
    // Priority 1: Password entry mode (highest priority)
    if (passwordEntryState.isActive) {
      return 'password'; // During password entry, search is disabled
    }
    
    // Priority 2: Command mode (when input starts with :)
    if (input.trim().startsWith(':')) {
      return 'command';
    }
    
    // Priority 3: Search mode (default)
    return 'search';
  };

  const currentMode = getCurrentMode();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleCopyPassword = async (id: number) => {
    try {
      const password = await GetPassword(id);
      await navigator.clipboard.writeText(password);
      
      const entry = results.find(r => r.id === id);
      setMessage(`Copied password for ${entry?.serviceName || 'entry'}`);
      setInput('');
      setShowDropdown(false);
      navigation.reset();
    } catch (error) {
      setMessage('Failed to copy password');
      console.error('Copy password failed:', error);
    }
  };

  // Simple navigation hook
  const navigation = useSimpleNavigation({
    items: results,
    isOpen: showDropdown,
    onSelect: (item) => handleCopyPassword(item.id),
  });

  useEffect(() => {
    // Auto-focus on the input field
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  useEffect(() => {
    // Clear message after 3 seconds
    if (message) {
      const timer = setTimeout(() => setMessage(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInput(value);

    // If in password entry mode, don't perform any search operations
    if (passwordEntryState.isActive) {
      return;
    }

    if (value.trim() === '') {
      setShowDropdown(false);
      setResults([]);
      navigation.reset();
      return;
    }

    const command = parseCommand(value);

    // Only perform search if in search mode (derived from current state)
    if (command.type === 'search' && isSearchMode(value)) {
      try {
        setIsLoading(true);
        const searchResults = await SearchPasswords(command.query);
        setResults(searchResults || []);
        setShowDropdown(searchResults.length > 0);
        // Don't reset navigation here - let user continue with existing selection
      } catch (error) {
        console.error('Search failed:', error);
        setResults([]);
        setShowDropdown(false);
        navigation.reset();
      } finally {
        setIsLoading(false);
      }
    } else {
      // Command mode - hide dropdown and clear results immediately
      setShowDropdown(false);
      setResults([]);
      navigation.reset();
    }
  };



  const handleSubmit = useCallback(async () => {
    // Handle password entry mode submission
    if (passwordEntryState.isActive) {
      if (input.trim() === '') return;

      try {
        setIsLoading(true);
        const request = new CreatePasswordRequest({
          serviceName: passwordEntryState.serviceName,
          username: passwordEntryState.username,
          password: input,
          notes: passwordEntryState.notes
        });
        
        await CreatePassword(request);
        
        // Copy password to clipboard
        await navigator.clipboard.writeText(input);
        setMessage(`Added password for ${passwordEntryState.serviceName} (copied to clipboard)`);
        setInput('');
        setPasswordEntryState({
          isActive: false,
          serviceName: '',
          username: '',
          notes: '',
          showPassword: false
        });
      } catch (error) {
        setMessage('Failed to add password');
        console.error('Add password failed:', error);
      } finally {
        setIsLoading(false);
      }
      return;
    }

    if (input.trim() === '') return;

    const command = parseCommand(input);

    if (command.type === 'add') {
      if (!isValidAddCommand(command)) {
        setMessage(`Invalid format. Use: ${formatAddCommandExample()}`);
        return;
      }

      // Enter password entry mode
      setPasswordEntryState({
        isActive: true,
        serviceName: command.serviceName,
        username: command.username,
        notes: command.notes,
        showPassword: false
      });
      setInput('');
      setShowDropdown(false);
      setResults([]);
      navigation.reset();
    } else if (command.type === 'addgen') {
      if (!isValidAddGenCommand(command)) {
        setMessage(`Invalid format. Use: ${formatAddGenCommandExample()}`);
        return;
      }

      try {
        setIsLoading(true);
        const request = new CreatePasswordRequest({
          serviceName: command.serviceName,
          username: command.username,
          password: '', // Will be generated
          notes: command.notes
        });
        
        const generatedPassword = await GenerateAndSavePassword(request);
        
        // Copy to clipboard
        await navigator.clipboard.writeText(generatedPassword);
        setMessage(`Generated and saved password for ${command.serviceName} (copied to clipboard)`);
        setInput('');
      } catch (error) {
        setMessage('Failed to generate and save password');
        console.error('Generate and save failed:', error);
      } finally {
        setIsLoading(false);
      }
    } else if (command.type === 'import') {
      if (!isValidImportCommand(command)) {
        setMessage(`Invalid format. Use: ${formatImportCommandExample()}`);
        return;
      }

      try {
        setIsLoading(true);
        const importedCount = await ImportPasswordFromCSV(command.filename);
        setMessage(`Successfully imported ${importedCount} passwords from ${command.filename}`);
        setInput('');
      } catch (error) {
        setMessage(`Failed to import from ${command.filename}: ${error}`);
        console.error('Import failed:', error);
      } finally {
        setIsLoading(false);
      }
    } else if (command.type === 'search' && navigation.selectedItem) {
      // Copy password to clipboard - handled by navigation hook
      navigation.selectCurrent();
    }
  }, [input, navigation, passwordEntryState]);

  const handleDelete = useCallback(async (id: number) => {
    try {
      const entry = results.find(r => r.id === id);
      await DeletePassword(id);
      setMessage(`Deleted ${entry?.serviceName || 'entry'}`);
      
      // Refresh results
      if (input.trim()) {
        const command = parseCommand(input);
        if (command.type === 'search') {
          const searchResults = await SearchPasswords(command.query);
          setResults(searchResults || []);
          setShowDropdown(searchResults?.length > 0);
        }
      }
      navigation.reset();
    } catch (error) {
      setMessage('Failed to delete entry');
      console.error('Delete failed:', error);
    }
  }, [input, results, navigation]);

  const handleLock = useCallback(async () => {
    try {
      await LockApp();
      onLogout();
    } catch (error) {
      console.error('Lock failed:', error);
    }
  }, [onLogout]);

  // Global keyboard event listener
  useEffect(() => {
    const handleGlobalKeyDown = async (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setInput('');
        setShowDropdown(false);
        setResults([]);
        setMessage('');
        setPasswordEntryState({
          isActive: false,
          serviceName: '',
          username: '',
          notes: '',
          showPassword: false
        });
        navigation.reset();
        return;
      }

      if (e.key === 'Enter') {
        e.preventDefault();
        if (showDropdown && navigation.selectedItem) {
          navigation.selectCurrent();
        } else if (document.activeElement === inputRef.current) {
          await handleSubmit();
        }
        return;
      }

      // Handle dropdown navigation with Ctrl shortcuts
      if (showDropdown && results.length > 0) {
        // Down navigation: Ctrl+J or Ctrl+N
        if ((e.ctrlKey || e.metaKey) && (e.key === 'j' || e.key === 'n')) {
          e.preventDefault();
          navigation.selectNext();
        } 
        // Up navigation: Ctrl+K or Ctrl+P
        else if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'p')) {
          e.preventDefault();
          navigation.selectPrevious();
        } 
        // Delete selected item
        else if (e.key === 'Delete' && navigation.selectedItem) {
          e.preventDefault();
          await handleDelete(navigation.selectedItem.id);
        }
      }

      // Global shortcuts
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'l') {
          e.preventDefault();
          await handleLock();
        }
        // Toggle password visibility in password entry mode
        if (e.shiftKey && e.key === 'P' && passwordEntryState.isActive) {
          e.preventDefault();
          setPasswordEntryState(prev => ({
            ...prev,
            showPassword: !prev.showPassword
          }));
        }
      }
    };

    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => document.removeEventListener('keydown', handleGlobalKeyDown);
  }, [showDropdown, results, navigation, handleSubmit, handleDelete, handleLock]);

  const getPlaceholder = () => {
    if (passwordEntryState.isActive) {
      return `Enter password for ${passwordEntryState.serviceName}...`;
    }
    if (input.startsWith(':import')) {
      return formatImportCommandExample();
    }
    if (input.startsWith(':addgen')) {
      return formatAddGenCommandExample();
    }
    if (input.startsWith(':add')) {
      return formatAddCommandExample();
    }
    return 'Search passwords or type :add to add entry, :addgen to generate, :import to import...';
  };

  const getInputClassName = () => {
    let className = 'search-input';
    if (passwordEntryState.isActive) {
      className += ' password-entry-mode';
    } else if (currentMode === 'command') {
      className += ' command-mode';
    }
    return className;
  };

  const getCurrentDisplayMode = () => {
    if (passwordEntryState.isActive) {
      return 'password';
    }
    return currentMode;
  };

  return (
    <div className="main-screen">
      <div className="search-container">
        <div className="input-wrapper">
          <div className={`mode-indicator ${getCurrentDisplayMode()}-mode`}>
            {passwordEntryState.isActive ? 'PASS' : (currentMode === 'command' ? 'CMD' : 'SEARCH')}
          </div>
          
          <input
            ref={inputRef}
            type={passwordEntryState.isActive && !passwordEntryState.showPassword ? "password" : "text"}
            value={input}
            onChange={handleInputChange}
            placeholder={getPlaceholder()}
            className={getInputClassName()}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck="false"
            disabled={isLoading}
          />
          
          {passwordEntryState.isActive && (
            <button
              type="button"
              className="password-toggle"
              onClick={() => setPasswordEntryState(prev => ({
                ...prev,
                showPassword: !prev.showPassword
              }))}
              title="Toggle password visibility (Ctrl+Shift+P)"
            >
              {passwordEntryState.showPassword ? '🙈' : '👁️'}
            </button>
          )}
          
          {isLoading && <div className="loading-indicator">⏳</div>}
        </div>

        {showDropdown && results.length > 0 && (
          <PasswordDropdown
            results={results}
            navigation={navigation}
            onDelete={handleDelete}
          />
        )}

        {message && <div className="message">{message}</div>}

        <div className="help-text">
          {passwordEntryState.isActive ? (
            <>
              Enter to save password • Ctrl+Shift+P to toggle visibility • Esc to cancel
              <br />
              <span className="mode-help">Mode: Password Entry for {passwordEntryState.serviceName}</span>
            </>
          ) : (
            <>
              Enter to execute • :add to add manually • :addgen to generate • :import to import CSV • Ctrl+J/N ↓ Ctrl+K/P ↑ to navigate • Delete to remove • Ctrl+L to lock • Esc to clear
              <br />
              <span className="mode-help">Mode: {currentMode === 'command' ? 'Command (search disabled)' : 'Search (type : for commands)'}</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}