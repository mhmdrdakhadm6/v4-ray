import type { ParsedConfig } from './parser'
import type { LatencyResult } from './tester'

export interface RankedConfig extends ParsedConfig {
  latency?: number
  successRate?: number
  score?: number
  status: 'working' | 'failed'
}

export function toRanked(cfg: ParsedConfig, r: LatencyResult): RankedConfig {
  const latencyScore = r.latencyMs ? Math.max(0, 100 - r.latencyMs / 5) : 0
  const successScore = r.successRate
  const score = Math.round(latencyScore * 0.7 + successScore * 0.3)
  return {
    ...cfg,
    latency: r.latencyMs,
    successRate: r.successRate,
    score,
    status: r.ok ? 'working' : 'failed',
  }
}

export function rankByPing(list: RankedConfig[], topN: number): RankedConfig[] {
  const working = list.filter((c) => c.status === 'working')
  working.sort((a, b) => (a.latency ?? Infinity) - (b.latency ?? Infinity))
  return working.slice(0, topN)
}
