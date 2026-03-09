import { randomId, anonymizeIP, serializeQuery, safeJsonParse } from "./utils.js"

function parseUA(ua = "") {
  const s = ua.toLowerCase()
  return {
    browser: s.includes("firefox") ? "firefox" : s.includes("edg") ? "edge"
           : s.includes("chrome")  ? "chrome"  : s.includes("safari") ? "safari" : "other",
    os     : s.includes("android") ? "android" : (s.includes("iphone")||s.includes("ipad")) ? "ios"
           : s.includes("windows") ? "windows" : s.includes("mac os") ? "macos"
           : s.includes("linux")   ? "linux"   : "other",
    device : s.includes("mobile")||s.includes("iphone") ? "mobile"
           : s.includes("tablet")||s.includes("ipad")   ? "tablet" : "desktop"
  }
}

export async function trackPageview(request, env, region, consent, geo, platforms, sessionId, identity) {
  const url = new URL(request.url)
  const ua  = parseUA(request.headers.get("user-agent") || "")
  const ip  = anonymizeIP(request.headers.get("cf-connecting-ip"), region)

  const event = {
    id       : randomId(), type: "pageview",
    url      : url.toString(), path: url.pathname,
    host     : url.host, referrer: request.headers.get("referer"),
    query    : serializeQuery(url),
    sessionId, consent, region, geo,
    browser  : ua.browser, os: ua.os, device: ua.device, ip,
    userId   : identity.userId,
    isAnon   : !identity.userId,
    fingerprint: identity.fingerprint,
    platform : {
      isMoodle     : platforms.isMoodle,
      isWooCommerce: platforms.isWooCommerce,
      isLoggedIn   : platforms.isLoggedInWP || platforms.isLoggedInMoodle,
      moodleCtx    : identity.moodleContext,
      wooCtx       : identity.wooContext,
      host         : platforms.host
    },
    timestamp: Date.now()
  }

  const SKIP_KV = ["time_on_page","heartbeat","scroll_depth","ping","time_update"]
  if (env.ANALYTICS && !SKIP_KV.includes(event.type)) {
    try {
      await env.ANALYTICS.put(event.id, JSON.stringify(event), {
        expirationTtl: 60 * 60 * 24 * 365
      })
    } catch (kvErr) {
      console.warn("[analytics] KV skip:", kvErr.message)
    }
  }
}

export async function trackEventFromRequest(request, env, region, consent, geo, platforms, sessionId) {
  if (!consent?.analytics) {
    return { ok: false, skipped: true, reason: "analytics_consent_required" }
  }
  const body = safeJsonParse(await request.text(), {})
  const ua   = parseUA(request.headers.get("user-agent") || "")
  const ip   = anonymizeIP(request.headers.get("cf-connecting-ip"), region)

  const event = {
    id         : randomId(),
    type       : body.type      || "custom",
    eventName  : body.eventName || null,
    sessionId  : body.sessionId || sessionId,
    properties : body.properties || {},
    page       : body.page     || null,
    host       : body.host     || null,
    consent, region, geo,
    browser    : ua.browser, os: ua.os, device: ua.device, ip,
    platform   : {
      isMoodle     : platforms.isMoodle,
      isWooCommerce: platforms.isWooCommerce,
      hasCart      : platforms.hasCartItems
    },
    timestamp  : Date.now()
  }

  const skipKV = ["time_on_page","heartbeat","scroll_depth","ping","time_update"].includes(event.type)
  if (env.ANALYTICS && !skipKV) {
    try {
      await env.ANALYTICS.put(event.id, JSON.stringify(event), {
        expirationTtl: 60 * 60 * 24 * 365
      })
    } catch (kvErr) {
      console.warn("[analytics] KV skip:", kvErr.message)
    }
  }
  return { ok: true, id: event.id }
}
