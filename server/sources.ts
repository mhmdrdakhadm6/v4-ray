// Raw Source URL lists for config fetching.
// Inputs are GitHub blob URLs, we convert them to raw.githubusercontent.com URLs.

const BLOB_RE = /^https:\/\/github\.com\/([^/]+)\/([^/]+)\/blob\/([^/]+)\/(.+)$/

function toRaw(blobUrl: string): string {
  const m = BLOB_RE.exec(blobUrl)
  if (!m) return blobUrl
  const [, owner, repo, branch, ...rest] = m
  return `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${rest.join('/')}`
}

const SOURCES_BLOB: string[] = [
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

export const SOURCES: string[] = SOURCES_BLOB.map(toRaw)
export const SOURCE_COUNT = SOURCES.length
