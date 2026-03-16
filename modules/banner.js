/* ─────────────────────────────────────────
   banner.js — CMP Banner bottom bar + i18n
   Cookie durations:
   - permanent : 90 days (accept)
   - session   : no max-age (deny / prefs / global auto)
   - none      : EU sin acción → banner persiste
───────────────────────────────────────── */

const DAYS90 = 90 * 24 * 60 * 60   // 7776000 segundos

const TRANSLATIONS = {
  es: { accept:"Aceptar", deny:"Rechazar", prefs:"Preferencias", save:"Guardar preferencias",
        necessary:"Funcional (requerido)", necessary_desc:"Cookies esenciales para el sitio.",
        analytics:"Analíticas", analytics_desc:"Nos ayuda a entender cómo usan el sitio.",
        marketing:"Marketing", marketing_desc:"Anuncios relevantes y efectividad de campañas.",
        preferences:"Preferencias", preferences_desc:"Recuerda tu configuración.",
        cookie_policy:"Política de cookies", privacy:"Privacidad", imprint:"Aviso legal",
        manage:"Gestionar servicios", title:"Gestionar consentimiento de cookies",
        msgs: {
          eu:     "Usamos cookies y tecnologías similares para que nuestro sitio funcione correctamente y para entender cómo lo usan los visitantes. Esto nos ayuda a mejorar nuestros servicios y ofrecer la mejor experiencia de aprendizaje en nuestros cursos.",
          us:     "Usamos cookies y tecnologías similares para que nuestro sitio funcione correctamente y para entender cómo lo usan los visitantes. Puede rechazar el uso de cookies no esenciales en cualquier momento.",
          ca:     "Usamos cookies y tecnologías similares para que nuestro sitio funcione correctamente y para entender cómo lo usan los visitantes. Esto nos ayuda a mejorar nuestros servicios y ofrecer la mejor experiencia de aprendizaje.",
          global: "Usamos cookies y tecnologías similares para que nuestro sitio funcione correctamente y para entender cómo lo usan los visitantes. Esto nos ayuda a mejorar nuestros servicios y ofrecer la mejor experiencia de aprendizaje en nuestros cursos."
        }
  },
  en: { accept:"Accept", deny:"Deny", prefs:"View preferences", save:"Save preferences",
        necessary:"Functional (required)", necessary_desc:"Essential cookies for the site to work.",
        analytics:"Analytics", analytics_desc:"Help us understand how visitors interact with the site.",
        marketing:"Marketing", marketing_desc:"Deliver relevant ads and track campaign effectiveness.",
        preferences:"Preferences", preferences_desc:"Remember your settings and personalize your experience.",
        cookie_policy:"Cookie policy", privacy:"Privacy statement", imprint:"Imprint",
        manage:"Manage services", title:"Manage Cookie Consent",
        msgs: {
          eu:     "We use cookies and similar technologies to ensure our website works smoothly and to understand how visitors use it. This helps us improve our services and provide the best possible experience and learning environment in our courses.",
          us:     "We use cookies and similar technologies to ensure our website works smoothly and to understand how visitors use it. You may opt out of non-essential cookies at any time.",
          ca:     "We use cookies and similar technologies to ensure our website works smoothly and to understand how visitors use it. This helps us improve our services and provide the best learning experience.",
          global: "We use cookies and similar technologies to ensure our website works smoothly and to understand how visitors use it. This helps us improve our services and provide the best possible experience and learning environment in our courses."
        }
  },
  fr: { accept:"Accepter", deny:"Refuser", prefs:"Préférences", save:"Enregistrer",
        necessary:"Fonctionnel (requis)", necessary_desc:"Cookies essentiels.",
        analytics:"Analytique", analytics_desc:"Comprendre les visites.",
        marketing:"Marketing", marketing_desc:"Publicités pertinentes.",
        preferences:"Préférences", preferences_desc:"Mémoriser vos paramètres.",
        cookie_policy:"Politique cookies", privacy:"Confidentialité", imprint:"Mentions légales",
        manage:"Gérer les services", title:"Gérer le consentement",
        msgs: {
          eu:     "Nous utilisons des cookies et des technologies similaires pour assurer le bon fonctionnement de notre site et comprendre comment les visiteurs l'utilisent. Cela nous aide à améliorer nos services et offrir la meilleure expérience d'apprentissage.",
          us:     "Nous utilisons des cookies pour assurer le bon fonctionnement du site. Vous pouvez refuser les cookies non essentiels à tout moment.",
          ca:     "Nous utilisons des cookies et des technologies similaires pour améliorer votre expérience d'apprentissage.",
          global: "Nous utilisons des cookies et des technologies similaires pour assurer le bon fonctionnement de notre site et améliorer votre expérience d'apprentissage."
        }
  },
  de: { accept:"Akzeptieren", deny:"Ablehnen", prefs:"Einstellungen", save:"Speichern",
        necessary:"Funktional (erforderlich)", necessary_desc:"Essentielle Cookies.",
        analytics:"Analytik", analytics_desc:"Besuche verstehen.",
        marketing:"Marketing", marketing_desc:"Relevante Werbung.",
        preferences:"Präferenzen", preferences_desc:"Einstellungen merken.",
        cookie_policy:"Cookie-Richtlinie", privacy:"Datenschutz", imprint:"Impressum",
        manage:"Dienste verwalten", title:"Cookie-Einwilligung verwalten",
        msgs: {
          eu:     "Wir verwenden Cookies und ähnliche Technologien, um unsere Website reibungslos zu betreiben und zu verstehen, wie Besucher sie nutzen. Dies hilft uns, unsere Dienste zu verbessern und die beste Lernerfahrung zu bieten.",
          us:     "Wir verwenden Cookies, um unsere Website reibungslos zu betreiben. Sie können nicht wesentlichen Cookies jederzeit widersprechen.",
          ca:     "Wir verwenden Cookies und ähnliche Technologien für eine bessere Lernerfahrung.",
          global: "Wir verwenden Cookies und ähnliche Technologien, um unsere Website reibungslos zu betreiben und Ihre Lernerfahrung zu verbessern."
        }
  },
  pt: { accept:"Aceitar", deny:"Rejeitar", prefs:"Preferências", save:"Guardar",
        necessary:"Funcional (obrigatório)", necessary_desc:"Cookies essenciais.",
        analytics:"Analítica", analytics_desc:"Compreender visitas.",
        marketing:"Marketing", marketing_desc:"Anúncios relevantes.",
        preferences:"Preferências", preferences_desc:"Lembrar configurações.",
        cookie_policy:"Política de cookies", privacy:"Privacidade", imprint:"Impressum",
        manage:"Gerir serviços", title:"Gerir consentimento de cookies",
        msgs: {
          eu:     "Utilizamos cookies e tecnologias semelhantes para garantir o bom funcionamento do nosso site e compreender como os visitantes o utilizam. Isso ajuda-nos a melhorar os nossos serviços e a proporcionar a melhor experiência de aprendizagem.",
          us:     "Utilizamos cookies para garantir o funcionamento do site. Pode recusar cookies não essenciais a qualquer momento.",
          ca:     "Utilizamos cookies e tecnologias semelhantes para melhorar a sua experiência de aprendizagem.",
          global: "Utilizamos cookies e tecnologias semelhantes para garantir o bom funcionamento do site e melhorar a sua experiência de aprendizagem."
        }
  },
  it: { accept:"Accetta", deny:"Rifiuta", prefs:"Preferenze", save:"Salva",
        necessary:"Funzionale (richiesto)", necessary_desc:"Cookie essenziali.",
        analytics:"Analisi", analytics_desc:"Capire le visite.",
        marketing:"Marketing", marketing_desc:"Annunci pertinenti.",
        preferences:"Preferenze", preferences_desc:"Ricordare le impostazioni.",
        cookie_policy:"Cookie policy", privacy:"Privacy", imprint:"Note legali",
        manage:"Gestisci servizi", title:"Gestisci il consenso ai cookie",
        msgs: {
          eu:     "Utilizziamo cookie e tecnologie simili per garantire il corretto funzionamento del sito e capire come i visitatori lo utilizzano. Questo ci aiuta a migliorare i nostri servizi e a offrire la migliore esperienza di apprendimento.",
          us:     "Utilizziamo cookie per il corretto funzionamento del sito. Puoi rifiutare i cookie non essenziali in qualsiasi momento.",
          ca:     "Utilizziamo cookie e tecnologie simili per migliorare la tua esperienza di apprendimento.",
          global: "Utilizziamo cookie e tecnologie simili per garantire il corretto funzionamento del sito e migliorare la tua esperienza di apprendimento."
        }
  }
}

const LOGO = "https://media.learnsocialstudies.com/wp-content/uploads/2026/03/08101052/Complianz-Logo-1.avif"

function getLang(request) {
  const header = request?.headers?.get("accept-language") || "en"
  const lang   = header.split(",")[0].split("-")[0].toLowerCase()
  return TRANSLATIONS[lang] ? lang : "en"
}

const BASE_CSS = `
<style>
#cmp-bar{
  position:fixed;bottom:0;left:0;right:0;z-index:999999;
  background:#fff;color:#021c44;
  box-shadow:0 -4px 24px rgba(2,28,68,.15);
  font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;
  font-size:14px;border-top:3px solid #052490;
  transition:opacity .4s ease;
}
#cmp-bar-main{
  max-width:1100px;margin:0 auto;
  padding:14px 24px;
  display:flex;align-items:center;gap:16px;flex-wrap:nowrap;
}
#cmp-bar-text{flex:1;min-width:0;font-size:13px;line-height:1.5;color:#021c44;order:1}
#cmp-bar-text strong{font-size:14px}
#cmp-bar-text a{color:#2259f2;text-decoration:underline;font-size:12px}
#cmp-bar-text a:hover{color:#f3b723}
#cmp-bar-right{display:flex;align-items:center;gap:14px;flex-shrink:0;margin-left:auto;order:2}
#cmp-logo{height:36px;width:auto;object-fit:contain;margin-left:16px;flex-shrink:0}
#cmp-bar-btns{display:flex;gap:8px;flex-wrap:wrap;align-items:center}
#cmp-countdown{font-size:11px;color:#6b7280;min-width:18px;text-align:center}
.cmp-btn{
  padding:9px 16px;border-radius:6px;font-size:13px;font-weight:600;
  cursor:pointer;border:none;transition:background .2s,color .2s;white-space:nowrap;
}
#cmp-btn-accept{background:#052490;color:#fff}
#cmp-btn-accept:hover{background:#f3b723;color:#021c44}
#cmp-btn-deny{background:#052490;color:#fff}
#cmp-btn-deny:hover{background:#f3b723;color:#021c44}
#cmp-btn-prefs{background:#f2f4f5;color:#021c44;border:1px solid #d0d5dd}
#cmp-btn-prefs:hover{background:#f3b723;color:#021c44;border-color:#f3b723}
#cmp-prefs-panel{
  display:none;border-top:1px solid #f2f4f5;
  max-width:1100px;margin:0 auto;padding:14px 24px 18px;
}
#cmp-prefs-panel.open{display:block}
.cmp-check-row{
  display:flex;align-items:center;justify-content:space-between;
  padding:7px 0;border-bottom:1px solid #f2f4f5;font-size:13px;
}
.cmp-check-row:last-child{border-bottom:none}
.cmp-check-label{font-weight:600;color:#021c44}
.cmp-check-desc{font-size:11px;color:#6b7280;margin-top:2px}
.cmp-toggle{position:relative;width:38px;height:20px;flex-shrink:0;margin-left:12px}
.cmp-toggle input{opacity:0;width:0;height:0}
.cmp-slider{position:absolute;inset:0;background:#d0d5dd;border-radius:20px;cursor:pointer;transition:background .2s}
.cmp-slider:before{content:"";position:absolute;width:14px;height:14px;left:3px;top:3px;background:#fff;border-radius:50%;transition:transform .2s}
.cmp-toggle input:checked+.cmp-slider{background:#052490}
.cmp-toggle input:checked+.cmp-slider:before{transform:translateX(18px)}
.cmp-toggle input:disabled+.cmp-slider{background:#052490;opacity:.6;cursor:not-allowed}
#cmp-btn-save{
  margin-top:12px;background:#052490;color:#fff;
  padding:9px 24px;border-radius:6px;font-size:13px;font-weight:600;
  cursor:pointer;border:none;
}
#cmp-btn-save:hover{background:#f3b723;color:#021c44}
@media(max-width:600px){
  #cmp-bar-main{padding:10px 14px;flex-wrap:wrap}
  .cmp-btn{font-size:12px;padding:7px 10px}
  #cmp-bar-right{order:1;width:100%;justify-content:flex-end;margin-left:0;margin-bottom:8px}
  #cmp-bar-text{order:2;width:100%}
  #cmp-logo{height:28px}
  #cmp-countdown{display:none}
}
</style>`

function barHTML(t, msg, cookieLink, privacyLink, legalHubPath, consent, showCountdown) {
  return `
  <div id="cmp-bar-main">
    <div id="cmp-bar-text">
      <strong>${t.title}</strong><br>${msg}
      <div style="margin-top:5px;display:flex;gap:10px;flex-wrap:wrap">
        <a href="${cookieLink}">${t.cookie_policy}</a>
        <a href="${privacyLink}">${t.privacy}</a>
        <a href="/disclaimer?cmplz_region_redirect=true">${t.imprint}</a>
        <a href="${legalHubPath}">${t.manage}</a>
      </div>
    </div>
    <div id="cmp-bar-right">
      <div id="cmp-bar-btns">
        <button class="cmp-btn" id="cmp-btn-accept">${t.accept}</button>
        <button class="cmp-btn" id="cmp-btn-deny">${t.deny}</button>
        <button class="cmp-btn" id="cmp-btn-prefs">${t.prefs}</button>
        ${showCountdown ? '<span id="cmp-countdown">10</span>' : ''}
      </div>
      <img id="cmp-logo" src="${LOGO}" alt="Learn Social Studies" onerror="this.style.display='none'">
    </div>
  </div>
  <div id="cmp-prefs-panel">
    <div class="cmp-check-row">
      <div><div class="cmp-check-label">${t.necessary}</div><div class="cmp-check-desc">${t.necessary_desc}</div></div>
      <label class="cmp-toggle"><input type="checkbox" id="cmp-t-necessary" checked disabled><span class="cmp-slider"></span></label>
    </div>
    <div class="cmp-check-row">
      <div><div class="cmp-check-label">${t.analytics}</div><div class="cmp-check-desc">${t.analytics_desc}</div></div>
      <label class="cmp-toggle"><input type="checkbox" id="cmp-t-analytics" ${consent?.analytics ? "checked" : ""}><span class="cmp-slider"></span></label>
    </div>
    <div class="cmp-check-row">
      <div><div class="cmp-check-label">${t.marketing}</div><div class="cmp-check-desc">${t.marketing_desc}</div></div>
      <label class="cmp-toggle"><input type="checkbox" id="cmp-t-marketing" ${consent?.marketing ? "checked" : ""}><span class="cmp-slider"></span></label>
    </div>
    <div class="cmp-check-row">
      <div><div class="cmp-check-label">${t.preferences}</div><div class="cmp-check-desc">${t.preferences_desc}</div></div>
      <label class="cmp-toggle"><input type="checkbox" id="cmp-t-preferences" ${consent?.preferences ? "checked" : ""}><span class="cmp-slider"></span></label>
    </div>
    <button class="cmp-btn" id="cmp-btn-save">${t.save}</button>
  </div>`
}

export function buildBannerHTML({ region, consent, endpoint, legalHubPath, t }) {
  const msg = t.msgs[region] || t.msgs.global
  const isEU = region === "eu"

  const cookieLink  = region === "ca" ? "/cookie-policy-ca?cmplz_region_redirect=true"
                    : region === "eu" ? "/cookie-policy-eu?cmplz_region_redirect=true"
                    : "/opt-out-preferences"
  const privacyLink = region === "ca" ? "/privacy-statement-ca?cmplz_region_redirect=true"
                    : region === "eu" ? "/privacy-statement-eu?cmplz_region_redirect=true"
                    : "/privacy-statement-us?cmplz_region_redirect=true"

  const epJson  = JSON.stringify(endpoint)
  const days90  = DAYS90

  /*
   * COOKIE BEHAVIOR:
   *
   * GLOBAL / US / CA:
   *   sin acción (10s/scroll) → session cookie, accept all  → vuelve próxima visita
   *   deny                    → session cookie, necessary   → vuelve próxima visita
   *   accept                  → 90d cookie, all true        → NO vuelve (90 días)
   *   preferences             → session cookie, selección   → vuelve próxima visita
   *
   * EU:
   *   sin acción              → NO cookie, banner persiste siempre
   *   deny                    → session cookie, necessary   → vuelve próxima visita
   *   accept                  → 90d cookie, all true        → NO vuelve (90 días)
   *   preferences             → session cookie, selección   → vuelve próxima visita
   */

  return `
${BASE_CSS}
<div id="cmp-bar">
  ${barHTML(t, msg, cookieLink, privacyLink, legalHubPath, consent, !isEU)}
</div>

<script>
(function(){
  var EP=${epJson}
  var IS_EU=${isEU ? "true" : "false"}
  var DAYS90=${days90}

  function g(id){return document.getElementById(id)}

  function hide(){
    var b=g("cmp-bar")
    if(b){b.style.opacity="0";setTimeout(function(){b.style.display="none"},400)}
  }

  // cookieAge: DAYS90 = permanente 90d | 0 = sesión (sin max-age) | -1 = no guardar
  function saveCookie(payload, cookieAge){
    if(cookieAge < 0) return   // EU sin acción: no guardar nada
    var parts=[]
    for(var k in payload){
      if(k !== "_source") parts.push(k+":"+payload[k])
    }
    var age = cookieAge > 0 ? ";max-age="+cookieAge : ""
    document.cookie="consent="+parts.join(",")+";path=/"+age+";SameSite=Lax"
  }

  async function cmpSend(payload, cookieAge, doReload){
    saveCookie(payload, cookieAge)
    try{
      if(cookieAge >= 0){
        await fetch(EP,{
          method:"POST",
          headers:{"content-type":"application/json"},
          body:JSON.stringify(payload)
        })
      }
      window.dispatchEvent(new CustomEvent("cmp:consent_updated",{detail:payload}))
      if(window.zaraz){
        zaraz.set("google_consent_update",{
          ad_storage        :payload.marketing ?"granted":"denied",
          ad_user_data      :payload.marketing ?"granted":"denied",
          ad_personalization:payload.marketing ?"granted":"denied",
          analytics_storage :payload.analytics ?"granted":"denied"
        })
      }
    }catch(e){}
    hide()
    if(doReload) setTimeout(function(){location.reload()},350)
  }

  // ── ACCEPT → 90 días, no vuelve ──────────────────────
  g("cmp-btn-accept")&&g("cmp-btn-accept").addEventListener("click",function(){
    cmpSend(
      {necessary:true,analytics:true,marketing:true,preferences:true},
      DAYS90,
      IS_EU   // EU recarga para activar scripts
    )
  })

  // ── DENY ─────────────────────────────────────────────
  // EU:           sesión → vuelve próxima visita
  // global/us/ca: sesión → vuelve próxima visita (igual)
  g("cmp-btn-deny")&&g("cmp-btn-deny").addEventListener("click",function(){
    cmpSend(
      {necessary:true,analytics:false,marketing:false,preferences:false},
      0,      // sesión
      IS_EU
    )
  })

  // ── PREFERENCES toggle ────────────────────────────────
  g("cmp-btn-prefs")&&g("cmp-btn-prefs").addEventListener("click",function(){
    g("cmp-prefs-panel").classList.toggle("open")
  })

  // ── SAVE PREFERENCES → sesión, vuelve próxima visita ──
  g("cmp-btn-save")&&g("cmp-btn-save").addEventListener("click",function(){
    cmpSend({
      necessary   :true,
      analytics   :!!(g("cmp-t-analytics")  &&g("cmp-t-analytics").checked),
      marketing   :!!(g("cmp-t-marketing")  &&g("cmp-t-marketing").checked),
      preferences :!!(g("cmp-t-preferences")&&g("cmp-t-preferences").checked)
    },
    0,        // sesión
    IS_EU
    )
  })

  // ── AUTO-DISMISS (solo global/us/ca) ──────────────────
  // EU: sin acción = solo ocultar, SIN guardar cookie
  var gone=false
  function autoDismiss(){
    if(gone)return;gone=true
    if(IS_EU){
      hide()  // EU: solo ocultar, no guarda cookie → banner vuelve próxima visita
      return
    }
    // global/us/ca: accept all con cookie de sesión
    cmpSend(
      {necessary:true,analytics:true,marketing:true,preferences:true},
      0,      // sesión → vuelve próxima visita
      false
    )
  }

  window.addEventListener("scroll",   autoDismiss,{once:true,passive:true})
  window.addEventListener("touchend", autoDismiss,{once:true,passive:true})

  // Countdown solo para global/us/ca
  if(!IS_EU){
    var n=10,cd=g("cmp-countdown")
    var ti=setInterval(function(){
      n--;if(cd)cd.textContent=n
      if(n<=0){clearInterval(ti);autoDismiss()}
    },1000)
  }
})()
</script>`
}

export async function injectBanner(response, { region, consent, mergedConsent, request, endpoint, legalHubPath }) {
  // consent = rawConsent (null si no hay cookie en el request)
  if (consent !== null && consent !== undefined) return response

  const lang = getLang(request)
  const t    = TRANSLATIONS[lang] || TRANSLATIONS.en
  const html = buildBannerHTML({ region, consent: mergedConsent, endpoint, legalHubPath, t })

  return new HTMLRewriter()
    .on("body", { element(el) { el.append(html, { html: true }) } })
    .transform(response)
}

export async function buildBannerHTML(request, consent, region) {
  const lang        = getLang(request)
  const t           = TRANSLATIONS[lang]
  const cookieLink  = `/legal-hub/cookie-policy-${region === 'eu' ? 'eu' : region === 'ca' ? 'ca' : 'us'}/`
  const privacyLink = `/legal-hub/privacy-statement-${region === 'eu' ? 'eu' : region === 'us' ? 'us' : region === 'ca' ? 'ca' : 'us'}/`
  const legalHub    = '/legal-hub/'
  const msg         = t.msgs[region] ?? t.msgs.global
  const show        = !consent || (!consent.analytics && !consent.marketing)
  return barHTML(t, msg, cookieLink, privacyLink, legalHub, consent, show)
}
