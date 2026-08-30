import type { ReactNode } from 'react'

export function GlassCard({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={`rounded-2xl border border-ink-700/70 bg-white/[0.04] backdrop-blur-xl shadow-[0_8px_40px_rgba(0,0,0,0.6)] ${className}`}
    >
      {children}
    </div>
  )
}

export function PrimaryButton({
  children,
  onClick,
  disabled,
  className = '',
}: {
  children: ReactNode
  onClick?: () => void
  disabled?: boolean
  className?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`relative overflow-hidden rounded-xl px-6 py-3 font-semibold text-black transition-all disabled:cursor-not-allowed disabled:opacity-40 ${className}`}
      style={{
        background: 'linear-gradient(135deg,#ff8a3d 0%,#f97316 45%,#e3291f 100%)',
        boxShadow: '0 0 24px rgba(249,115,22,0.35), 0 8px 24px rgba(0,0,0,0.5)',
      }}
    >
      {children}
    </button>
  )
}

export function Chip({
  children,
  active,
  onClick,
}: {
  children: ReactNode
  active?: boolean
  onClick?: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1 text-xs font-medium transition-all ${
        active
          ? 'border-ember-500 bg-ember-500/20 text-ember-300 shadow-[0_0_12px_rgba(249,115,22,0.4)]'
          : 'border-ink-700 text-ink-700 hover:border-ember-500/60 hover:text-ember-400'
      }`}
    >
      {children}
    </button>
  )
}
