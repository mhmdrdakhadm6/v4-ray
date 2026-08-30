import { create } from 'zustand'
import type { RankedResult, ScanRequest, ServerConfig } from '../shared/types'

export type Phase = 'home' | 'testing' | 'result' | 'settings' | 'error'

interface ProgressState {
  current: number
  total: number
  running: ServerConfig | null
}

interface AppState {
  phase: Phase
  progress: ProgressState
  result: RankedResult | null
  error: string | null
  settings: ScanRequest
  scanning: boolean

  updateSettings: (patch: Partial<ScanRequest>) => void
  startScan: () => Promise<void>
  reset: () => void
  goSettings: () => void
}

let ws: WebSocket | null = null

export const useStore = create<AppState>((set, get) => ({
  phase: 'home',
  progress: { current: 0, total: 0, running: null },
  result: null,
  error: null,
  settings: { timeoutMs: 6000, maxConfigs: 300, topN: 5, protocols: ['vless', 'vmess', 'trojan', 'shadowsocks', 'hysteria2'] },
  scanning: false,

  updateSettings: (patch) =>
    set((s) => ({ settings: { ...s.settings, ...patch } })),

  startScan: async () => {
    // open a fresh websocket for this scan
    if (ws) {
      try {
        ws.close()
      } catch {
        /* noop */
      }
    }

    set({ phase: 'testing', progress: { current: 0, total: 0, running: null }, result: null, error: null, scanning: true })

    ws = new WebSocket(`${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/ws`)
    ws.onmessage = (ev) => {
      const msg = JSON.parse(ev.data as string) as {
        type: string
        current?: number
        total?: number
        running?: ServerConfig | null
        result?: RankedResult
        message?: string
      }
      if (msg.type === 'progress') {
        set({
          progress: {
            current: msg.current ?? 0,
            total: msg.total ?? 0,
            running: msg.running ?? null,
          },
        })
      } else if (msg.type === 'result' && msg.result) {
        set({ phase: 'result', result: msg.result, scanning: false })
      } else if (msg.type === 'error') {
        set({ phase: 'error', error: msg.message ?? 'Scan failed', scanning: false })
      }
    }
    ws.onerror = () => {
      set({ phase: 'error', error: 'Lost connection to test backend', scanning: false })
    }

    try {
      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(get().settings),
      })
      if (res.status === 409) {
        set({ phase: 'error', error: 'A scan is already running', scanning: false })
      }
    } catch {
      set({ phase: 'error', error: 'Could not reach test backend', scanning: false })
    }
  },

  reset: () => set({ phase: 'home' }),
  goSettings: () => set({ phase: 'settings' }),
}))

