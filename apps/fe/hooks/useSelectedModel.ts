'use client';

import { useCallback, useEffect, useState } from 'react';
import { DEFAULT_MODEL, SELECTED_MODEL_STORAGE_KEY } from '@/lib/constants';

/**
 * Shared, persistent source of truth for the currently selected model.
 *
 * The choice is stored in localStorage so it stays consistent across the hero,
 * dashboard, and session pages (and across reloads/navigations) and only changes
 * when the user explicitly picks a different model. It also syncs between open
 * tabs via the `storage` event.
 */
export function useSelectedModel() {
  const [model, setModelState] = useState<string>(DEFAULT_MODEL);

  // Hydrate from localStorage on mount (client-only to stay SSR-safe).
  useEffect(() => {
    const stored = localStorage.getItem(SELECTED_MODEL_STORAGE_KEY);
    if (stored) setModelState(stored);

    const onStorage = (e: StorageEvent) => {
      if (e.key === SELECTED_MODEL_STORAGE_KEY && e.newValue) {
        setModelState(e.newValue);
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const setModel = useCallback((next: string) => {
    setModelState(next);
    localStorage.setItem(SELECTED_MODEL_STORAGE_KEY, next);
  }, []);

  return [model, setModel] as const;
}
