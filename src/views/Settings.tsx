import { useState } from 'react'
import { useStore } from '../store'
import { Chip, GlassCard } from '../ui'

const ALL_PROTOCOLS = ['vless', 'vmess', 'trojan', 'shadowsocks', 'hysteria2']

function name(p: string) {
  const map: Record<string, string> = {
    vless: 'VLESS',
    vmess: 'VMess',
    trojan: 'Trojan',
    shadowsocks: 'Shadowsocks',
    hysteria2: 'Hysteria2',
  }
  return map[p] ?? p
}

export function Settings() {
  const { settings, updateSettings } = useStore()
  const [timeout, setTimeoutVal] = useState(String(settings.timeoutMs))
  const [maxConfigs, setMaxConfigs] = useState(String(settings.maxConfigs))
  const [topN, setTopN] = useState(String(settings.topN))
  const [saved, setSaved] = useState(false)

  const commit = () => {
    updateSettings({
      timeoutMs: Math.min(30000, Math.max(1000, Number(timeout) || 6000)),
      maxConfigs: Math.min(500, Math.max(10, Number(maxConfigs) || 300)),
      topN: Math.min(20, Math.max(1, Number(topN) || 5)),
    })
    setSaved(true)
    window.setTimeout(() => setSaved(false), 1500)
  }

  const toggleProtocol = (p: string) => {
    const has = settings.protocols.includes(p)
    let next: string[]
    if (has) {
      next = settings.protocols.filter((x) => x !== p)
      if (next.length === 0) next = [p]
    } else {
      next = [...settings.protocols, p]
    }
    updateSettings({ protocols: next })
    setSaved(true)
    window.setTimeout(() => setSaved(false), 1500)
  }

  const field =
    'w-full rounded-lg border border-ink-700 bg-ink-900/60 px-3 py-2 text-sm text-orange-50 outline-none focus:border-ember-500'

  return (
    <GlassCard className="w-full max-w-md mx-auto px-6 py-6">
      <h1 className="text-xl font-bold text-orange-50">Settings</h1>

      <div className="mt-5 space-y-5">
        <label className="block">
          <span className="mb-1 block text-xs uppercase tracking-wider text-orange-200/50">Timeout (ms)</span>
          <input className={field} value={timeout} onChange={(e) => setTimeoutVal(e.target.value)} onBlur={commit} />
        </label>

        <label className="block">
          <span className="mb-1 block text-xs uppercase tracking-wider text-orange-200/50">Max configs to test</span>
          <input className={field} value={maxConfigs} onChange={(e) => setMaxConfigs(e.target.value)} onBlur={commit} />
        </label>

        <label className="block">
          <span className="mb-1 block text-xs uppercase tracking-wider text-orange-200/50">Top N results</span>
          <input className={field} value={topN} onChange={(e) => setTopN(e.target.value)} onBlur={commit} />
        </label>

        <div>
          <span className="mb-2 block text-xs uppercase tracking-wider text-orange-200/50">Protocols</span>
          <div className="flex flex-wrap gap-1.5">
            {ALL_PROTOCOLS.map((p) => (
              <Chip key={p} active={settings.protocols.includes(p)} onClick={() => toggleProtocol(p)}>
                {name(p)}
              </Chip>
            ))}
          </div>
        </div>

        <button
          onClick={commit}
          className={`w-full rounded-xl px-4 py-3 text-sm font-bold transition-all ${
            saved
              ? 'bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-400/50'
              : 'text-black ring-1 ring-ember-500/60 hover:brightness-110'
          }`}
          style={{ background: saved ? undefined : 'linear-gradient(135deg,#ff8a3d,#f97316 45%,#e3291f)' }}
        >
          {saved ? 'Saved ✓' : 'Save settings'}
        </button>
        <p className="text-center text-xs text-orange-200/40">
          Settings are stored on this device (localStorage).
        </p>
      </div>
    </GlassCard>
  )
}
