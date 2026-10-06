// Production-style demo server: serves the built app (dist/) and the realtime relay on one port.
//   npm run demo            -> build + serve on http://0.0.0.0:4173
//   PORT=8080 npm run serve -> serve an existing build on another port
import { createReadStream, existsSync, statSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join, normalize } from 'node:path'
import { fileURLToPath } from 'node:url'
import { attachRealtime } from './server.js'

const root = fileURLToPath(new URL('../dist', import.meta.url))
const port = Number(process.env.PORT) || 4173
const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.json': 'application/json',
  '.woff2': 'font/woff2',
}

if (!existsSync(join(root, 'index.html'))) {
  console.error('dist/ not found — run `npm run build` first.')
  process.exit(1)
}

const server = createServer((req, res) => {
  const path = normalize(decodeURIComponent((req.url || '/').split('?')[0])).replace(/^(\.\.[/\\])+/, '')
  let file = join(root, path)
  // Unknown paths fall back to index.html so client-side routes (e.g. /family-invite/CS-…) work.
  if (!file.startsWith(root) || !existsSync(file) || statSync(file).isDirectory()) file = join(root, 'index.html')
  res.writeHead(200, { 'Content-Type': TYPES[extname(file)] || 'application/octet-stream' })
  createReadStream(file).pipe(res)
})

attachRealtime(server)
server.listen(port, '0.0.0.0', () => console.log(`CareShift demo + realtime on http://0.0.0.0:${port}`))
