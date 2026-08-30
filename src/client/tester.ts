import type { ParsedConfig } from './parser'

export interface LatencyResult {
  ok: boolean
  latencyMs: number // median of successful attempts
  successRate: number // 0..100
}

// RTT is measured directly from the user's browser to the config's host:port.
//
// Strategy (most accurate -> fallback):
//   1. WebSocket handshake  - open event gives a clean TCP/WS round-trip. WebSocket
//      is NOT subject to CORS, so it works against any host:port from a static page.
//   2. no-cors fetch        - if the server doesn't accept a WS upgrade, a plain
//      TCP/HTTP connection still measures reachability + RTT.
//
// Final latency = MEDIAN of successful attempts (robust against outliers).

const PRIVATE_OR_LOOPBACK =
  /^(localhost|::1|127\.\d+\.\d+\.\d+|0\.0\.0\.0|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+|169\.254\.\d+\.\d+|\[?::ffff:)/i

/** True when the host is a real public-internet address we should test. */
export function isPublicInternetHost(host: string | undefined): boolean {
  if (!host) return false
  if (PRIVATE_OR_LOOPBACK.test(host)) return false
  // Non-numeric hostnames (domains) are fine; numeric hosts must not be private.
  return true
}

function wsUrl(cfg: ParsedConfig): string {
  const host = cfg.server as string
  const port = cfg.port as number
  const secure = window.location.protocol === 'https:'
  if (port === 443) return `wss://${host}/`
  if (port === 80) return `${secure ? 'wss' : 'ws'}://${host}/`
  return `${secure ? 'wss' : 'ws'}://${host}:${port}/`
}

function httpUrl(cfg: ParsedConfig): string {
  const host = cfg.server as string
  const port = cfg.port as number
  if (port === 443) return `https://${host}/`
  if (port === 80) return `https://${host}/`
  return `https://${host}:${port}/`
}

function tryWebSocket(url: string, timeoutMs: number): Promise<{ ok: boolean; ms: number }> {
  return new Promise((resolve) => {
    const started = performance.now()
    let socket: WebSocket | null = null
    let done = false
    const finish = (ok: boolean) => {
      if (done) return
      done = true
      clearTimeout(timer)
      try {
        socket?.close()
      } catch {
        /* noop */
      }
      resolve({ ok, ms: performance.now() - started })
    }
    const timer = setTimeout(() => finish(false), timeoutMs)
    try {
      socket = new WebSocket(url)
    } catch {
      finish(false)
      return
    }
    socket.onopen = () => finish(true)
    socket.onerror = () => finish(false)
  })
}

function tryFetch(url: string, timeoutMs: number): Promise<{ ok: boolean; ms: number }> {
  return new Promise((resolve) => {
    const started = performance.now()
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), timeoutMs)
    fetch(url, { mode: 'no-cors', cache: 'no-store', signal: ctrl.signal, credentials: 'omit' })
      .then(() => {
        clearTimeout(timer)
        resolve({ ok: true, ms: performance.now() - started })
      })
      .catch(() => {
        clearTimeout(timer)
        resolve({ ok: false, ms: performance.now() - started })
      })
  })
}

async function probeOnce(cfg: ParsedConfig, timeoutMs: number): Promise<{ ok: boolean; ms: number }> {
  const ws = await tryWebSocket(wsUrl(cfg), timeoutMs)
  if (ws.ok) return ws
  return tryFetch(httpUrl(cfg), timeoutMs)
}

function median(values: number[]): number {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

export async function testLatency(
  cfg: ParsedConfig,
  opts: { timeoutMs: number; attempts: number },
): Promise<LatencyResult> {
  const successTimes: number[] = []

  for (let i = 0; i < opts.attempts; i++) {
    const r = await probeOnce(cfg, opts.timeoutMs)
    if (r.ok) successTimes.push(r.ms)
  }

  const ok = successTimes.length > 0
  return {
    ok,
    latencyMs: Math.round(median(successTimes)),
    successRate: (successTimes.length / opts.attempts) * 100,
  }
}
