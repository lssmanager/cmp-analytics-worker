import { detectRegion, getGeoContext }              from "./modules/geo.js"
import { readConsent, getDefaultConsent, mergeConsent,
         parseConsentBody, buildConsentCookie,
         hasConsentFor }                            from "./modules/consent.js"
import { routePolicies }                            from "./modules/policyRouter.js"
import { injectBanner }                             from "./modules/banner.js"
import { blockScripts, restoreScriptsRuntime }      from "./modules/scriptBlocker.js"
import { trackPageview, trackEventFromRequest }     from "./modules/analytics.js"
import { applyHeaders, corsHeaders, jsonResponse }  from "./modules/headers.js"
import { buildGCMScript, generateNonce }                           from "./modules/gcm.js"
import { detectPlatforms }                          from "./modules/platformDetect.js"
import { readSessionId, buildSessionCookie,
         buildUserIdentity }                        from "./modules/identity.js"
import { buildTimeTrackerScript }                   from "./modules/timeTracker.js"
import { buildUTMScript }                           from "./modules/utmPreserver.js"
import { buildZarazScript }   from "./modules/zarazReporter.js"
import { randomId, ONE_YEAR }                       from "./modules/utils.js"

export default {
  async fetch(request, env, ctx) {
    const url       = new URL(request.url)
    /* ── Bypass WebSocket ── */
    if ((request.headers.get('upgrade') || '').toLowerCase() === 'websocket') {
      return fetch(request)
    }

    /* ── Bypass subdominios: solo procesar www ── */
    const _host = url.hostname
    if (_host !== 'www.learnsocialstudies.com' && _host !== 'learnsocialstudies.com') {
      return fetch(request)
    }



  /* ── Bypass total: rutas que NUNCA deben procesarse ── */
  const BYPASS_PATHS = [
    "/wp-admin/",
    "/wp-login.php",
    "/wp-cron.php",
    "/wp-json/",
    "/wp-includes/",
    "/wp-content/plugins/",
    "/wp-content/themes/",
    "/wp-content/uploads/",
    "/xmlrpc.php",
    "/favicon.ico",
    "/.well-known/",
    "/robots.txt",
    "/sitemap",
  ]
  const BYPASS_EXT = [
    ".js",".css",".woff",".woff2",".ttf",".eot",
    ".png",".jpg",".jpeg",".gif",".svg",".ico",
    ".webp",".mp4",".webm",".pdf",".zip",
  ]
  const isAdminCookie = (request.headers.get("cookie") || "").includes("wordpress_logged_in_")
  const _pathname = url.pathname
  const _ext      = _pathname.includes(".") ? _pathname.slice(_pathname.lastIndexOf(".")).toLowerCase() : ""
  // Rutas propias del worker — NUNCA hacer bypass aunque sea admin
  const WORKER_PATHS = ["/cmp/", "/api/analytics"]
  const isWorkerPath = WORKER_PATHS.some(p => _pathname.startsWith(p))

  const _bypass = !isWorkerPath && (
    BYPASS_PATHS.some(p => _pathname.startsWith(p)) ||
    BYPASS_EXT.includes(_ext) ||
    isAdminCookie
  )
  if (_bypass) return fetch(request)
  /* ── Fin bypass ── */
    const geo_cf    = request.cf || {}
    const region    = detectRegion(geo_cf)
    const geo       = getGeoContext(geo_cf)
    const rawConsent = readConsent(request)
    const consent   = mergeConsent(getDefaultConsent(region), rawConsent)
    const platforms = detectPlatforms(request)

    let sessionId    = readSessionId(request)
    const isNew      = !sessionId
    if (isNew) sessionId = randomId()

    const identity  = buildUserIdentity(request, geo, platforms, region)
    identity.sessionId = sessionId

    /* ── CORS ── */
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders() })
    }

    /* ── POST /cmp/consent ── */
    if (url.pathname === "/cmp/consent" && request.method === "POST") {
      const body = await parseConsentBody(request)
      const next = mergeConsent(getDefaultConsent(region), body)

      if (env.CONSENT_KV) {
        await env.CONSENT_KV.put(
          randomId(),
          JSON.stringify({
            type: "consent_update", region, consent: next,
            geo, sessionId, userId: identity.userId,
            platform: { isMoodle: platforms.isMoodle, isWooCommerce: platforms.isWooCommerce },
            url: request.url,
            userAgent: request.headers.get("user-agent"),
            ts: Date.now()
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
            maxAge: ONE_YEAR, secure: true, sameSite: "Lax", path: "/"
          })
        }
      })
    }

    /* ── POST /cmp/events ── */
    if (url.pathname === "/cmp/events" && request.method === "POST") {
      const result = await trackEventFromRequest(
        request, env, region, consent, geo, platforms, sessionId
      )
      return jsonResponse(result, 200)
    }

    /* ── GET /api/analytics ── */
    if (url.pathname === "/api/analytics" && request.method === "GET") {
      if (!env.ANALYTICS) return jsonResponse({ error: "KV not configured" }, 500)
      const list = await env.ANALYTICS.list({ limit: 500 })
      return jsonResponse({ ok: true, total: list.keys.length, keys: list.keys })
    }

    /* ── Redirect Complianz ── */
    const redirect = routePolicies(url, region)
    if (redirect) {
      return Response.redirect(new URL(redirect, url.origin).toString(), 302)
    }

    /* ── Fetch origen ── */
    let response = await fetch(request)
    response     = applyHeaders(response, region)

    /* ── Inyección HTML ── */
    const ct = response.headers.get("content-type") || ""
    if (ct.includes("text/html")) {

      // 1. GCM v2 update en <head> (solo si hay consent previo)
      const nonce = generateNonce()
      const gcmScript = buildGCMScript(rawConsent, region, nonce)
      if (gcmScript) {
        response = await new HTMLRewriter()
          .on("head", { element(el) { el.append(gcmScript, { html: true }) } })
          .transform(response)
      }

      // 2. UTM preserver en <head>
      const utmScript = buildUTMScript("/cmp/events")
      response = await new HTMLRewriter()
        .on("head", { element(el) { el.append(utmScript, { html: true }) } })
        .transform(response)

      // 3. Bloquear scripts por categoría
      response = await blockScripts(response, consent)

      // 4. Banner CMP
      response = await injectBanner(response, {
        region,
        consent    : rawConsent,   // rawConsent = null si no hay cookie
        mergedConsent: consent,    // consent mergeado para toggles del panel
        request,
        endpoint   : "/cmp/consent",
        legalHubPath: "/legal-hub"
      })

      // 5. Restaurar scripts tras consentimiento
      response = await restoreScriptsRuntime(response)

      // 6. Time tracker
      const timeScript = buildTimeTrackerScript(sessionId, "/cmp/events")
      response = await new HTMLRewriter()
        .on("body", { element(el) { el.append(timeScript, { html: true }) } })
        .transform(response)

      // 7. Zaraz reporter (track + ecommerce)
      const zarazScript = buildZarazScript({ consent, geo, sessionId, region })
      response = await new HTMLRewriter()
        .on("body", { element(el) { el.append(zarazScript, { html: true }) } })
        .transform(response)

    }

    /* ── Analytics edge ── */
    if (request.method === "GET" && hasConsentFor(consent, "analytics")) {
      ctx.waitUntil(
        trackPageview(request, env, region, consent, geo, platforms, sessionId, identity)
      )
    }

    /* ── Cookie de sesión cross-domain ── */
    const finalHeaders = new Headers(response.headers)
    if (isNew) {
      finalHeaders.append("set-cookie", buildSessionCookie(sessionId))
    }

    return new Response(response.body, {
      status: response.status, statusText: response.statusText,
      headers: finalHeaders
    })
  }
}
// AGREGAR esta función antes del fetch handler
