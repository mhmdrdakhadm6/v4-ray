import type { ParsedConfig } from './parser'

export interface LatencyResult {
  ok: boolean
  latencyMs: number // avg of successful attempts
  successRate: number // 0..100
}

// Ping the config's host:port directly from the user's browser.
// A browser cannot speak VLESS/Trojan/VMess, but it CAN open a TCP connection
// to the same host:port (no-cors fetch). This measures reachability + RTT
// from the user's own internet line, which is the closest a static web page
// can get to a real per-user latency measurement.

function candidates(cfg: ParsedConfig): string[] {
  const host = cfg.server as string
  const port = cfg.port as number
  const out: string[] = []
  if (port === 443) {
    out.push(`https://${host}/`)
  } else if (port === 80) {
    out.push(`http://${host}/`)
  } else {
    out.push(`https://${host}:${port}/`, `http://${host}:${port}/`)
  }
  return out
}

function pingUrl(url: string, timeoutMs: number): Promise<{ ok: boolean; ms: number }> {
  return new Promise((resolve) => {
    const started = performance.now()
    const ctrl = new AbortController()
    const t = setTimeout(() => ctrl.abort(), timeoutMs)
    fetch(url, { mode: 'no-cors', cache: 'no-store', signal: ctrl.signal, credentials: 'omit' })
      .then(() => {
        clearTimeout(t)
        resolve({ ok: true, ms: performance.now() - started })
      })
      .catch(() => {
        clearTimeout(t)
        resolve({ ok: false, ms: performance.now() - started })
      })
  })
}

export async function testLatency(
  cfg: ParsedConfig,
  opts: { timeoutMs: number; attempts: number },
): Promise<LatencyResult> {
  const urls = candidates(cfg)
  const attempts: { ok: boolean; ms: number }[] = []

  for (let i = 0; i < opts.attempts; i++) {
    let best: { ok: boolean; ms: number } = { ok: false, ms: opts.timeoutMs }
    for (const url of urls) {
      const r = await pingUrl(url, opts.timeoutMs)
      if (r.ok && (!best.ok || r.ms < best.ms)) best = r
    }
    attempts.push(best)
  }

  const okCount = attempts.filter((a) => a.ok).length
  const okTimes = attempts.filter((a) => a.ok).map((a) => a.ms)
  const avg = okTimes.length ? okTimes.reduce((a, b) => a + b, 0) / okTimes.length : 0
  return {
    ok: okCount > 0,
    latencyMs: Math.round(avg),
    successRate: (okCount / attempts.length) * 100,
  }
}
