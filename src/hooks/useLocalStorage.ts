
import { useState, useEffect } from 'react';

export function useLocalStorage<T>(key: string, initialValue: T | (() => T)) {
  const [value, setValue] = useState<T>(() => {
    const saved = localStorage.getItem(key);
    if (saved !== null) {
      try {
        const parsed = JSON.parse(saved);
        
        // Helper to recursively convert date strings to Date objects
        const reviveDates = (obj: any): any => {
          if (obj === null || obj === undefined) return obj;
          if (typeof obj === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(obj)) {
            return new Date(obj);
          }
          if (Array.isArray(obj)) {
            return obj.map(reviveDates);
          }
          if (typeof obj === 'object') {
            const revived: any = {};
            for (const k in obj) {
              revived[k] = reviveDates(obj[k]);
            }
            return revived;
          }
          return obj;
        };

        return reviveDates(parsed) as T;
      } catch (e) {
        return saved as unknown as T;
      }
    }
    return typeof initialValue === 'function' ? (initialValue as () => T)() : initialValue;
  });

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue] as const;
}
