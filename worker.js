import { routePolicies } from "./modules/policyRouter.js"
import { detectRegion, getGeoContext } from "./modules/geo.js"
import {
  readConsent,
  getDefaultConsent,
  mergeConsent,
  parseConsentBody,
  buildConsentCookie,
  hasConsentFor,
} from "./modules/consent.js"
import { injectBanner } from "./modules/banner.js"
import { blockScripts, restoreScriptsRuntime } from "./modules/scriptBlocker.js"
import { trackPageview, trackEventFromRequest } from "./modules/analytics.js"
import { applyHeaders, corsHeaders, jsonResponse } from "./modules/headers.js"
import { buildGCMScript, generateNonce } from "./modules/gcm.js"
import { detectPlatforms } from "./modules/platformDetect.js"
import { readSessionId, buildSessionCookie, buildUserIdentity } from "./modules/identity.js"
import { buildTimeTrackerScript } from "./modules/timeTracker.js"
import { buildUTMScript } from "./modules/utmPreserver.js"
import { buildZarazScript } from "./modules/zarazReporter.js"
import { randomId, ONE_YEAR } from "./modules/utils.js"


export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url)
    const pathname = url.pathname.toLowerCase()

    // 1) Bypass WebSocket
    if ((request.headers.get("upgrade") || "").toLowerCase() === "websocket") {
      return fetch(request)
    }

    // 2) Bypass por host: solo estos dominios
    const host = url.hostname
    if (
      host !== "www.learnsocialstudies.com" &&
      host !== "learnsocialstudies.com" &&
      host !== "lms.learnsocialstudies.com"
    ) {
      return fetch(request)
    }

    // 3) Bypass por paths internos de WP muy frecuentes
    const BYPASS_PATH_PREFIXES = [
      "/wp-admin/",
      "/wp-login.php",
      "/wp-cron.php",
      "/wp-json/",
      "/wp-includes/",
      "/wp-content/plugins/",
      "/wp-content/themes/",
      "/wp-content/uploads/",
      "/wp-content/cache/",
      "/wc-api/",
      "/?wc-ajax=",
      "/xmlrpc.php",
      "/favicon.ico",
      "/.well-known/",
      "/robots.txt",
      "/sitemap",
      "/cdn-cgi/",
    ]

    for (const prefix of BYPASS_PATH_PREFIXES) {
      if (pathname.startsWith(prefix)) {
        return fetch(request)
      }
    }

    // 4) Bypass por extensión (assets)
    const dotIndex = pathname.lastIndexOf(".")
    let ext = ""
    if (dotIndex !== -1) {
      ext = pathname.slice(dotIndex).toLowerCase()
      const BYPASS_EXT = new Set([
        ".js", ".mjs", ".css",
        ".woff", ".woff2", ".ttf", ".eot",
        ".png", ".jpg", ".jpeg", ".gif", ".svg", ".ico", ".webp", ".avif",
        ".mp4", ".webm", ".mp3",
        ".pdf", ".zip", ".rar", ".7z",
        ".xml", ".txt", ".map",
      ])
      if (BYPASS_EXT.has(ext)) {
        return fetch(request)
      }
    }

    // 5) Bypass por cookie de admin (panel WP)
    const cookies = request.headers.get("cookie") || ""
    const isAdminCookie = cookies.includes("wordpress_logged_in_")

    // 6) Paths del propio Worker que sí deben pasar
    const WORKER_PATHS = ["/cmp/", "/api/analytics"]
    const isWorkerPath = WORKER_PATHS.some((p) => pathname.startsWith(p))

    // 7) Bypass por User-Agent y Accept (bots, preloads, no-HTML)
    const ua = (request.headers.get("user-agent") || "").toLowerCase()
    const accept = (request.headers.get("accept") || "").toLowerCase()
    const isFlyingPressPreload = request.headers.has("x-flying-press-preload")

    const BOT_KEYWORDS = [
      "googlebot",
      "bingbot",
      "duckduckbot",
      "baiduspider",
      "yandex",
      "uptimerobot",
      "crawler",
      "spider",
      "headless",
      "python-requests",
    ]
    const isBotUA = BOT_KEYWORDS.some((b) => ua.includes(b))
    const isNonHtmlAccept = accept && !accept.includes("text/html")

    const shouldBypass =
      !isWorkerPath &&
      (
        BYPASS_PATH_PREFIXES.some((p) => pathname.startsWith(p)) ||
        (ext && [
          ".js", ".mjs", ".css",
          ".woff", ".woff2", ".ttf", ".eot",
          ".png", ".jpg", ".jpeg", ".gif", ".svg", ".ico", ".webp", ".avif",
          ".mp4", ".webm", ".mp3",
          ".pdf", ".zip", ".rar", ".7z",
          ".xml", ".txt", ".map",
        ].includes(ext)) ||
        isAdminCookie ||
        isBotUA ||
        isFlyingPressPreload ||
        isNonHtmlAccept
      )

    if (shouldBypass) {
      return fetch(request)
    }
   
    const geo_cf = request.cf || {}
    const region = detectRegion(geo_cf)
    const geo = getGeoContext(geo_cf)

    const rawConsent = readConsent(request)
    const consent = mergeConsent(getDefaultConsent(region), rawConsent)

    const platforms = detectPlatforms(request)

    let sessionId = readSessionId(request)
    const isNew = !sessionId
    if (isNew) sessionId = randomId()

    const identity = buildUserIdentity(request, geo, platforms, region)
    identity.sessionId = sessionId

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders(),
      })
    }

    if (url.pathname === "/cmp/consent" && request.method === "POST") {
      const body = await parseConsentBody(request)
      const next = mergeConsent(getDefaultConsent(region), body)

      if (env.CONSENT_KV) {
        await env.CONSENT_KV.put(
          randomId(),
          JSON.stringify({
            type: "consent_update",
            region,
            consent: next,
            geo,
            sessionId,
            userId: identity.userId,
            platform: {
              isMoodle: platforms.isMoodle,
              isWooCommerce: platforms.isWooCommerce,
            },
            url: request.url,
            userAgent: request.headers.get("user-agent"),
            ts: Date.now(),
          }),
          { expirationTtl: ONE_YEAR }
        )
      }

      return new Response(JSON.stringify({ ok: true, consent: next }), {
        status: 200,
        headers: {
          ...corsHeaders(),
          "content-type": "application/json; charset=utf-8",
          "set-cookie": buildConsentCookie(next, {
            maxAge: ONE_YEAR,
            secure: true,
            sameSite: "Lax",
            path: "/",
          }),
        },
      })
    }

    if (url.pathname === "/cmp/events" && request.method === "POST") {
      const result = await trackEventFromRequest(
        request,
        env,
        region,
        consent,
        geo,
        platforms,
        sessionId
      )
      return jsonResponse(result, 200)
    }

    if (url.pathname === "/api/analytics" && request.method === "GET") {
      if (!env.ANALYTICS) {
        return jsonResponse({ error: "KV not configured" }, 500)
      }

      const list = await env.ANALYTICS.list({ limit: 500 })
      return jsonResponse({
        ok: true,
        total: list.keys.length,
        keys: list.keys,
      })
    }

    const redirect = routePolicies(url, region)
    if (redirect) {
      return Response.redirect(new URL(redirect, url.origin).toString(), 302)
    }

    let response = await fetch(request)
    response = applyHeaders(response, region)

    const ct = response.headers.get("content-type") || ""

    if (ct.includes("text/html")) {
      const nonce = generateNonce()

      const gcmScript = buildGCMScript(rawConsent, region, nonce)
      if (gcmScript) {
        response = await new HTMLRewriter()
          .on("head", {
            element(el) {
              el.append(gcmScript, { html: true })
            },
          })
          .transform(response)
      }

      const utmScript = buildUTMScript("/cmp/events")
      response = await new HTMLRewriter()
        .on("head", {
          element(el) {
            el.append(utmScript, { html: true })
          },
        })
        .transform(response)

      response = await blockScripts(response, consent)

      response = await injectBanner(response, {
        region,
        consent: rawConsent,
        mergedConsent: consent,
        request,
        endpoint: "/cmp/consent",
        legalHubPath: "/legal-hub",
      })

      response = await restoreScriptsRuntime(response)

      const timeScript = buildTimeTrackerScript(sessionId, "/cmp/events")
      response = await new HTMLRewriter()
        .on("body", {
          element(el) {
            el.append(timeScript, { html: true })
          },
        })
        .transform(response)

      const zarazScript = buildZarazScript({
        consent,
        geo,
        sessionId,
        region,
      })

      response = await new HTMLRewriter()
        .on("body", {
          element(el) {
            el.append(zarazScript, { html: true })
          },
        })
        .transform(response)
    }

    if (request.method === "GET" && hasConsentFor(consent, "analytics")) {
      ctx.waitUntil(
        trackPageview(
          request,
          env,
          region,
          consent,
          geo,
          platforms,
          sessionId,
          identity
        )
      )
    }

    const finalHeaders = new Headers(response.headers)
    if (isNew) {
      finalHeaders.append("set-cookie", buildSessionCookie(sessionId))
    }

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: finalHeaders,
    })
  },
}
