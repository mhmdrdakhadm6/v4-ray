import { create } from 'zustand'
import type { ClientScanResult, ClientScanSettings, ProgressState } from './client/scan'

export type Phase = 'home' | 'testing' | 'result' | 'settings' | 'error'

const STORAGE_KEY = 'v4ray-settings'

const DEFAULT_SETTINGS: ClientScanSettings = {
  timeoutMs: 6000,
  maxConfigs: 300,
  topN: 5,
  protocols: ['vless', 'vmess', 'trojan', 'shadowsocks', 'hysteria2'],
}

// --- localStorage persistence -------------------------------------------

function mergeSettings(saved: unknown): ClientScanSettings {
  const base = { ...DEFAULT_SETTINGS }
  if (!saved || typeof saved !== 'object') return base
  const s = saved as Record<string, unknown>
  const merged: ClientScanSettings = {
    ...base,
    ...(typeof s.timeoutMs === 'number' ? { timeoutMs: s.timeoutMs } : {}),
    ...(typeof s.maxConfigs === 'number' ? { maxConfigs: s.maxConfigs } : {}),
    ...(typeof s.topN === 'number' ? { topN: s.topN } : {}),
    ...(Array.isArray(s.protocols)
      ? { protocols: (s.protocols as unknown[]).filter((p): p is string => typeof p === 'string') }
      : {}),
  }
  return merged
}

function loadSettings(): ClientScanSettings {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...DEFAULT_SETTINGS }
    return mergeSettings(JSON.parse(raw))
  } catch {
    return { ...DEFAULT_SETTINGS }
  }
}

function saveSettings(settings: ClientScanSettings) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  } catch {
    /* storage unavailable (private mode etc.) — ignore */
  }
}

// --- state --------------------------------------------------------------

interface AppState {
  phase: Phase
  progress: ProgressState
  result: ClientScanResult | null
  error: string | null
  settings: ClientScanSettings
  scanning: boolean
  lastWorking: number
  lastTested: number

  updateSettings: (patch: Partial<ClientScanSettings>) => void
  startScan: () => Promise<void>
  reset: () => void
  goSettings: () => void
}

export const useStore = create<AppState>((set) => ({
  phase: 'home',
  progress: { current: 0, total: 0 },
  result: null,
  error: null,
  settings: loadSettings(),
  scanning: false,
  lastWorking: 0,
  lastTested: 0,

  updateSettings: (patch) =>
    set((s) => {
      const next: ClientScanSettings = { ...s.settings, ...patch }
      saveSettings(next)
      return { settings: next }
    }),

  startScan: async () => {
    set({ phase: 'testing', progress: { current: 0, total: 0 }, result: null, error: null, scanning: true })

    try {
      const { runClientScan } = await import('./client/scan')
      const settings = useStore.getState().settings
      const result = await runClientScan(settings, (progress) => {
        useStore.setState({ progress })
      })
      set({
        phase: 'result',
        result,
        scanning: false,
        lastWorking: result.totalWorking,
        lastTested: result.totalTested,
      })
    } catch (e) {
      set({
        phase: 'error',
        error: e instanceof Error ? e.message : 'Scan failed',
        scanning: false,
      })
    }
  },

  reset: () => set({ phase: 'home' }),
  goSettings: () => set({ phase: 'settings' }),
}))
