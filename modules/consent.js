import { parseCookieHeader, ONE_YEAR } from "./utils.js"

export function readConsent(request) {
  const cookies = parseCookieHeader(request.headers.get("cookie") || "")
  const raw = cookies.consent
  if (!raw) return null
  const obj = {}
  raw.split(",").forEach(pair => {
    const [k, v] = pair.split(":")
    if (k) obj[k] = v === "true"
  })
  return obj
}

export function getDefaultConsent(region) {
  const restricted = region === "eu" || region === "ca"
  return {
    necessary  : true,
    analytics  : !restricted,
    marketing  : !restricted,
    preferences: !restricted
  }
}

export function mergeConsent(base, custom) {
  return { ...base, ...(custom || {}), necessary: true }
}

export async function parseConsentBody(request) {
  const ct = request.headers.get("content-type") || ""
  if (ct.includes("application/json")) {
    return safeJsonParse(await request.text(), {})
  }
  if (ct.includes("application/x-www-form-urlencoded")) {
    const form = await request.formData()
    return {
      necessary  : true,
      analytics  : form.get("analytics")   === "true",
      marketing  : form.get("marketing")   === "true",
      preferences: form.get("preferences") === "true"
    }
  }
  return {}
}

export function buildConsentCookie(consent, opts = {}) {
  const { path = "/", maxAge = ONE_YEAR, secure = true, sameSite = "Lax" } = opts
  const value = Object.entries(consent)
    .map(([k, v]) => `${k}:${Boolean(v)}`).join(",")
  return [
    `consent=${value}`,
    `Path=${path}`,
    `Max-Age=${maxAge}`,
    `SameSite=${sameSite}`,
    secure ? "Secure" : "",
    "HttpOnly"
  ].filter(Boolean).join("; ")
}

export function hasConsentFor(consent, category) {
  if (category === "necessary") return true
  return Boolean(consent?.[category])
}

import { safeJsonParse } from "./utils.js"
