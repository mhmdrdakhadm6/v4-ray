import { useStore } from '../store'
import { GlassCard } from '../ui'

function protocolBadge(protocol: string) {
  const map: Record<string, string> = {
    vless: 'VLESS',
    vmess: 'VMess',
    trojan: 'Trojan',
    shadowsocks: 'SS',
    hysteria2: 'Hy2',
  }
  return map[protocol] ?? protocol.toUpperCase()
}

function displayHost(c: { server?: string }) {
  return c.server ?? 'unknown'
}

export function Testing() {
  const { progress } = useStore()
  const pct = progress.total ? Math.round((progress.current / progress.total) * 100) : 0

  return (
    <div className="flex flex-col items-center gap-8 text-center">
      <h1 className="text-2xl font-bold text-orange-50 sm:text-3xl">Testing configs…</h1>

      <GlassCard className="w-full max-w-md px-6 py-6">
        <p className="font-mono text-xl text-orange-50">
          {progress.current} <span className="text-orange-200/50">/</span>{' '}
          {progress.total}
        </p>

        <div className="mt-4 h-3 w-full overflow-hidden rounded-full bg-ink-800">
          <div
            className="h-full rounded-full transition-all duration-200"
            style={{
              width: `${pct}%`,
              background: 'linear-gradient(90deg,#ff8a3d,#e3291f)',
              boxShadow: '0 0 12px rgba(249,115,22,0.6)',
            }}
          />
        </div>
        <p className="mt-2 text-right text-xs text-orange-200/50">{pct}%</p>
      </GlassCard>

      {progress.running ? (
        <GlassCard className="w-full max-w-md px-6 py-4">
          <p className="text-xs uppercase tracking-widest text-orange-200/50">Current</p>
          <p className="mt-2 text-lg font-semibold text-orange-50">
            {progress.running.server ? displayHost(progress.running) : 'resolving'} —{' '}
            <span className="text-ember-300">{protocolBadge(progress.running.protocol)}</span>
            {progress.running.latency != null && (
              <span className="ml-2 text-orange-200/60">{progress.running.latency} ms</span>
            )}
          </p>
        </GlassCard>
      ) : (
        <p className="text-sm text-orange-200/50">Starting…</p>
      )}
    </div>
  )
}
