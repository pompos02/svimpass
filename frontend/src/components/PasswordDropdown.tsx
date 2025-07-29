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

  return (
    <div className="password-dropdown">
      {results.map((entry, index) => (
        <div
          key={entry.id}
          {...navigation.getItemProps(index)}
        >
          <div className="entry-main">
            <div className="service-name">{entry.serviceName}</div>
            <div className="username">{entry.username}</div>
          </div>
          
          <div className="entry-details">
            {entry.notes && <div className="notes">{entry.notes}</div>}
            <div className="created-date">Added {formatDate(entry.createdAt)}</div>
          </div>

          <div className="entry-actions">
            <span className="copy-hint">↵ Copy</span>
            {index === navigation.selectedIndex && (
              <span className="delete-hint">Del</span>
            )}
          </div>
        </div>
      ))}
      
      {results.length === 0 && (
        <div className="dropdown-item no-results">
          No passwords found
        </div>
      )}
    </div>
  );
}