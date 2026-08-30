import type { RankedConfig } from './rank'
import { dedupe, parseLines, type ParsedConfig } from './parser'
import { toRanked, rankByPing } from './rank'
import { fetchAllSources } from './sources'
import { testLatency } from './tester'

export interface ClientScanSettings {
  timeoutMs: number
  maxConfigs: number
  topN: number
  protocols: string[]
}

export interface ProgressState {
  current: number
  total: number
  currentServer?: string
  currentProtocol?: string
  currentLatency?: number
}

export interface ClientScanResult {
  configs: RankedConfig[]
  testedAt: number
  totalTested: number
  totalWorking: number
  sourcesFetched: number
  sourceError?: string
}

export async function runClientScan(
  settings: ClientScanSettings,
  onProgress: (p: ProgressState) => void,
): Promise<ClientScanResult> {
  // 1) Fetch sources (from the user's browser)
  let all: ParsedConfig[] = []
  let sourcesFetched = 0
  let sourceError: string | undefined
  try {
    const texts = await fetchAllSources()
    sourcesFetched = texts.length
    for (const t of texts) {
      all = all.concat(parseLines(t))
    }
  } catch (e) {
    sourceError = e instanceof Error ? e.message : 'Failed to fetch sources'
  }

  if (all.length === 0) {
    throw new Error(
      sourceError
        ? `Could not load config sources (${sourceError}). Check your internet / GitHub access.`
        : 'No configs found in sources',
    )
  }

  // 2) Dedupe + filter by protocol
  let list = dedupe(all)
  if (settings.protocols && settings.protocols.length) {
    list = list.filter((c) => settings.protocols.includes(c.protocol))
  }

  // 3) Cap at maxConfigs (even sampling)
  if (list.length > settings.maxConfigs) {
    const step = list.length / settings.maxConfigs
    list = Array.from({ length: settings.maxConfigs }, (_, i) => list[Math.floor(i * step)])
  }

  const total = list.length
  const CONCURRENCY = 12
  const results: RankedConfig[] = new Array(total)
  let completed = 0

  async function worker(startIdx: number) {
    let idx = startIdx
    while (idx < total) {
      const cfg = list[idx]
      onProgress({
        current: completed,
        total,
        currentServer: cfg.server,
        currentProtocol: cfg.protocol,
      })
      const r = await testLatency(cfg, { timeoutMs: settings.timeoutMs, attempts: 2 })
      results[idx] = toRanked(cfg, r)
      completed++
      onProgress({ current: completed, total })
      idx += CONCURRENCY
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, (_, i) => worker(i)))

  const working = results.filter((c) => c.status === 'working')
  const ranked = rankByPing(results, settings.topN)

  return {
    configs: ranked,
    testedAt: Date.now(),
    totalTested: total,
    totalWorking: working.length,
    sourcesFetched,
    sourceError,
  }
}
