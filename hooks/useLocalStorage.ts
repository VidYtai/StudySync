
import { useState, useEffect, Dispatch, SetStateAction } from 'react';

/**
 * A custom hook to manage state with localStorage.
 * It handles reading from/writing to localStorage and keeps the state
 * synchronized across multiple tabs or windows in real-time.
 */
export function useLocalStorage<T,>(key: string, initialValue: T): [T, Dispatch<SetStateAction<T>>] {
  // Initialize state from localStorage or with the initial value.
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key “${key}”:`, error);
      return initialValue;
    }
  });

  // Effect to write state changes back to localStorage.
  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(storedValue));
    } catch (error) {
      console.error(`Error setting localStorage key “${key}”:`, error);
    }
  }, [key, storedValue]);

  // Effect to listen for changes from other tabs and poll for updates.
  // This ensures the state is "live" and synchronized.
  useEffect(() => {
    // Function to read from storage and update state if it differs.
    const syncState = () => {
        try {
            const item = window.localStorage.getItem(key);
            const newValue = item ? JSON.parse(item) : initialValue;

            // Compare stringified versions to prevent re-renders from objects that are structurally identical.
            // This is crucial to avoid infinite loops.
            if (JSON.stringify(newValue) !== JSON.stringify(storedValue)) {
                setStoredValue(newValue);
            }
        } catch (error) {
            console.error(`Error syncing from localStorage key "${key}":`, error);
        }
    };
    
    // The 'storage' event is the primary, most efficient way to sync across tabs.
    window.addEventListener('storage', syncState);

    // Polling provides a robust fallback to ensure "liveness" if the storage event is missed.
    const intervalId = setInterval(syncState, 2000); // Poll every 2 seconds.

    // Cleanup listeners on component unmount.
    return () => {
      window.removeEventListener('storage', syncState);
      clearInterval(intervalId);
    };
    
    // Dependencies include `storedValue` to ensure `syncState` always has the latest
    // version for comparison, preventing unnecessary updates.
  }, [key, initialValue, storedValue]);

  return [storedValue, setStoredValue];
}
