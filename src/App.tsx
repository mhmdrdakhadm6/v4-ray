import { useStore } from './store'
import { Home } from './views/Home'
import { Testing } from './views/Testing'
import { Result } from './views/Result'
import { Settings } from './views/Settings'

export default function App() {
  const { phase, error, reset, goSettings } = useStore()

  return (
    <div className="relative min-h-screen overflow-hidden bg-ink-950 text-orange-50">
      {/* Ambient glass background */}
      <div className="pointer-events-none fixed inset-0">
        <div
          className="absolute -left-32 -top-32 h-[28rem] w-[28rem] rounded-full opacity-30 blur-3xl"
          style={{ background: 'radial-gradient(circle,#f97316 0%,transparent 70%)' }}
        />
        <div
          className="absolute -right-40 top-1/3 h-[32rem] w-[32rem] rounded-full opacity-25 blur-3xl"
          style={{ background: 'radial-gradient(circle,#e3291f 0%,transparent 70%)' }}
        />
        <div
          className="absolute bottom-0 left-1/4 h-[24rem] w-[24rem] rounded-full opacity-20 blur-3xl"
          style={{ background: 'radial-gradient(circle,#ff8a3d 0%,transparent 70%)' }}
        />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-2xl flex-col gap-8 px-5 py-6">
        {/* Top nav */}
        <header className="flex items-center justify-between">
          <button onClick={reset} className="font-mono text-sm font-bold tracking-widest text-ember-300 hover:text-ember-400">
            V4<span className="text-flame-500">RAY</span>
          </button>
          <nav className="flex gap-1 rounded-full border border-ink-700/70 bg-white/[0.03] p-1 backdrop-blur-xl">
            <button
              onClick={reset}
              className={`rounded-full px-4 py-1.5 text-xs font-medium transition-all ${
                phase === 'home' || phase === 'testing' || phase === 'result'
                  ? 'bg-ember-500/20 text-ember-300'
                  : 'text-orange-200/60 hover:text-orange-50'
              }`}
            >
              Scan
            </button>
            <button
              onClick={phase === 'settings' ? reset : goSettings}
              className={`rounded-full px-4 py-1.5 text-xs font-medium transition-all ${
                phase === 'settings' ? 'bg-ember-500/20 text-ember-300' : 'text-orange-200/60 hover:text-orange-50'
              }`}
            >
              Settings
            </button>
          </nav>
        </header>

        <main className="flex flex-1 flex-col justify-center py-8">
          {phase === 'error' && (
            <div className="flex flex-col items-center gap-4 text-center">
              <p className="text-3xl">⚠️</p>
              <p className="text-lg font-semibold text-flame-400">{error}</p>
              <button
                onClick={reset}
                className="rounded-lg border border-ember-500/50 px-5 py-2 text-sm font-semibold text-ember-300 hover:bg-ember-500/15"
              >
                Back
              </button>
            </div>
          )}
          {phase !== 'error' && (
            <>
              {phase === 'home' && <Home />}
              {phase === 'testing' && <Testing />}
              {phase === 'result' && <Result />}
              {phase === 'settings' && <Settings />}
            </>
          )}
        </main>

        <footer className="pb-4 text-center text-xs text-orange-200/40">
          Test &amp; rank only · no VPN connection is established in your browser
        </footer>
      </div>
    </div>
  )
}
