import type { ServerConfig } from '../shared/types.js'

// Score = Latency Score x 70% + Connection Success Score x 30%
// Latency: lower is better. Score = max(0, 100 - latency * factor), capped.
export function scoreConfig(cfg: ServerConfig): ServerConfig {
  const latency = cfg.latency ?? Number.POSITIVE_INFINITY
  const success = cfg.successRate ?? 0

  // Map latency: 0ms -> 100, 500ms -> 0 (linear). Values > 500 clamp to nicer mapping.
  const latencyScore = Math.max(0, 100 - (latency / 5))
  const successScore = success

  const score = Math.round(latencyScore * 0.7 + successScore * 0.3)
  return { ...cfg, score, status: cfg.successRate && cfg.successRate >= 50 ? 'working' : 'failed' }
}

export function rankAndSlice(
  configs: ServerConfig[],
  topN: number,
  totalTested: number,
  totalWorking: number,
  testedAt: number,
) {
  // Show working configs ranked by lowest ping first (the product promise),
  // with score computed for context. Non-working configs sink to the bottom.
  const ranked = configs
    .filter((c) => typeof c.latency === 'number')
    .sort((a, b) => {
      const workDiff = Number(b.status === 'working') - Number(a.status === 'working')
      if (workDiff !== 0) return workDiff
      return (a.latency ?? Number.POSITIVE_INFINITY) - (b.latency ?? Number.POSITIVE_INFINITY)
    })
    .slice(0, topN)
  return { configs: ranked, testedAt, totalTested, totalWorking }
}
