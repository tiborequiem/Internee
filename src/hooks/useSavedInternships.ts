"use client";

import { useState, useEffect, useCallback } from "react";

export type TrackingStatus = "saved" | "applied" | "interviewing";

export interface SavedItemsMap {
  [internshipId: number]: TrackingStatus;
}

const STORAGE_KEY = "egypt_internships_tracker";

export function useSavedInternships() {
  const [savedItems, setSavedItems] = useState<SavedItemsMap>({});
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on client mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && typeof parsed === "object") {
          setSavedItems(parsed);
        }
      }
    } catch (e) {
      console.error("Failed to load saved internships from localStorage:", e);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Sync to localStorage
  const syncToStorage = useCallback((newMap: SavedItemsMap) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newMap));
      // Dispatch storage event so other components or tabs can react
      window.dispatchEvent(new Event("storage-sync"));
    } catch (e) {
      console.error("Failed to persist saved internships to localStorage:", e);
    }
  }, []);

  // Listen for storage events in case multiple components change state
  useEffect(() => {
    const handleSync = () => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          setSavedItems(JSON.parse(stored));
        }
      } catch (e) {
        // ignore
      }
    };

    window.addEventListener("storage-sync", handleSync);
    window.addEventListener("storage", handleSync);
    return () => {
      window.removeEventListener("storage-sync", handleSync);
      window.removeEventListener("storage", handleSync);
    };
  }, []);

  const setItemStatus = useCallback(
    (id: number, status: TrackingStatus) => {
      setSavedItems((prev) => {
        const updated = { ...prev, [id]: status };
        syncToStorage(updated);
        return updated;
      });
    },
    [syncToStorage]
  );

  const removeItem = useCallback(
    (id: number) => {
      setSavedItems((prev) => {
        const updated = { ...prev };
        delete updated[id];
        syncToStorage(updated);
        return updated;
      });
    },
    [syncToStorage]
  );

  const getItemStatus = useCallback(
    (id: number): TrackingStatus | null => {
      return savedItems[id] || null;
    },
    [savedItems]
  );

  const clearAll = useCallback(() => {
    setSavedItems({});
    try {
      localStorage.removeItem(STORAGE_KEY);
      window.dispatchEvent(new Event("storage-sync"));
    } catch (e) {
      console.error(e);
    }
  }, []);

  return {
    savedItems,
    isLoaded,
    setItemStatus,
    removeItem,
    getItemStatus,
    clearAll,
  };
}
