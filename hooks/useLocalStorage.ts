
import { useState, useEffect, Dispatch, SetStateAction } from 'react';

export function useLocalStorage<T,>(key: string, initialValue: T): [T, Dispatch<SetStateAction<T>>] {
  
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key “${key}”:`, error);
      return initialValue;
    }
  });

  
  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(storedValue));
    } catch (error) {
      console.error(`Error setting localStorage key “${key}”:`, error);
    }
  }, [key, storedValue]);

  
  
  useEffect(() => {
    
    const syncState = () => {
        try {
            const item = window.localStorage.getItem(key);
            const newValue = item ? JSON.parse(item) : initialValue;

            
            
            if (JSON.stringify(newValue) !== JSON.stringify(storedValue)) {
                setStoredValue(newValue);
            }
        } catch (error) {
            console.error(`Error syncing from localStorage key "${key}":`, error);
        }
    };
    
    
    window.addEventListener('storage', syncState);

    
    const intervalId = setInterval(syncState, 2000); 

    
    return () => {
      window.removeEventListener('storage', syncState);
      clearInterval(intervalId);
    };
    
    
    
  }, [key, initialValue, storedValue]);

  return [storedValue, setStoredValue];
}
