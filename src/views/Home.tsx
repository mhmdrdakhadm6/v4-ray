import { useStore } from '../store'
import { GlassCard, PrimaryButton } from '../ui'

export function Home() {
  const { startScan, result } = useStore()

  const last = result

  return (
    <div className="flex flex-col items-center gap-8 text-center">
      <div>
        <p className="text-sm uppercase tracking-[0.35em] text-ember-500">Smart Config Selector</p>
        <h1 className="mt-3 text-4xl font-extrabold leading-tight text-orange-50 sm:text-5xl">
          Best configs,
          <br />
          <span className="bg-gradient-to-r from-ember-300 via-ember-500 to-flame-500 bg-clip-text text-transparent">
            zero effort.
          </span>
        </h1>
        <p className="mx-auto mt-4 max-w-md text-sm text-orange-200/60">
          One tap. Test ping from your own connection, rank by latency &amp; success, and grab the
          fastest working configs — copy, QR, or download.
        </p>
      </div>

      <PrimaryButton onClick={startScan} className="px-10 py-4 text-lg">
        Find Best Configs
      </PrimaryButton>

      <GlassCard className="w-full max-w-md px-6 py-5 text-sm">
        {last ? (
          <>
            <p className="text-orange-100/70">Last scan</p>
            <p className="mt-1 text-lg font-semibold text-orange-50">
              {last.totalTested.toLocaleString()} tested &rarr; {last.totalWorking} working &rarr; Top{' '}
              {last.configs.length} shown
            </p>
          </>
        ) : (
          <p className="text-orange-200/50">No scan yet. Press the button to begin.</p>
        )}
      </GlassCard>
    </div>
  )
}
