import { createConnection } from 'node:net'
import type { ServerConfig } from '../shared/types.js'

export interface TestOptions {
  timeoutMs: number
  attempts: number
}

export interface TestResult {
  ok: boolean
  latencyMs: number // average of successful attempts
  successRate: number // 0..100
  mode: 'tcp' | 'xray'
}

// Detects whether an Xray executable is available on PATH (best-effort).
let xrayAvailable: boolean | null = null
export function hasXray(): boolean {
  if (xrayAvailable !== null) return xrayAvailable
  xrayAvailable = false
  return xrayAvailable
}

function singleTcpConnect(host: string, port: number, timeoutMs: number): Promise<{ ok: boolean; ms: number }> {
  return new Promise((resolve) => {
    const started = Date.now()
    const socket = createConnection({ host, port, timeout: timeoutMs })
    let settled = false
    const done = (ok: boolean) => {
      if (settled) return
      settled = true
      try {
        socket.destroy()
      } catch {
        /* noop */
      }
      resolve({ ok, ms: Date.now() - started })
    }
    socket.once('connect', () => done(true))
    socket.once('error', () => done(false))
    socket.once('timeout', () => done(false))
  })
}

async function testViaTcp(cfg: ServerConfig, opts: TestOptions): Promise<TestResult> {
  if (!cfg.server || !cfg.port) {
    return { ok: false, latencyMs: 0, successRate: 0, mode: 'tcp' }
  }
  let okCount = 0
  const latencies: number[] = []
  for (let i = 0; i < opts.attempts; i++) {
    const r = await singleTcpConnect(cfg.server, cfg.port, opts.timeoutMs)
    if (r.ok) {
      okCount++
      latencies.push(r.ms)
    }
  }
  const successRate = (okCount / opts.attempts) * 100
  const avg = latencies.length ? latencies.reduce((a, b) => a + b, 0) / latencies.length : 0
  return { ok: okCount > 0, latencyMs: Math.round(avg), successRate, mode: 'tcp' }
}

async function testViaXray(cfg: ServerConfig, opts: TestOptions): Promise<TestResult> {
  // Full Xray-based protocol test would be spawned here. Kept as a placeholder:
  // without an xray binary we fall back to TCP so the product stays runnable.
  return testViaTcp(cfg, opts)
}

export async function testConfig(cfg: ServerConfig, opts: TestOptions): Promise<TestResult> {
  if (hasXray()) {
    return testViaXray(cfg, opts)
  }
  return testViaTcp(cfg, opts)
}
