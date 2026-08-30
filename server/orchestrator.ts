import type { ScanRequest, ServerConfig } from '../shared/types.js'
import { fetchSources } from './fetcher.js'
import { dedupe, parseLines } from './parser.js'
import { testConfig } from './tester.js'
import { rankAndSlice, scoreConfig } from './scorer.js'

export interface ProgressListener {
  (current: number, total: number, running: ServerConfig | null): void
}

export async function runScan(
  req: ScanRequest,
  onProgress: ProgressListener,
): Promise<{ configs: ServerConfig[]; testedAt: number; totalTested: number; totalWorking: number }> {
  const sources = await fetchSources()

  // Parse + combine
  let all: ServerConfig[] = []
  for (const s of sources) {
    if (s.content) {
      all = all.concat(parseLines(s.content))
    }
  }

  // Dedupe
  let cfgList = dedupe(all)

  // Apply protocol filter
  if (req.protocols && req.protocols.length) {
    cfgList = cfgList.filter((c) => req.protocols.includes(c.protocol))
  }

  // Limit max configs (sample evenly so we don't always test the first N)
  if (cfgList.length > req.maxConfigs) {
    const step = cfgList.length / req.maxConfigs
    cfgList = Array.from({ length: req.maxConfigs }, (_, i) => cfgList[Math.floor(i * step)])
  }

  const total = cfgList.length
  const testOpts = { timeoutMs: req.timeoutMs, attempts: 2 }
  const CONCURRENCY = 20

  const tested: ServerConfig[] = new Array(total)
  let completed = 0

  async function worker(idx: number) {
    const cfg = { ...cfgList[idx], status: 'testing' as const }
    onProgress(completed, total, cfg)
    const result = await testConfig(cfg, testOpts)
    const worked =
      result.ok && cfg.server && cfg.port
        ? { ...cfg, latency: result.latencyMs, successRate: result.successRate, status: 'working' as const }
        : { ...cfg, successRate: 0, status: ('failed' as const) }
    tested[idx] = scoreConfig(worked)
    completed++
    onProgress(completed, total, null)
  }

  let cursor = 0
  async function pump() {
    const workers: Promise<void>[] = []
    for (let i = 0; i < CONCURRENCY; i++) {
      workers.push(
        (async () => {
          while (cursor < total) {
            const idx = cursor++
            await worker(idx)
          }
        })(),
      )
    }
    await Promise.all(workers)
  }
  await pump()

  const totalWorking = tested.filter((c) => c && c.status === 'working').length
  const ranked = rankAndSlice(tested, req.topN, total, totalWorking, Date.now())
  return ranked
}
