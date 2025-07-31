import React, { useState, useEffect, useRef, useCallback } from 'react';
import { SearchPasswords, CreatePassword, DeletePassword, GetPassword, LockApp } from '../../wailsjs/go/main/App';
import { PasswordEntry } from '../types';
import { main } from '../../wailsjs/go/models';
import { parseCommand, isValidNewCommand, formatNewCommandExample } from '../utils/commandParser';
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

    if (value.trim() === '') {
      setShowDropdown(false);
      setResults([]);
      navigation.reset();
      return;
    }

    const command = parseCommand(value);

    if (command.type === 'search') {
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
      // Command mode - hide dropdown and show format hint
      setShowDropdown(false);
      setResults([]);
      navigation.reset();
    }
  };



  const handleSubmit = useCallback(async () => {
    if (input.trim() === '') return;

    const command = parseCommand(input);

    if (command.type === 'new') {
      if (!isValidNewCommand(command)) {
        setMessage(`Invalid format. Use: ${formatNewCommandExample()}`);
        return;
      }

      try {
        setIsLoading(true);
        const request = new CreatePasswordRequest({
          serviceName: command.serviceName,
          username: command.username,
          password: command.password,
          notes: command.notes
        });
        
        await CreatePassword(request);
        setMessage(`Added password for ${command.serviceName}`);
        setInput('');
      } catch (error) {
        setMessage('Failed to add password');
        console.error('Add password failed:', error);
      } finally {
        setIsLoading(false);
      }
    } else if (command.type === 'search' && navigation.selectedItem) {
      // Copy password to clipboard - handled by navigation hook
      navigation.selectCurrent();
    }
  }, [input, navigation]);

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
      }
    };

    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => document.removeEventListener('keydown', handleGlobalKeyDown);
  }, [showDropdown, results, navigation, handleSubmit, handleDelete, handleLock]);

  const getPlaceholder = () => {
    if (input.startsWith(':')) {
      return formatNewCommandExample();
    }
    return 'Search passwords or type :new to add new entry...';
  };

  return (
    <div className="main-screen">
      <div className="search-container">
        <div className="input-wrapper">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={handleInputChange}


            placeholder={getPlaceholder()}
            className="search-input"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck="false"
            disabled={isLoading}
          />
          
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
          Enter to execute • :new to add • Ctrl+J/N ↓ Ctrl+K/P ↑ to navigate • Delete to remove • Ctrl+L to lock • Esc to clear
        </div>
      </div>
    </div>
  );
}