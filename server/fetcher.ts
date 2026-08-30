import { SOURCES } from './sources.js'

const FETCH_TIMEOUT_MS = 20000

export async function fetchSources(): Promise<{ url: string; content: string | null }[]> {
  const results = await Promise.all(
    SOURCES.map(async (url) => {
      try {
        const ctrl = new AbortController()
        const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS)
        const res = await fetch(url, { signal: ctrl.signal, redirect: 'follow' })
        clearTimeout(timer)
        if (!res.ok) return { url, content: null }
        const text = await res.text()
        return { url, content: text.length ? text : null }
      } catch {
        return { url, content: null }
      }
    }),
  )
  return results
}
