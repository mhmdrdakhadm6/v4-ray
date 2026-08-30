export type Protocol =
  | 'vless'
  | 'vmess'
  | 'trojan'
  | 'shadowsocks'
  | 'hysteria2'
  | 'unknown'

export type ConfigStatus = 'unknown' | 'testing' | 'working' | 'failed' | 'timeout'

export interface ServerConfig {
  id: string
  protocol: Protocol
  rawConfig: string
  server?: string
  port?: number
  country?: string

  latency?: number // ms
  successRate?: number // 0..100
  score?: number // 0..100

  status: ConfigStatus
}

export interface RankedResult {
  configs: ServerConfig[] // sorted desc by score
  testedAt: number
  totalTested: number
  totalWorking: number
}

export interface ProgressUpdate {
  type: 'progress'
  current: number
  total: number
  running: ServerConfig | null
}

export interface ScanResultMessage {
  type: 'result'
  result: RankedResult
}

export interface ErrorMessage {
  type: 'error'
  message: string
}

export type WsMessage = ProgressUpdate | ScanResultMessage | ErrorMessage

export interface ScanRequest {
  timeoutMs: number
  maxConfigs: number
  topN: number
  protocols: Protocol[]
}

export const DEFAULT_SCAN: ScanRequest = {
  timeoutMs: 6000,
  maxConfigs: 300,
  topN: 5,
  protocols: ['vless', 'vmess', 'trojan', 'shadowsocks', 'hysteria2'],
}
