import { detectRegion, getGeoContext }              from "./modules/geo.js"
import { readConsent, getDefaultConsent, mergeConsent,
         parseConsentBody, buildConsentCookie,
         hasConsentFor }                            from "./modules/consent.js"
import { routePolicies }                            from "./modules/policyRouter.js"
import { injectBanner }                             from "./modules/banner.js"
import { blockScripts, restoreScriptsRuntime }      from "./modules/scriptBlocker.js"
import { trackPageview, trackEventFromRequest, getMoodleCourseAnalytics, exportMLDataset, validateGA4Config } from "./modules/analytics.js"
import { applyHeaders, corsHeaders, jsonResponse }  from "./modules/headers.js"
import { buildGCMScript }                           from "./modules/gcm.js"
import { detectPlatforms }                          from "./modules/platformDetect.js"
import { readSessionId, buildSessionCookie,
         buildUserIdentity }                        from "./modules/identity.js"
import { buildTimeTrackerScript }                   from "./modules/timeTracker.js"
import { buildUTMScript }                           from "./modules/utmPreserver.js"
import { buildZarazReporterScript }                 from "./modules/zarazReporter.js"
import { buildFormTrackerScript }                   from "./modules/formTracker.js"
import { buildLearningTrackerScript }               from "./modules/learningTracker.js"
import { buildSearchTrackerScript }                 from "./modules/searchTracker.js"
import { buildVideoTrackerScript }                  from "./modules/videoTracker.js"
import { buildErrorTrackerScript }                  from "./modules/errorTracker.js"
import { buildMoodleAdvancedTrackerScript }        from "./modules/moodleAdvancedTracker.js"
import { buildUserLifecycleTrackerScript,
         buildWebVitalsTrackerScript,
         buildScrollDepthTrackerScript }            from "./modules/standardEventTrackers.js"
import { buildBuddyBossTrackerScript }              from "./modules/buddyBossTracker.js"
import { randomId, ONE_YEAR }                       from "./modules/utils.js"

export default {
  async fetch(request, env, ctx) {
    ctx.passThroughOnException()

    const url = new URL(request.url)

    // BYPASS: assets, crawlers, wp-admin
    const cfWorker  = request.headers.get('cf-worker') || ''
    const isAsset   = /\.(js|css|woff2?|png|jpg|jpeg|gif|svg|ico|webp|map|txt|xml)(\?|$)/i.test(url.pathname)
    const isWpAdmin = url.pathname.startsWith('/wp-admin')
    if (cfWorker || isAsset || isWpAdmin) {
      return fetch(request)
    }

    // GEO + REGION
    const cf     = request.cf ?? {}
    const geo    = getGeoContext(cf)
    const region = detectRegion(cf)

    // IP
    const rawIP     = request.headers.get('cf-connecting-ip')
    const visitorIP = anonymizeIP(rawIP, region) ?? rawIP

    // CONSENT (solo para lógica interna / Zaraz / analytics)
    const rawConsent = readConsent(request)
    const consent    = rawConsent ?? getDefaultConsent(region)

    // PLATFORM + IDENTITY
    const platforms = detectPlatforms(request)
    let   sessionId = readSessionId(request)
    const isNewUser = !sessionId
    if (!sessionId) {
      const { randomId } = await import('./modules/utils.js')
      sessionId = randomId()
    }
    // NOTE: identity removed - was used for server-side tracking (now client-side)
    // const identity = buildUserIdentity(request, geo, platforms, region)

    // POLICY REDIRECT
    const policyPath = routePolicies(url, region)
    if (policyPath) {
      return Response.redirect(
        'https://www.learnsocialstudies.com' + policyPath,
        302
      )
    }

    // CONSENT POST (endpoint del banner)
    if (request.method === 'POST' && url.pathname === '/__cmp/consent') {
      const body   = await parseConsentBody(request)
      const merged = { necessary: true, ...body }
      const cookie = buildConsentCookie(merged)
      return new Response('OK', {
        status: 200,
        headers: {
          'Set-Cookie'  : cookie,
          'Content-Type': 'text/plain'
        }
      })
    }

    /* ── POST /cmp/events ── */
    if ((url.pathname === "/cmp/events" || url.pathname === "/__cmp/analytics") && request.method === "POST") {
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

    /* ── GET /api/analytics ── */
    if (url.pathname === "/api/analytics" && request.method === "GET") {
      if (!env.ANALYTICS) return jsonResponse({ error: "KV not configured" }, 500)
      const list = await env.ANALYTICS.list({ limit: 500 })
      return jsonResponse({ ok: true, total: list.keys.length, keys: list.keys })
    }

    /* ── GET /api/analytics/moodle/:courseId ── */
    const moodleCourseMatch = url.pathname.match(/^\/api\/analytics\/moodle\/(\d+)$/)
    if (moodleCourseMatch && request.method === "GET") {
      const courseId = moodleCourseMatch[1]
      const result = await getMoodleCourseAnalytics(env, courseId, {
        dateFrom: url.searchParams.get("date_from"),
        limit: parseInt(url.searchParams.get("limit") || "100")
      })
      return jsonResponse(result, result.status || 200)
    }

    /* ── GET /api/analytics/ml/dataset ── */
    if (url.pathname === "/api/analytics/ml/dataset" && request.method === "GET") {
      const result = await exportMLDataset(env, {
        courseId: url.searchParams.get("courseId"),
        limit: parseInt(url.searchParams.get("limit") || "10000"),
        format: url.searchParams.get("format") || "jsonl",
        region: region
      })
      const status = result.status || (result.ok ? 200 : 400)
      const contentType = result.format === "csv" ? "text/csv" : "application/json"
      return new Response(result.data || JSON.stringify(result), {
        status: status,
        headers: { "content-type": contentType }
      })
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
      const gcmScript = buildGCMScript(rawConsent)
      if (gcmScript) {
        response = await new HTMLRewriter()
          .on("head", { element(el) { el.append(gcmScript, { html: true }) } })
          .transform(response)
      }

      // 2. UTM preserver en <head>
      const analyticsEndpoint = "/__cmp/analytics"
      const utmScript = buildUTMScript(analyticsEndpoint)
      response = await new HTMLRewriter()
        .on("head", { element(el) { el.append(utmScript, { html: true }) } })
        .transform(response)

      // 2.1 Zaraz + GA4 event reporters
      const zarazScript = buildZarazReporterScript(analyticsEndpoint)
      const searchScript = buildSearchTrackerScript(analyticsEndpoint)
      const videoScript = buildVideoTrackerScript(analyticsEndpoint)
      const errorScript = buildErrorTrackerScript(analyticsEndpoint)

      response = await new HTMLRewriter()
        .on("head", { element(el) {
          el.append(zarazScript, { html: true })
          el.append(searchScript, { html: true })
          el.append(videoScript, { html: true })
          el.append(errorScript, { html: true })
        } })
        .transform(response)

      // 3. Bloquear scripts por categoría
      response = await blockScripts(response, consent)

      // 4. Banner CMP
      response = await injectBanner(response, {
        region, consent, endpoint: "/cmp/consent", legalHubPath: "/legal-hub"
      })

      // 5. Restaurar scripts tras consentimiento
      response = await restoreScriptsRuntime(response)

      // 6. Time tracker
      const timeScript = buildTimeTrackerScript(sessionId, analyticsEndpoint)
      const formScript = buildFormTrackerScript(analyticsEndpoint)
      const learningScript = buildLearningTrackerScript(analyticsEndpoint)

      // 6.1 Moodle Advanced Tracker (if Moodle platform detected)
      const moodleAdvancedScript = platforms.isMoodle && identity.moodleContext
        ? buildMoodleAdvancedTrackerScript(analyticsEndpoint)
        : null

      // 6.2 GA4 Standard Event Trackers (always inject if analytics consent)
      const lifecycleScript = buildUserLifecycleTrackerScript(analyticsEndpoint)
      const webVitalsScript = buildWebVitalsTrackerScript(analyticsEndpoint)
      const scrollDepthScript = buildScrollDepthTrackerScript(analyticsEndpoint)

      // 6.3 BuddyBoss Social Tracker (if BuddyBoss platform detected)
      const buddyBossScript = platforms.isBuddyBoss
        ? buildBuddyBossTrackerScript(analyticsEndpoint)
        : null

      response = await new HTMLRewriter()
        .on("body", { element(el) {
          el.append(timeScript, { html: true })
          el.append(formScript, { html: true })
          el.append(learningScript, { html: true })

          // GA4 Standard Trackers (always for better data capture)
          el.append(lifecycleScript, { html: true })
          el.append(webVitalsScript, { html: true })
          el.append(scrollDepthScript, { html: true })

          // Platform-specific trackers
          if (moodleAdvancedScript) {
            el.append(moodleAdvancedScript, { html: true })
          }
          if (buddyBossScript) {
            el.append(buddyBossScript, { html: true })
          }
        } })
        .transform(response)
    }

    // ════════════════════════════════════════════════════════════════════════════
    // ANALYTICS: ALL CLIENT-SIDE (Zaraz + JS Trackers)
    // El worker NO almacena ni procesa analytics - solo inyecta scripts
    // Tracking ocurre 100% en el cliente via Zaraz → Google Analytics 4
    // ════════════════════════════════════════════════════════════════════════════
    // ELIMINADO: trackPageview() - ahora es client-side via Zaraz
    // ELIMINADO: trackEventFromRequest() - ahora es client-side via navigator.sendBeacon()

    // SCRIPTS - GA4 Complete Event Tracking Stack (ALL CLIENT-SIDE)
    const nonce           = generateNonce()
    const gcmScript       = buildGCMScript(consent, region, nonce)
    const zarazScript     = buildZarazScript({ consent, geo, sessionId, region })
    const utmScript       = buildUTMScript(ANALYTICS_ENDPOINT)
    const timeTrackScript = buildTimeTrackerScript(sessionId, ANALYTICS_ENDPOINT)

    // Phase 1-2: LMS, Social, Form, Search, Video, Error Tracking
    const learningScript        = buildLearningTrackerScript()
    const moodleAdvancedScript  = buildMoodleAdvancedTrackerScript()
    const buddybossScript       = buildBuddyBossTrackerScript()
    const formScript            = buildFormTrackerScript(ANALYTICS_ENDPOINT)
    const searchScript          = buildSearchTrackerScript(ANALYTICS_ENDPOINT)
    const videoScript           = buildVideoTrackerScript(ANALYTICS_ENDPOINT)
    const errorScript           = buildErrorTrackerScript(ANALYTICS_ENDPOINT)

    // Base Response para HTMLRewriter
    const baseResponse = new Response(response.body, {
      status: response.status,
      headers
    })

    // HTMLRewriter: Inject all analytics scripts
    let rewritten = new HTMLRewriter()
      .on('head', {
        element(el) {
          el.prepend(gcmScript,  { html: true })
          el.append(zarazScript, { html: true })
          el.append(utmScript,   { html: true })
        }
      })
      .on('body', {
        element(el) {
          // Core tracking
          el.append(timeTrackScript, { html: true })
          // LMS Tracking (Moodle)
          el.append(learningScript,  { html: true })
          el.append(moodleAdvancedScript, { html: true })
          // Social Community (BuddyBoss + GamiPress)
          el.append(buddybossScript, { html: true })
          // Forms, Search, Video, Error tracking
          el.append(formScript,      { html: true })
          el.append(searchScript,    { html: true })
          el.append(videoScript,     { html: true })
          el.append(errorScript,     { html: true })
        }
      })
      .transform(baseResponse)

    // SCRIPT BLOCKER
    rewritten = blockScripts(rewritten, consent)

    // BANNER: SIEMPRE en HTML, como la versión vieja
    const langHeader = request.headers.get('accept-language') || 'en'
    const langCode   = langHeader.split(',')[0].split('-')[0].toLowerCase()
    const t          = TRANSLATIONS[langCode] || TRANSLATIONS.en

    const bannerHtml = buildBannerHTML({
      region,
      consent,
      endpoint     : ANALYTICS_ENDPOINT,
      legalHubPath : '/legal-hub/',
      t
    })

    return new HTMLRewriter()
      .on('body', {
        element(el) {
          el.append(bannerHtml, { html: true })
        }
      })
      .transform(rewritten)
  }
}
