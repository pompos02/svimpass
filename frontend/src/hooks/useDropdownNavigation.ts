import { useState, useCallback, useEffect } from 'react';

export interface NavigationItem {
  id: number;
  serviceName: string;
  username: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

interface UseDropdownNavigationProps {
  items: NavigationItem[];
  isOpen: boolean;
  onSelect?: (item: NavigationItem) => void;
}

export const useDropdownNavigation = ({ 
  items, 
  isOpen, 
  onSelect 
}: UseDropdownNavigationProps) => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [interactionMode, setInteractionMode] = useState<'mouse' | 'keyboard'>('keyboard');

  // Reset selection when dropdown closes or items change
  useEffect(() => {
    if (!isOpen || items.length === 0) {
      setSelectedIndex(null);
      setInteractionMode('keyboard');
    }
  }, [isOpen, items.length]);

  const selectNext = useCallback(() => {
    if (!isOpen || items.length === 0) return;
    
    setInteractionMode('keyboard');
    setSelectedIndex(prev => {
      if (prev === null) return 0;
      return prev < items.length - 1 ? prev + 1 : 0;
    });
  }, [isOpen, items.length]);

  const selectPrevious = useCallback(() => {
    if (!isOpen || items.length === 0) return;
    
    setInteractionMode('keyboard');
    setSelectedIndex(prev => {
      if (prev === null) return items.length - 1;
      return prev > 0 ? prev - 1 : items.length - 1;
    });
  }, [isOpen, items.length]);

  const selectByMouse = useCallback((index: number) => {
    setInteractionMode('mouse');
    setSelectedIndex(index);
  }, []);



  const selectCurrent = useCallback(() => {
    if (selectedIndex !== null && selectedIndex < items.length) {
      const item = items[selectedIndex];
      onSelect?.(item);
    }
  }, [selectedIndex, items, onSelect]);

  const reset = useCallback(() => {
    setSelectedIndex(null);
    setInteractionMode('keyboard');
  }, []);

  // Accessibility helpers
  const getItemProps = useCallback((index: number) => ({
    'data-selected': selectedIndex === index,
    'role': 'option',
    'aria-selected': selectedIndex === index,
    'id': `dropdown-item-${index}`,
    onMouseEnter: () => selectByMouse(index),
  }), [selectedIndex, selectByMouse]);

  const getComboboxProps = useCallback(() => ({
    'role': 'combobox' as const,
    'aria-expanded': isOpen,
    'aria-haspopup': 'listbox' as const,
    'aria-activedescendant': selectedIndex !== null ? `dropdown-item-${selectedIndex}` : undefined,
  }), [isOpen, selectedIndex]);

  const getListboxProps = useCallback(() => ({
    'role': 'listbox',
  }), []);

  return {
    selectedIndex,
    selectedItem: selectedIndex !== null ? items[selectedIndex] : null,
    interactionMode,
    selectNext,
    selectPrevious,
    selectCurrent,
    reset,
    getItemProps,
    getComboboxProps,
    getListboxProps,
  };
};