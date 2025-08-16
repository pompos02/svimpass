import React, { useEffect, useRef } from 'react';
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
  const dropdownRef = useRef<HTMLDivElement>(null);

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  // Auto-scroll selected item into view with precise one-entry movement
  useEffect(() => {
    if (navigation.selectedIndex >= 0 && dropdownRef.current) {
      const selectedElement = dropdownRef.current.querySelector(`[data-index="${navigation.selectedIndex}"]`) as HTMLElement;
      if (selectedElement) {
        const container = dropdownRef.current;
        const containerHeight = 240; // Fixed container height
        const entryHeight = 60; // Fixed entry height
        const visibleEntries = 4; // Exactly 4 entries visible
        
        // Calculate which "page" of 4 entries the selected item should be on
        const selectedItemIndex = navigation.selectedIndex;
        const targetScrollPosition = Math.max(0, Math.floor(selectedItemIndex / visibleEntries) * (visibleEntries * entryHeight));
        
        // Only scroll if the item is not fully visible
        const currentScrollTop = container.scrollTop;
        const itemTop = selectedItemIndex * entryHeight;
        const itemBottom = itemTop + entryHeight;
        const viewportTop = currentScrollTop;
        const viewportBottom = currentScrollTop + containerHeight;
        
        if (itemTop < viewportTop || itemBottom > viewportBottom) {
          // Scroll one entry at a time for smooth navigation
          let newScrollTop;
          if (itemTop < viewportTop) {
            // Scrolling up - show the selected item at the top
            newScrollTop = itemTop;
          } else {
            // Scrolling down - show the selected item at the bottom
            newScrollTop = itemBottom - containerHeight;
          }
          
          container.scrollTo({
            top: Math.max(0, newScrollTop),
            behavior: 'smooth'
          });
        }
      }
    }
  }, [navigation.selectedIndex]);

  // Limit to 4 visible items for Spotlight-like behavior
  const MAX_VISIBLE_ITEMS = 4;
  const hasMoreResults = results.length > MAX_VISIBLE_ITEMS;

  return (
    <div className="spotlight-dropdown">
      <div 
        ref={dropdownRef}
        className="dropdown-items" 
        style={{ 
          height: '240px', // Fixed height for exactly 4 entries (4 × 60px)
          overflowY: hasMoreResults ? 'auto' : 'hidden'
        }}
      >
        {results.map((entry, index) => (
          <div
            key={entry.id}
            data-index={index}
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