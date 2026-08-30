import type { Protocol, ServerConfig } from '../shared/types.js'
import { createHash } from 'node:crypto'

function idOf(raw: string): string {
  return createHash('sha1').update(raw).digest('hex').slice(0, 16)
}

function detectProtocol(line: string): Protocol {
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

function parseVmess(raw: string): ServerConfig {
  // vmess:// base64 of JSON
  try {
    const b64 = raw.slice('vmess://'.length).split('?')[0].split('#')[0]
    const jsonStr = Buffer.from(b64, 'base64').toString('utf-8')
    const obj = JSON.parse(jsonStr) as Record<string, string | number>
    const server = typeof obj.add === 'string' ? obj.add : undefined
    const port = typeof obj.port === 'number' ? obj.port : undefined
    return {
      id: idOf(raw),
      protocol: 'vmess',
      rawConfig: raw,
      server: getDomain(server),
      port,
      status: 'unknown',
    }
  } catch {
    return { id: idOf(raw), protocol: 'vmess', rawConfig: raw, status: 'unknown' }
  }
}

function parseHostInfo(raw: string): { server?: string; port?: number } {
  // generic: scheme://user@host:port/params
  try {
    const u = new URL(raw)
    const port = u.port ? Number(u.port) : undefined
    return { server: getDomain(u.hostname), port: port && port > 0 ? port : undefined }
  } catch {
    return {}
  }
}

export function parseLine(rawLine: string): ServerConfig | null {
  const line = rawLine.trim()
  if (!line) return null
  const protocol = detectProtocol(line)
  if (protocol === 'unknown') return null

  if (protocol === 'vmess') {
    const cfg = parseVmess(line)
    if (!cfg.server) return null
    return cfg
  }

  const { server, port } = parseHostInfo(line)
  if (!server || !port) return null

  return {
    id: idOf(line),
    protocol,
    rawConfig: line,
    server,
    port,
    status: 'unknown',
  }
}

export function parseLines(content: string): ServerConfig[] {
  const seen = new Set<string>()
  const out: ServerConfig[] = []
  for (const line of content.split(/\r?\n/)) {
    const cfg = parseLine(line)
    if (!cfg) continue
    if (seen.has(cfg.rawConfig)) continue
    seen.add(cfg.rawConfig)
    out.push(cfg)
  }
  return out
}

export function dedupe(configs: ServerConfig[]): ServerConfig[] {
  // Dedupe by (server, port, protocol) and by rawConfig
  const seenRaw = new Set<string>()
  const seenKey = new Set<string>()
  const out: ServerConfig[] = []
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
