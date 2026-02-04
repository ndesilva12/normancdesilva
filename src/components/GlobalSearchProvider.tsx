'use client';

import { useEffect, useState, createContext, useContext } from 'react';
import GlobalSearch from './GlobalSearch';

interface GlobalSearchContextType {
  openSearch: () => void;
  closeSearch: () => void;
  isOpen: boolean;
}

const GlobalSearchContext = createContext<GlobalSearchContextType | null>(null);

export function useGlobalSearch() {
  const context = useContext(GlobalSearchContext);
  if (!context) {
    throw new Error('useGlobalSearch must be used within GlobalSearchProvider');
  }
  return context;
}

interface GlobalSearchProviderProps {
  children: React.ReactNode;
}

export default function GlobalSearchProvider({ children }: GlobalSearchProviderProps) {
  const [isOpen, setIsOpen] = useState(false);

  const openSearch = () => setIsOpen(true);
  const closeSearch = () => setIsOpen(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+K or Ctrl+K
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <GlobalSearchContext.Provider value={{ openSearch, closeSearch, isOpen }}>
      {children}
      <GlobalSearch isOpen={isOpen} onClose={closeSearch} />
    </GlobalSearchContext.Provider>
  );
}
