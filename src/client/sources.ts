// Source lists as raw.githubusercontent.com URLs (CORS-friendly).
// Converted from the GitHub blob URLs in the PRD.

function toRaw(blobUrl: string): string {
  const m = /^https:\/\/github\.com\/([^/]+)\/([^/]+)\/blob\/([^/]+)\/(.+)$/.exec(blobUrl)
  if (!m) return blobUrl
  const [, owner, repo, branch, ...rest] = m
  return `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${rest.join('/')}`
}

const BLOB_SOURCES = [
  'https://github.com/barry-far/V2ray-Config/blob/main/Sub1.txt',
  'https://github.com/barry-far/V2ray-Config/blob/main/Sub10.txt',
  'https://github.com/barry-far/V2ray-Config/blob/main/Sub11.txt',
  'https://github.com/barry-far/V2ray-Config/blob/main/Sub12.txt',
  'https://github.com/barry-far/V2ray-Config/blob/main/Sub13.txt',
  'https://github.com/barry-far/V2ray-Config/blob/main/Sub14.txt',
  'https://github.com/barry-far/V2ray-Config/blob/main/Sub15.txt',
  'https://github.com/barry-far/V2ray-Config/blob/main/Sub2.txt',
  'https://github.com/barry-far/V2ray-Config/blob/main/Sub3.txt',
  'https://github.com/barry-far/V2ray-Config/blob/main/Sub4.txt',
  'https://github.com/barry-far/V2ray-Config/blob/main/Sub5.txt',
  'https://github.com/barry-far/V2ray-Config/blob/main/Sub6.txt',
  'https://github.com/barry-far/V2ray-Config/blob/main/Sub7.txt',
  'https://github.com/barry-far/V2ray-Config/blob/main/Sub8.txt',
  'https://github.com/barry-far/V2ray-Config/blob/main/Sub9.txt',
  'https://github.com/ebrasha/free-v2ray-public-list/blob/main/ssr_configs.txt',
  'https://github.com/ebrasha/free-v2ray-public-list/blob/main/trojan_configs.txt',
  'https://github.com/ebrasha/free-v2ray-public-list/blob/main/vmess_configs.txt',
  'https://github.com/ebrasha/free-v2ray-public-list/blob/main/V2Ray-Config-By-EbraSha.txt',
  'https://github.com/Epodonios/v2ray-configs/blob/main/Sub1.txt',
  'https://github.com/Epodonios/v2ray-configs/blob/main/Sub2.txt',
  'https://github.com/Epodonios/v2ray-configs/blob/main/Sub21.txt',
  'https://github.com/Epodonios/v2ray-configs/blob/main/Sub22.txt',
  'https://github.com/Epodonios/v2ray-configs/blob/main/Sub23.txt',
  'https://github.com/Epodonios/v2ray-configs/blob/main/Sub24.txt',
  'https://github.com/Epodonios/v2ray-configs/blob/main/Sub25.txt',
  'https://github.com/Epodonios/v2ray-configs/blob/main/Sub26.txt',
  'https://github.com/Epodonios/v2ray-configs/blob/main/Sub3.txt',
  'https://github.com/Epodonios/v2ray-configs/blob/main/Sub4.txt',
  'https://github.com/Epodonios/v2ray-configs/blob/main/Sub5.txt',
  'https://github.com/Epodonios/v2ray-configs/blob/main/Sub6.txt',
  'https://github.com/Epodonios/v2ray-configs/blob/main/Sub7.txt',
  'https://github.com/Epodonios/v2ray-configs/blob/main/Sub8.txt',
]

export const SOURCE_URLS: string[] = BLOB_SOURCES.map(toRaw)

export async function fetchAllSources(): Promise<string[]> {
  const results = await Promise.all(
    SOURCE_URLS.map(async (url) => {
      try {
        const ctrl = new AbortController()
        const t = setTimeout(() => ctrl.abort(), 25000)
        const res = await fetch(url, { signal: ctrl.signal })
        clearTimeout(t)
        if (!res.ok) return ''
        return await res.text()
      } catch {
        return ''
      }
    }),
  )
  return results.filter(Boolean)
}
