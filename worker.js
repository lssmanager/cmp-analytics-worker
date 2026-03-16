import { detectRegion, getGeoContext }    from './modules/geo.js'
import { readConsent, getDefaultConsent,
         buildConsentCookie,
         parseConsentBody }               from './modules/consent.js'
import { buildGCMScript, generateNonce }  from './modules/gcm.js'
import { buildZarazScript }               from './modules/zarazReporter.js'
import { buildUTMScript }                 from './modules/utmPreserver.js'
import { buildTimeTrackerScript }         from './modules/timeTracker.js'
import { applyHeaders }                   from './modules/headers.js'
import { readSessionId, buildSessionCookie,
         buildUserIdentity }              from './modules/identity.js'
import { detectPlatforms }                from './modules/platformDetect.js'
import { blockScripts }                   from './modules/scriptBlocker.js'
import { routePolicies }                  from './modules/policyRouter.js'
import { anonymizeIP }                    from './modules/utils.js'
import { trackPageview,
         trackEventFromRequest }          from './modules/analytics.js'
import { injectBanner }                   from './modules/banner.js'

const ANALYTICS_ENDPOINT = '/__cmp/analytics'

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url)

    // BYPASS: assets, crawlers, wp-admin
    const cfWorker  = request.headers.get('cf-worker') || ''
    const isAsset   = /\.(js|css|woff2?|png|jpg|jpeg|gif|svg|ico|webp|map|txt|xml)(\?|$)/i.test(url.pathname)
    const isWpAdmin = url.pathname.startsWith('/wp-admin')
    if (cfWorker || isAsset || isWpAdmin) return fetch(request)

    // GEO + REGION
    const cf      = request.cf ?? {}
    const geo     = getGeoContext(cf)
    const region  = detectRegion(cf)

    // IP
    const rawIP     = request.headers.get('cf-connecting-ip')
    const visitorIP = anonymizeIP(rawIP, region) ?? rawIP

    // CONSENT
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
      return Response.redirect('https://www.learnsocialstudies.com' + policyPath, 302)
    }

    // CONSENT POST
    if (request.method === 'POST' && url.pathname === '/__cmp/consent') {
      const body   = await parseConsentBody(request)
      const merged = { necessary: true, ...body }
      const cookie = buildConsentCookie(merged)
      return new Response('OK', {
        status: 200,
        headers: { 'Set-Cookie': cookie, 'Content-Type': 'text/plain' }
      })
    }

    // ANALYTICS EVENT ENDPOINT
    if (request.method === 'POST' && url.pathname === ANALYTICS_ENDPOINT) {
      const result = await trackEventFromRequest(
        request, env, region, consent, geo, platforms, sessionId
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

    // COOKIE NUEVO USUARIO
    if (isNewUser) headers.append('Set-Cookie', buildSessionCookie(sessionId))

    // NO HTML → devolver tal cual
    if (!contentType.includes('text/html')) {
      return new Response(response.body, { status: response.status, headers })
    }

    // ANALYTICS PAGEVIEW (async)
    if (consent?.analytics) {
      ctx.waitUntil(
        trackPageview(request, env, region, consent, geo, platforms, sessionId, identity)
      )
    }

    // SCRIPTS
    const nonce           = generateNonce()
    const gcmScript       = buildGCMScript(consent, region, nonce)
    const zarazScript     = buildZarazScript({ consent, geo, sessionId, region })
    const utmScript       = buildUTMScript(ANALYTICS_ENDPOINT)
    const timeTrackScript = buildTimeTrackerScript(sessionId, ANALYTICS_ENDPOINT)

    // Base Response para HTMLRewriter
    const baseResponse = new Response(response.body, {
      status: response.status,
      headers
    })

    // HTMLRewriter: head + body (sin banner aquí)
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
          el.append(timeTrackScript, { html: true })
        }
      })
      .transform(baseResponse)

    // SCRIPT BLOCKER
    rewritten = blockScripts(rewritten, consent)

    // BANNER SOLO SI NO HAY COOKIE
    return injectBanner(rewritten, {
      region,
      consent      : rawConsent,
      mergedConsent: consent,
      request,
      endpoint     : ANALYTICS_ENDPOINT,
      legalHubPath : '/legal-hub/'
    })
  }
}
