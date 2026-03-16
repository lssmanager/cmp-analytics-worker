import { detectRegion, getGeoContext } from './modules/geo.js'
import {
  readConsent,
  getDefaultConsent,
  buildConsentCookie,
  parseConsentBody
} from './modules/consent.js'
import { buildGCMScript, generateNonce } from './modules/gcm.js'
import { buildZarazScript } from './modules/zarazReporter.js'
import { buildUTMScript } from './modules/utmPreserver.js'
import { buildTimeTrackerScript } from './modules/timeTracker.js'
import { buildLearningTrackerScript } from './modules/learningTracker.js'
import { buildBuddyBossTrackerScript } from './modules/buddybossTracker.js'
import { buildFormTrackerScript } from './modules/formTracker.js'
import { buildSearchTrackerScript } from './modules/searchTracker.js'
import { buildVideoTrackerScript } from './modules/videoTracker.js'
import { buildErrorTrackerScript } from './modules/errorTracker.js'
import { applyHeaders } from './modules/headers.js'
import {
  readSessionId,
  buildSessionCookie,
  buildUserIdentity
} from './modules/identity.js'
import { detectPlatforms } from './modules/platformDetect.js'
import { blockScripts } from './modules/scriptBlocker.js'
import { routePolicies } from './modules/policyRouter.js'
import { anonymizeIP } from './modules/utils.js'

// OJO: ya NO usamos injectBanner aquí
// import { injectBanner } from './modules/banner.js'
import { buildBannerHTML, TRANSLATIONS } from './modules/banner.js'

const ANALYTICS_ENDPOINT = '/__cmp/analytics'

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
    const identity = buildUserIdentity(request, geo, platforms, region)

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

    // ANALYTICS EVENT ENDPOINT
    if (request.method === 'POST' && url.pathname === ANALYTICS_ENDPOINT) {
      const result = await trackEventFromRequest(
        request,
        env,
        region,
        consent,
        geo,
        platforms,
        sessionId
      )
      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // ORIGIN
    let response      = await fetch(request)
    const contentType = response.headers.get('content-type') || ''

    // SECURITY HEADERS
    response = applyHeaders(response, region)
    const headers = new Headers(response.headers)
    headers.set('X-Privacy-Region',       region)
    headers.set('X-Visitor-IP',           visitorIP || '')
    headers.set('Referrer-Policy',        'strict-origin-when-cross-origin')
    headers.set('X-Frame-Options',        'SAMEORIGIN')
    headers.set('X-Content-Type-Options', 'nosniff')
    headers.set('Permissions-Policy',     'interest-cohort=()')

    // COOKIE NUEVO USUARIO (solo session id)
    if (isNewUser) {
      headers.append('Set-Cookie', buildSessionCookie(sessionId))
    }

    // NO HTML → devolver tal cual
    if (!contentType.includes('text/html')) {
      return new Response(response.body, {
        status: response.status,
        headers
      })
    }

    // ════════════════════════════════════════════════════════════════════════════
    // ANALYTICS: ALL CLIENT-SIDE (Zaraz + JS Trackers)
    // El worker NO almacena ni procesa analytics - solo inyecta scripts
    // Tracking ocurre 100% en el cliente via Zaraz → Google Analytics 4
    // ════════════════════════════════════════════════════════════════════════════
    // ELIMINADO: trackPageview() - ahora es client-side via Zaraz
    // ELIMINADO: trackEventFromRequest() - ahora es client-side via navigator.sendBeacon()

    // SCRIPTS - GA4 Complete Event Tracking Stack
    const nonce           = generateNonce()
    const gcmScript       = buildGCMScript(consent, region, nonce)
    const zarazScript     = buildZarazScript({ consent, geo, sessionId, region })
    const utmScript       = buildUTMScript(ANALYTICS_ENDPOINT)
    const timeTrackScript = buildTimeTrackerScript(sessionId, ANALYTICS_ENDPOINT)

    // SCRIPTS - GA4 Complete Event Tracking Stack (ALL CLIENT-SIDE)
    const nonce           = generateNonce()
    const gcmScript       = buildGCMScript(consent, region, nonce)
    const zarazScript     = buildZarazScript({ consent, geo, sessionId, region })
    const utmScript       = buildUTMScript(ANALYTICS_ENDPOINT)
    const timeTrackScript = buildTimeTrackerScript(sessionId, ANALYTICS_ENDPOINT)

    // Phase 1-2: LMS, Social, Form, Search, Video, Error Tracking
    const learningScript   = buildLearningTrackerScript()
    const buddybossScript  = buildBuddyBossTrackerScript()
    const formScript       = buildFormTrackerScript(ANALYTICS_ENDPOINT)
    const searchScript     = buildSearchTrackerScript(ANALYTICS_ENDPOINT)
    const videoScript      = buildVideoTrackerScript(ANALYTICS_ENDPOINT)
    const errorScript      = buildErrorTrackerScript(ANALYTICS_ENDPOINT)

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
