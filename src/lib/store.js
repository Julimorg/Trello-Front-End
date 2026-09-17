import { useSyncExternalStore } from 'react'
import { seedState } from './seed'

const STORAGE_KEY = 'careshift_db_v1'
const listeners = new Set()

function loadInitialState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {
    // ignore corrupted storage
  }
  return seedState()
}

let state = loadInitialState()

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // storage unavailable, keep working in-memory
  }
}

export function getState() {
  return state
}

export function setState(updater) {
  state = typeof updater === 'function' ? updater(state) : updater
  persist()
  listeners.forEach((listener) => listener())
}

export function subscribe(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function resetState() {
  state = seedState()
  persist()
  listeners.forEach((listener) => listener())
}

export function useDb() {
  return useSyncExternalStore(subscribe, getState)
}
