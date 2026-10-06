// Realtime relay for the CareShift demo. Every connected browser keeps its own copy of the
// state; the relay holds the shared copy, hands it to newcomers and fans each change patch
// out to everyone else, so a patient and a nurse on different devices see each other live.
import { WebSocketServer } from 'ws'
import { applyPatch, isEmptyPatch } from '../src/lib/sync-patch.js'

export const REALTIME_PATH = '/__careshift_rt'

export function attachRealtime(httpServer, { log = console } = {}) {
  const wss = new WebSocketServer({ noServer: true })
  let shared = null // { schema, data, version }

  const send = (socket, message) => {
    if (socket.readyState === socket.OPEN) socket.send(JSON.stringify(message))
  }
  const broadcast = (message, except) => {
    wss.clients.forEach((client) => client !== except && send(client, message))
  }
  const sendPresence = () => broadcast({ type: 'presence', clients: wss.clients.size })

  httpServer.on('upgrade', (req, socket, head) => {
    if (!req.url || !req.url.startsWith(REALTIME_PATH)) return
    wss.handleUpgrade(req, socket, head, (ws) => wss.emit('connection', ws, req))
  })

  wss.on('connection', (socket) => {
    socket.on('message', (raw) => {
      let message
      try {
        message = JSON.parse(raw.toString())
      } catch {
        return
      }
      if (message.type === 'hello') {
        // The first browser (or one on a newer data schema) seeds the shared state.
        if (!shared || shared.schema !== message.schema) {
          shared = { schema: message.schema, data: message.state, version: 1 }
          log.info?.(`[realtime] state seeded by a client (${message.schema})`)
        }
        send(socket, { type: 'snapshot', state: shared.data, version: shared.version })
        sendPresence()
        return
      }
      if (message.type === 'patch' && shared && !isEmptyPatch(message.patch)) {
        shared.data = applyPatch(shared.data, message.patch)
        shared.version += 1
        broadcast({ type: 'patch', patch: message.patch, version: shared.version }, socket)
        return
      }
      if (message.type === 'reset') {
        shared = { schema: message.schema, data: message.state, version: (shared?.version || 0) + 1 }
        broadcast({ type: 'snapshot', state: shared.data, version: shared.version }, socket)
      }
    })
    socket.on('close', sendPresence)
  })

  return wss
}

// Vite plugin: the relay runs inside `npm run dev` and `npm run preview`, on the same port.
export function careshiftRealtime() {
  return {
    name: 'careshift-realtime',
    configureServer(server) {
      if (server.httpServer) attachRealtime(server.httpServer, { log: server.config.logger })
    },
    configurePreviewServer(server) {
      if (server.httpServer) attachRealtime(server.httpServer, { log: server.config.logger })
    },
  }
}
