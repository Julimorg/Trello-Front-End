import { useSyncExternalStore } from 'react'
import { seedState } from './seed'
import { applyPatch, computePatch, isEmptyPatch } from './sync-patch'

// Bump when the seed shape changes so existing browsers pick up the new data.
const STORAGE_KEY = 'careshift_db_v7'
const REALTIME_PATH = '/__careshift_rt'
const listeners = new Set()
const remoteListeners = new Set()

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

function emit() {
  listeners.forEach((listener) => listener())
}

export function getState() {
  return state
}

export function setState(updater) {
  const prev = state
  // Updaters get a shallow copy so helpers that assign onto the root (e.g. notify) never
  // touch `prev`, which keeps the diff below accurate.
  state = typeof updater === 'function' ? updater({ ...prev }) : updater
  persist()
  emit()
  realtime.send({ type: 'patch', patch: computePatch(prev, state) })
}

export function subscribe(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function resetState() {
  state = seedState()
  persist()
  emit()
  realtime.send({ type: 'reset', schema: STORAGE_KEY, state })
}

export function useDb() {
  return useSyncExternalStore(subscribe, getState)
}

// Called with each patch that arrived from another device/tab (not for local changes).
export function onRemotePatch(listener) {
  remoteListeners.add(listener)
  return () => remoteListeners.delete(listener)
}

function applyRemote(patch) {
  state = applyPatch(state, patch)
  persist()
  emit()
  remoteListeners.forEach((listener) => listener(patch))
}

// ---------- realtime sync ----------
// The Vite dev/preview server (and realtime/standalone.js) runs a WebSocket relay; every
// local change is sent as an entity patch and patches from others are applied here.
// Without a relay (static hosting) the app keeps working locally and only syncs tabs.

const statusListeners = new Set()

const realtime = {
  socket: null,
  status: 'connecting', // 'connecting' | 'online' | 'offline'
  clients: 0,
  retry: 0,
  setStatus(status, clients = this.clients) {
    if (status === this.status && clients === this.clients) return
    this.status = status
    this.clients = clients
    this.snapshot = { status, clients }
    statusListeners.forEach((listener) => listener())
  },
  snapshot: { status: 'connecting', clients: 0 },
  send(message) {
    if (message.type === 'patch' && isEmptyPatch(message.patch)) return
    if (this.socket?.readyState === WebSocket.OPEN) this.socket.send(JSON.stringify(message))
  },
  connect() {
    if (typeof window === 'undefined' || typeof WebSocket === 'undefined') return
    const url = `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}${REALTIME_PATH}`
    let socket
    try {
      socket = new WebSocket(url)
    } catch {
      this.setStatus('offline')
      return
    }
    this.socket = socket
    socket.addEventListener('open', () => {
      this.retry = 0
      socket.send(JSON.stringify({ type: 'hello', schema: STORAGE_KEY, state }))
    })
    socket.addEventListener('message', (event) => {
      let message
      try {
        message = JSON.parse(event.data)
      } catch {
        return
      }
      if (message.type === 'snapshot') {
        const patch = computePatch(state, message.state)
        state = message.state
        persist()
        emit()
        if (!isEmptyPatch(patch)) remoteListeners.forEach((listener) => listener(patch))
        this.setStatus('online')
      } else if (message.type === 'patch') {
        applyRemote(message.patch)
      } else if (message.type === 'presence') {
        this.setStatus('online', message.clients)
      }
    })
    socket.addEventListener('close', () => {
      this.socket = null
      this.setStatus(this.retry > 2 ? 'offline' : 'connecting')
      const delay = Math.min(1000 * 2 ** this.retry, 15000)
      this.retry += 1
      setTimeout(() => this.connect(), delay)
    })
  },
}

export function useRealtimeStatus() {
  return useSyncExternalStore(
    (listener) => {
      statusListeners.add(listener)
      return () => statusListeners.delete(listener)
    },
    () => realtime.snapshot,
  )
}

if (typeof window !== 'undefined') {
  // Keep tabs of the same browser in sync even without the relay.
  window.addEventListener('storage', (e) => {
    if (e.key !== STORAGE_KEY || !e.newValue) return
    try {
      const next = JSON.parse(e.newValue)
      const patch = computePatch(state, next)
      if (isEmptyPatch(patch)) return
      state = next
      emit()
      remoteListeners.forEach((listener) => listener(patch))
    } catch {
      // ignore malformed values
    }
  })
  realtime.connect()
}
