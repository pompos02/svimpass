import { useState, useCallback, useEffect } from 'react';

export interface NavigationItem {
  id: number;
  serviceName: string;
  username: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

interface UseSimpleNavigationProps {
  items: NavigationItem[];
  isOpen: boolean;
  onSelect?: (item: NavigationItem) => void;
}

export const useSimpleNavigation = ({ 
  items, 
  isOpen, 
  onSelect 
}: UseSimpleNavigationProps) => {
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);

  // Reset selection when dropdown closes or items change
  useEffect(() => {
    if (!isOpen || items.length === 0) {
      setSelectedIndex(-1);
    }
  }, [isOpen, items.length]);

  const selectNext = useCallback(() => {
    if (!isOpen || items.length === 0) return;
    
    setSelectedIndex(prev => {
      const next = prev + 1;
      return next >= items.length ? 0 : next;
    });
  }, [isOpen, items.length]);

  const selectPrevious = useCallback(() => {
    if (!isOpen || items.length === 0) return;
    
    setSelectedIndex(prev => {
      const next = prev - 1;
      return next < 0 ? items.length - 1 : next;
    });
  }, [isOpen, items.length]);

  const selectItem = useCallback((index: number) => {
    if (index >= 0 && index < items.length) {
      setSelectedIndex(index);
    }
  }, [items.length]);

  const selectCurrent = useCallback(() => {
    if (selectedIndex >= 0 && selectedIndex < items.length) {
      const item = items[selectedIndex];
      onSelect?.(item);
    }
  }, [selectedIndex, items, onSelect]);

  const reset = useCallback(() => {
    setSelectedIndex(-1);
  }, []);

  const getItemProps = useCallback((index: number) => ({
    'data-selected': selectedIndex === index,
    className: `dropdown-item ${selectedIndex === index ? 'selected' : ''}`,
    onMouseEnter: () => selectItem(index),
    onClick: () => {
      selectItem(index);
      selectCurrent();
    },
  }), [selectedIndex, selectItem, selectCurrent]);

  return {
    selectedIndex,
    selectedItem: selectedIndex >= 0 ? items[selectedIndex] : null,
    selectNext,
    selectPrevious,
    selectCurrent,
    selectItem,
    reset,
    getItemProps,
  };
};