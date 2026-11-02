import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';

/** A JSON value kept on the phone and shared live between screens. useValue() is undefined while loading. */
export function storedValue<T>(key: string) {
  const listeners = new Set<(v: T | null) => void>();

  async function set(v: T | null) {
    if (v === null) await AsyncStorage.removeItem(key);
    else await AsyncStorage.setItem(key, JSON.stringify(v));
    listeners.forEach((l) => l(v));
  }

  function useValue(): T | null | undefined {
    const [value, setValue] = useState<T | null | undefined>(undefined);
    useEffect(() => {
      AsyncStorage.getItem(key).then((s) => setValue(s ? JSON.parse(s) : null)).catch(() => setValue(null));
      listeners.add(setValue);
      return () => { listeners.delete(setValue); };
    }, []);
    return value;
  }

  return { set, useValue };
}
