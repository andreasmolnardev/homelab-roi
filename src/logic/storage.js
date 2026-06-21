import { STORAGE_KEY, createStore } from '../data/defaults.js';

export function loadStore() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : createStore();
  } catch {
    return createStore();
  }
}

export function saveStore(store) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}
