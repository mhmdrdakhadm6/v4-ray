import express from 'express'
import { createServer } from 'node:http'
import { WebSocketServer } from 'ws'
import type { ErrorMessage, ScanRequest, WsMessage } from '../shared/types.js'
import { runScan } from './orchestrator.js'
import { SOURCE_COUNT } from './sources.js'

const PORT = Number(process.env.PORT || 8787)

const app = express()
app.use(express.json())

const httpServer = createServer(app)
const wss = new WebSocketServer({ server: httpServer, path: '/ws' })

function broadcast(msg: WsMessage) {
  for (const client of wss.clients) {
    if (client.readyState === client.OPEN) {
      client.send(JSON.stringify(msg))
    }
  }
}

// A single global scan at a time. Progress is streamed to the WebSocket.
let scanning = false

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, scanning, sources: SOURCE_COUNT })
})

app.get('/api/sources', (_req, res) => {
  res.json({ count: SOURCE_COUNT })
})

app.post('/api/scan', (req, res) => {
  if (scanning) {
    res.status(409).json({ error: 'A scan is already running' })
    return
  }
  scanning = true
  const body = (req.body || {}) as Partial<ScanRequest>
  const scanReq: ScanRequest = {
    timeoutMs: body.timeoutMs ?? 6000,
    maxConfigs: body.maxConfigs ?? 300,
    topN: body.topN ?? 5,
    protocols: body.protocols ?? ['vless', 'vmess', 'trojan', 'shadowsocks'],
  }
  res.json({ started: true })

  runScan(scanReq, (current, total, running) => {
    broadcast({ type: 'progress', current, total, running })
  })
    .then((result) => {
      broadcast({ type: 'result', result } as WsMessage)
    })
    .catch((err) => {
      const msg: ErrorMessage = {
        type: 'error',
        message: err instanceof Error ? err.message : 'Scan failed',
      }
      broadcast(msg)
    })
    .finally(() => {
      scanning = false
    })
})

wss.on('connection', (socket) => {
  socket.send(JSON.stringify({ type: 'hello' }))
})

httpServer.listen(PORT, () => {
  console.log(`[server] listening on http://localhost:${PORT}`)
})
