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

    /* ── FAST BYPASS: assets, crawlers y cf-workers ── */
    const cfWorker = request.headers.get('cf-worker') || ''
    const isAsset  = /\.(js|css|woff2?|png|jpg|jpeg|gif|svg|ico|webp|map|txt|xml)(\?|$)/i.test(url.pathname)
    if (cfWorker || isAsset) return fetch(request)

    /* ── GEO Y REGIÓN ── */
    const cf      = request.cf ?? {}
    const geo     = getGeoContext(cf)
    const region  = detectRegion(cf)

    /* ── IP ANONYMIZATION ── */
    const rawIP     = request.headers.get('cf-connecting-ip')
    const visitorIP = anonymizeIP(rawIP, region) ?? rawIP

    /* ── CONSENT COOKIE ── */
    const rawConsent = readConsent(request)
    const consent    = rawConsent ?? getDefaultConsent(region)

    /* ── PLATFORM + IDENTITY ── */
    const platforms = detectPlatforms(request)
    let   sessionId = readSessionId(request)
    const isNewUser = !sessionId
    if (!sessionId) {
      const { randomId } = await import('./modules/utils.js')
      sessionId = randomId()
    }
    const identity = buildUserIdentity(request, geo, platforms, region)

    /* ── POLICY REDIRECT ── */
    const policyPath = routePolicies(url, region)
    if (policyPath) {
      return Response.redirect('https://www.learnsocialstudies.com' + policyPath, 302)
    }

    /* ── CONSENT POST ── */
    if (request.method === 'POST' && url.pathname === '/__cmp/consent') {
      const body   = await parseConsentBody(request)
      const merged = { necessary: true, ...body }
      const cookie = buildConsentCookie(merged)
      return new Response('OK', {
        status: 200,
        headers: { 'Set-Cookie': cookie, 'Content-Type': 'text/plain' }
      })
    }

    /* ── ANALYTICS EVENT ENDPOINT ── */
    if (request.method === 'POST' && url.pathname === ANALYTICS_ENDPOINT) {
      const result = await trackEventFromRequest(
        request, env, region, consent, geo, platforms, sessionId
      )
      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    /* ── FETCH ORIGIN ── */
    let response      = await fetch(request)
    const contentType = response.headers.get('content-type') || ''

    /* ── SECURITY HEADERS ── */
    response = applyHeaders(response, region)
    const headers = new Headers(response.headers)
    headers.set('X-Privacy-Region',       region)
    headers.set('X-Visitor-IP',           visitorIP)
    headers.set('Referrer-Policy',        'strict-origin-when-cross-origin')
    headers.set('X-Frame-Options',        'SAMEORIGIN')
    headers.set('X-Content-Type-Options', 'nosniff')
    headers.set('Permissions-Policy',     'interest-cohort=()')

    /* ── COOKIE NUEVO USUARIO ── */
    if (isNewUser) headers.append('Set-Cookie', buildSessionCookie(sessionId))

    /* ── NO HTML: devolver con headers ── */
    if (!contentType.includes('text/html')) {
      return new Response(response.body, { status: response.status, headers })
    }

    /* ── ANALYTICS PAGEVIEW edge (no bloquea respuesta) ── */
    if (consent?.analytics) {
      ctx.waitUntil(
        trackPageview(request, env, region, consent, geo, platforms, sessionId, identity)
      )
    }

    /* ── SCRIPTS ── */
    const nonce           = generateNonce()
    const gcmScript       = buildGCMScript(consent, region, nonce)
    const zarazScript     = buildZarazScript({ consent, geo, sessionId, region })
    const utmScript       = buildUTMScript(ANALYTICS_ENDPOINT)
    const timeTrackScript = buildTimeTrackerScript(sessionId, ANALYTICS_ENDPOINT)

    /* ── BANNER (compatible con cualquier export de banner.js) ── */

    /* ── INYECTAR EN HTML ── */
    let rewritten = new HTMLRewriter()
      .on('head', {
        element(el) {
          el.prepend(gcmScript,   { html: true })
          el.append(zarazScript,  { html: true })
          el.append(utmScript,    { html: true })
        }
      })
      .on('body', {
        element(el) {
          el.append(bannerHTML,       { html: true })
          el.append(timeTrackScript,  { html: true })
        }
      })
      .transform(new Response(response.body, { status: response.status, headers }))

    /* ── SCRIPT BLOCKER ── */
    rewritten = blockScripts(rewritten, consent)

    /* ── BANNER (solo si no hay consent cookie) ── */
    return injectBanner(rewritten, {
      region,
      consent     : rawConsent,
      mergedConsent: consent,
      request,
      endpoint    : ANALYTICS_ENDPOINT,
      legalHubPath: '/legal-hub/'
    })
  }
}

/* ── FALLBACK BANNER inline si banner.js no exporta función ── */
function _fallbackBanner(region) {
  const msgs = {
    eu:     'We use cookies for analytics. Consent required under GDPR.',
    us:     'This site may share data for analytics. You can opt-out under CCPA.',
    ca:     'This website uses cookies and requires consent under Canadian privacy law.',
    global: 'This website uses cookies.'
  }
  const text = msgs[region] ?? msgs.global
  return `<div id="cmp-bar" style="position:fixed;bottom:0;left:0;right:0;background:#ffffff !important;color:#1a1a1a;border-top:1px solid #e5e7eb;padding:16px 24px;z-index:9999;font-family:system-ui;box-shadow:0 -2px 8px rgba(0,0,0,0.08)"><div style="max-width:1100px;margin:auto;display:flex;align-items:center;gap:12px;flex-wrap:wrap"><p style="margin:0;flex:1">${text}</p><button onclick="(function(){document.cookie='consent=necessary:true,analytics:true,marketing:true;path=/;max-age=7776000';location.reload()})()">Accept</button><button onclick="(function(){document.cookie='consent=necessary:true,analytics:false,marketing:false;path=/;max-age=7776000';location.reload()})()">Reject</button><a href="/legal-hub">Legal hub</a></div></div>`
}
