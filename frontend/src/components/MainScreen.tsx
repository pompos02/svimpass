import React, { useState, useEffect, useRef, useCallback } from 'react';
import { SearchPasswords, CreatePassword, DeletePassword, GetPassword, LockApp, ExecuteCommand, HideSpotlight, SetWindowCollapsed, SetWindowExpanded } from '../../wailsjs/go/main/App';
import { PasswordEntry, PasswordEntryState, AddGenCommand, InputMode } from '../types';
import { services } from '../../wailsjs/go/models';
import { parseCommand, isValidAddCommand, isValidAddGenCommand, isValidImportCommand, formatAddCommandExample, formatAddGenCommandExample, formatImportCommandExample, getCurrentMode, isSearchMode } from '../utils/commandParser';
import { useSimpleNavigation } from '../hooks/useSimpleNavigation';
import PasswordDropdown from './PasswordDropdown';
import { EventsOn } from '../../wailsjs/runtime/runtime';

const { CreatePasswordRequest } = services;

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

      // Clear UI state
      setInput('');
      setShowDropdown(false);
      navigation.reset();

      // Instantly hide window after copying password (true Spotlight behavior)
      try {
        await HideSpotlight();
      } catch (error) {
        console.error('Failed to hide window after copy:', error);
      }

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

    // Listen for window-shown event from backend
    const cleanup = EventsOn("window-shown", () => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    });

    return cleanup;
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
      // Collapse window when no input
      try {
        await SetWindowCollapsed();
      } catch (error) {
        console.error('Failed to collapse window:', error);
      }
      return;
    }

    const command = parseCommand(value);

    // Only perform search if in search mode (derived from current state)
    if (command.type === 'search' && isSearchMode(value)) {
      try {
        setIsLoading(true);
        const searchResults = await SearchPasswords(command.query);
        setResults(searchResults || []);
        const hasResults = searchResults && searchResults.length > 0;
        setShowDropdown(hasResults);

        // Resize window based on results
        try {
          if (hasResults) {
            await SetWindowExpanded();
          } else {
            await SetWindowCollapsed();
          }
        } catch (error) {
          console.error('Failed to resize window:', error);
        }

        // Don't reset navigation here - let user continue with existing selection
      } catch (error) {
        console.error('Search failed:', error);
        setResults([]);
        setShowDropdown(false);
        navigation.reset();
        // Collapse window on error
        try {
          await SetWindowCollapsed();
        } catch (resizeError) {
          console.error('Failed to collapse window:', resizeError);
        }
      } finally {
        setIsLoading(false);
      }
    } else {
      // Command mode - hide dropdown and clear results immediately
      setShowDropdown(false);
      setResults([]);
      navigation.reset();
      // Collapse window in command mode
      try {
        await SetWindowCollapsed();
      } catch (error) {
        console.error('Failed to collapse window:', error);
      }
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

        // Clear UI state
        setInput('');
        setPasswordEntryState({
          isActive: false,
          serviceName: '',
          username: '',
          notes: '',
          showPassword: false
        });

        // Instantly hide window after copying password
        try {
          await HideSpotlight();
        } catch (error) {
          console.error('Failed to hide window after password creation:', error);
        }
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
        const commandStr = `:addgen ${command.serviceName};${command.username};${command.notes}`;
        const generatedPassword = await ExecuteCommand(commandStr);

        // Copy to clipboard
        await navigator.clipboard.writeText(generatedPassword);

        // Clear UI state
        setInput('');

        // Instantly hide window after copying generated password
        try {
          await HideSpotlight();
        } catch (error) {
          console.error('Failed to hide window after password generation:', error);
        }
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
        const commandStr = `:import ${command.filename}`;
        const importedCount = await ExecuteCommand(commandStr);
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
        // Clear UI state
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

        // Hide the window
        try {
          await HideSpotlight();
        } catch (error) {
          console.error('Failed to hide window:', error);
        }
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

      // Handle dropdown navigation with arrow keys
      if (showDropdown && results.length > 0) {
        // Down navigation: Arrow Down
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          navigation.selectNext();
        }
        // Up navigation: Arrow Up
        else if (e.key === 'ArrowUp') {
          e.preventDefault();
          navigation.selectPrevious();
        }
        // Delete selected item
        else if (e.key === 'd' && e.ctrlKey && navigation.selectedItem) {
          e.preventDefault();
          await handleDelete(navigation.selectedItem.id);
        }
      }

      // Global shortcuts
      if ((e.ctrlKey || e.metaKey) && e.key === 'l') {
        e.preventDefault();
        await handleLock();
      }

      // Toggle password visibility in password entry mode
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'P' && passwordEntryState.isActive) {
        e.preventDefault();
        setPasswordEntryState(prev => ({
          ...prev,
          showPassword: !prev.showPassword
        }));
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
    <div className="spotlight-window">
      <div className="search-container">
        <input
          ref={inputRef}
          type={passwordEntryState.isActive && !passwordEntryState.showPassword ? "password" : "text"}
          value={input}
          onChange={handleInputChange}
          placeholder={getPlaceholder()}
          className="spotlight-input"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck="false"
          disabled={isLoading}
        />

        {showDropdown && results.length > 0 && (
          <PasswordDropdown
            results={results}
            navigation={navigation}
            onDelete={handleDelete}
          />
        )}

        {message && <div className="spotlight-message">{message}</div>}
      </div>
    </div>
  );
}
