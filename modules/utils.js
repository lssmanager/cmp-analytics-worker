export const ONE_YEAR    = 60 * 60 * 24 * 365
export const ONE_MONTH   = 60 * 60 * 24 * 30

export function randomId() {
  return crypto.randomUUID()
}

export function parseCookieHeader(header = "") {
  const out = {}
  header.split(";").forEach(part => {
    const idx = part.indexOf("=")
    if (idx === -1) return
    out[part.slice(0, idx).trim()] = part.slice(idx + 1).trim()
  })
  return out
}

export function safeJsonParse(text, fallback = {}) {
  try { return JSON.parse(text) } catch { return fallback }
}

export function serializeQuery(url) {
  const obj = {}
  url.searchParams.forEach((v, k) => { obj[k] = v })
  return obj
}

export function anonymizeIP(ip, region) {
  if (!ip) return null
  if (region !== "eu" && region !== "ca") return ip
  if (ip.includes(".")) {
    const p = ip.split(".")
    p[3] = "0"
    return p.join(".")
  }
  if (ip.includes(":")) {
    return ip.split(":").slice(0, 4).join(":") + "::"
  }
  return ip
}

export function hashSimple(str) {
  let h = 0
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(31, h) + str.charCodeAt(i) | 0
  }
  return Math.abs(h).toString(36)
}
