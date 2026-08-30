import { create } from 'zustand'
import type { ClientScanResult, ClientScanSettings, ProgressState } from './client/scan'

export type Phase = 'home' | 'testing' | 'result' | 'settings' | 'error'

const DEFAULT_SETTINGS: ClientScanSettings = {
  timeoutMs: 6000,
  maxConfigs: 300,
  topN: 5,
  protocols: ['vless', 'vmess', 'trojan', 'shadowsocks', 'hysteria2'],
}

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
  settings: { ...DEFAULT_SETTINGS },
  scanning: false,
  lastWorking: 0,
  lastTested: 0,

  updateSettings: (patch) =>
    set((s) => ({ settings: { ...s.settings, ...patch } })),

  startScan: async () => {
    set({ phase: 'testing', progress: { current: 0, total: 0 }, result: null, error: null, scanning: true })

    try {
      // lazy import so the parser/tester code only loads when needed
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
