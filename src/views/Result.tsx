import { useMemo, useState } from 'react'
import { QRCodeCanvas } from 'qrcode.react'
import type { ServerConfig } from '../../shared/types'
import { useStore } from '../store'
import { Chip, GlassCard } from '../ui'

const MEDALS = ['🥇', '🥈', '🥉']

const PROTOCOLS: ServerConfig['protocol'][] = ['vless', 'vmess', 'trojan', 'shadowsocks', 'hysteria2']

function protocolName(p: ServerConfig['protocol']) {
  const map: Record<string, string> = {
    vless: 'VLESS',
    vmess: 'VMess',
    trojan: 'Trojan',
    shadowsocks: 'Shadowsocks',
    hysteria2: 'Hysteria2',
  }
  return map[p] ?? p
}

function flagFor(server?: string): string {
  if (!server) return '🌐'
  const m = /(?:^|\.)([a-z]{2})$/.exec(server.toLowerCase())
  if (!m) return '🌐'
  const code = m[1].toUpperCase()
  // country-code top-level domains only
  const cc: Record<string, string> = {
    DE: '🇩🇪', NL: '🇳🇱', FI: '🇫🇮', FR: '🇫🇷', US: '🇺🇸', GB: '🇬🇧', UK: '🇬🇧',
    CA: '🇨🇦', AU: '🇦🇺', JP: '🇯🇵', SG: '🇸🇬', SE: '🇸🇪', CH: '🇨🇭', IT: '🇮🇹',
    PL: '🇵🇱', TR: '🇹🇷', RU: '🇷🇺', UA: '🇺🇦',
  }
  return cc[code] ?? '🌐'
}

function copyText(text: string) {
  navigator.clipboard?.writeText(text).catch(() => {})
}

function download(raw: string, name: string) {
  const blob = new Blob([raw], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.click()
  URL.revokeObjectURL(url)
}

function ConfigCard({
  config,
  rank,
  onShowQr,
}: {
  config: ServerConfig
  rank: number
  onShowQr: (c: ServerConfig) => void
}) {
  const [copied, setCopied] = useState(false)

  const doCopy = () => {
    copyText(config.rawConfig)
    setCopied(true)
    setTimeout(() => setCopied(false), 1200)
  }

  const medal = rank < 3 ? MEDALS[rank] : `#${rank + 1}`

  return (
    <GlassCard className="px-5 py-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{medal}</span>
          <span className="text-xl">{flagFor(config.server)}</span>
          <div>
            <p className="font-semibold text-orange-50">
              {config.server ?? 'unknown'} <span className="ml-1 text-xs font-normal text-ember-400">:{config.port}</span>
            </p>
            <p className="text-xs uppercase tracking-wider text-orange-200/50">{protocolName(config.protocol)}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xl font-bold text-ember-300">{config.latency ?? '—'} <span className="text-xs">ms</span></p>
          <p className="text-xs text-orange-200/60">Success {Math.round(config.successRate ?? 0)}%</p>
        </div>
        <div className="w-16 text-right">
          <p className="text-lg font-extrabold text-flame-400">{config.score ?? 0}</p>
          <p className="text-[10px] uppercase tracking-wider text-orange-200/40">score</p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap justify-end gap-2">
        <button
          onClick={doCopy}
          className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all ${
            copied
              ? 'border-emerald-400/60 bg-emerald-400/10 text-emerald-300'
              : 'border-ember-500/50 text-ember-300 hover:bg-ember-500/15'
          }`}
        >
          {copied ? 'Copied ✓' : 'Copy'}
        </button>
        <button
          onClick={() => onShowQr(config)}
          className="rounded-lg border border-ember-500/50 px-3 py-1.5 text-xs font-semibold text-ember-300 transition-all hover:bg-ember-500/15"
        >
          QR
        </button>
        <button
          onClick={() => download(config.rawConfig, `config-${rank + 1}.txt`)}
          className="rounded-lg border border-flame-500/50 px-3 py-1.5 text-xs font-semibold text-flame-400 transition-all hover:bg-flame-500/15"
        >
          Download
        </button>
      </div>
    </GlassCard>
  )
}

export function Result() {
  const { result, startScan } = useStore()
  const [filter, setFilter] = useState<string>('all')
  const [sort, setSort] = useState<'ping' | 'score'>('ping')
  const [qrConfig, setQrConfig] = useState<ServerConfig | null>(null)

  const filtered = useMemo(() => {
    const base: ServerConfig[] = result?.configs ?? []
    let list = filter === 'all' ? [...base] : base.filter((c) => c.protocol === filter)
    list = [...list].sort((a, b) => {
      if (sort === 'ping') {
        const al = a.latency ?? Number.POSITIVE_INFINITY
        const bl = b.latency ?? Number.POSITIVE_INFINITY
        return al - bl
      }
      return (b.score ?? 0) - (a.score ?? 0)
    })
    return list
  }, [result, filter, sort])

  if (!result) return null

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-orange-50 sm:text-3xl">Ranked Configs</h1>
        <button
          onClick={() => startScan()}
          className="rounded-lg border border-ember-500/50 px-4 py-2 text-sm font-semibold text-ember-300 transition-all hover:bg-ember-500/15"
        >
          ↻ Re-scan
        </button>
      </div>

      <p className="text-sm text-orange-200/60">
        {result.totalTested.toLocaleString()} tested &middot; {result.totalWorking} working &middot; showing{' '}
        {filtered.length} fastest
      </p>

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap gap-1.5">
          <Chip active={filter === 'all'} onClick={() => setFilter('all')}>
            All
          </Chip>
          {PROTOCOLS.map((p) => (
            <Chip key={p} active={filter === p} onClick={() => setFilter(p)}>
              {protocolName(p)}
            </Chip>
          ))}
        </div>
        <div className="ml-auto flex gap-1.5">
          {(['score', 'ping'] as const).map((s) => (
            <Chip key={s} active={sort === s} onClick={() => setSort(s)}>
              Sort by {s === 'score' ? 'score' : 'ping'}
            </Chip>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {filtered.map((c, i) => (
          <ConfigCard key={c.id} config={c} rank={i} onShowQr={setQrConfig} />
        ))}
      </div>

      {qrConfig && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          onClick={() => setQrConfig(null)}
        >
          <GlassCard
            className="p-6 text-center"
          >
            <p className="mb-4 text-sm font-semibold text-orange-50">Scan to import</p>
            <QRCodeCanvas value={qrConfig.rawConfig} size={220} fgColor="#0b0705" bgColor="#ffffff" />
            <p className="mt-3 text-xs text-orange-200/60 font-mono break-all">{qrConfig.server}:{qrConfig.port}</p>
            <div className="mt-4 flex justify-center gap-2">
              <button
                onClick={() => setQrConfig(null)}
                className="rounded-lg border border-ink-700 px-4 py-1.5 text-xs font-semibold text-orange-200/70 hover:text-orange-50"
              >
                Close
              </button>
              <button
                onClick={() => copyText(qrConfig.rawConfig)}
                className="rounded-lg border border-ember-500/50 px-4 py-1.5 text-xs font-semibold text-ember-300 hover:bg-ember-500/15"
              >
                Copy
              </button>
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  )
}
