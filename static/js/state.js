// static/js/state.js — Lightweight centralized state
export const state = {
  tab: 'queue',
  selectedPoId: null,
  isAdmin: false,
  passphrase: '',
  toasts: [],
  loading: {},
  stats: {},
  queue: [],
  currentPo: null
};

const listeners = new Map();

export function subscribe(key, callback) {
  if (!listeners.has(key)) listeners.set(key, new Set());
  listeners.get(key).add(callback);
  return () => listeners.get(key).delete(callback);
}

export function setState(key, value) {
  state[key] = value;
  if (listeners.has(key)) {
    listeners.get(key).forEach(cb => cb(value));
  }
}
