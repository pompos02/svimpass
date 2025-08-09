import React from 'react';
import { PasswordEntry } from '../types';

interface NavigationHook {
  selectedIndex: number;
  selectedItem: PasswordEntry | null;
  getItemProps: (index: number) => any;
}

interface PasswordDropdownProps {
  results: PasswordEntry[];
  navigation: NavigationHook;
  onDelete: (id: number) => Promise<void>;
}

export default function PasswordDropdown({ 
  results, 
  navigation,
  onDelete
}: PasswordDropdownProps) {

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  // Limit to 4 visible items for Spotlight-like behavior
  const MAX_VISIBLE_ITEMS = 4;
  const hasMoreResults = results.length > MAX_VISIBLE_ITEMS;

  return (
    <div className="spotlight-dropdown">
      <div className="dropdown-items" style={{ 
        maxHeight: `${MAX_VISIBLE_ITEMS * 60}px`, // 60px per item
        overflowY: hasMoreResults ? 'auto' : 'hidden'
      }}>
        {results.map((entry, index) => (
          <div
            key={entry.id}
            className={`dropdown-item ${index === navigation.selectedIndex ? 'selected' : ''}`}
            {...navigation.getItemProps(index)}
          >
            <div className="entry-main">
              <div className="service-name">{entry.serviceName}</div>
              <div className="username">{entry.username}</div>
            </div>
            
            <div className="entry-details">
              <div className="created-date">Created: {formatDate(entry.createdAt)}</div>
              <div className="updated-date">Updated: {formatDate(entry.updatedAt)}</div>
            </div>
            
            <div className="entry-actions">
              <span className="copy-hint">↵</span>
              {index === navigation.selectedIndex && (
                <span className="delete-hint">⌫</span>
              )}
            </div>
          </div>
        ))}
      </div>
      
      {hasMoreResults && (
        <div className="more-results-indicator">
          {results.length - MAX_VISIBLE_ITEMS} more results...
        </div>
      )}
      
      {results.length === 0 && (
        <div className="dropdown-item no-results">
          No passwords found
        </div>
      )}
    </div>
  );
}