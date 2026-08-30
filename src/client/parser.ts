export type Protocol =
  | 'vless'
  | 'vmess'
  | 'trojan'
  | 'shadowsocks'
  | 'hysteria2'
  | 'unknown'

export function detectProtocol(line: string): Protocol {
  if (line.startsWith('vless://')) return 'vless'
  if (line.startsWith('vmess://')) return 'vmess'
  if (line.startsWith('trojan://')) return 'trojan'
  if (line.startsWith('ss://')) return 'shadowsocks'
  if (line.startsWith('hysteria2://') || line.startsWith('hy2://')) return 'hysteria2'
  return 'unknown'
}

function getDomain(host: string | undefined): string | undefined {
  if (!host) return undefined
  const h = host.replace(/^\[|\]$/g, '').split('#')[0]
  return h || undefined
}

export interface ParsedConfig {
  id: string
  protocol: Protocol
  rawConfig: string
  server?: string
  port?: number
}

function atobSafe(b64: string): string {
  try {
    return decodeURIComponent(
      b64
        .replace(/-/g, '+')
        .replace(/_/g, '/')
        .padEnd(b64.length + ((4 - (b64.length % 4)) % 4), '=')
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join(''),
    )
  } catch {
    return b64
  }
}

export function parseLine(rawLine: string, index: number): ParsedConfig | null {
  const line = rawLine.trim()
  if (!line) return null
  const protocol = detectProtocol(line)
  if (protocol === 'unknown') return null

  let server: string | undefined
  let port: number | undefined

  if (protocol === 'vmess') {
    try {
      const b64 = line.slice('vmess://'.length).split('?')[0].split('#')[0]
      const jsonStr = atobSafe(b64)
      const obj = JSON.parse(jsonStr) as Record<string, string | number>
      server = typeof obj.add === 'string' ? getDomain(obj.add) : undefined
      port = typeof obj.port === 'number' ? obj.port : undefined
    } catch {
      return null
    }
  } else {
    try {
      const u = new URL(line)
      port = u.port ? Number(u.port) : undefined
      server = getDomain(u.hostname)
    } catch {
      return null
    }
  }

  if (!server || !port || port <= 0) return null

  return { id: `cfg-${index}`, protocol, rawConfig: line, server, port }
}

export function parseLines(content: string): ParsedConfig[] {
  const seen = new Set<string>()
  const out: ParsedConfig[] = []
  const lines = content.split(/\r?\n/)
  for (let i = 0; i < lines.length; i++) {
    const cfg = parseLine(lines[i], i)
    if (!cfg) continue
    if (seen.has(cfg.rawConfig)) continue
    seen.add(cfg.rawConfig)
    out.push(cfg)
  }
  return out
}

export function dedupe(configs: ParsedConfig[]): ParsedConfig[] {
  const seenRaw = new Set<string>()
  const seenKey = new Set<string>()
  const out: ParsedConfig[] = []
  for (const c of configs) {
    if (seenRaw.has(c.rawConfig)) continue
    seenRaw.add(c.rawConfig)
    if (c.server && c.port) {
      const key = `${c.protocol}::${c.server.toLowerCase()}::${c.port}`
      if (seenKey.has(key)) continue
      seenKey.add(key)
    }
    out.push(c)
  }
  return out
}
