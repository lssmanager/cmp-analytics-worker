export function buildBannerHTML({ region, consent, endpoint, legalHubPath }) {
  const shown = !consent || (!consent.analytics && !consent.marketing)
  const msgs  = {
    eu:     "Usamos cookies. Requerimos consentimiento bajo GDPR antes de activar analytics o publicidad.",
    us:     "Puedes optar por no participar en la venta de datos bajo CCPA.",
    ca:     "Requerimos consentimiento bajo normativa canadiense de privacidad.",
    global: "Este sitio usa cookies para mejorar tu experiencia."
  }

  return `
<div id="cmp-banner" style="position:fixed;left:12px;right:12px;bottom:12px;
  background:#0f172a;color:#e2e8f0;padding:16px 20px;border-radius:14px;
  z-index:999999;font-family:system-ui;font-size:14px;
  box-shadow:0 20px 60px rgba(0,0,0,.4);display:${shown ? "block" : "none"}">
  <div style="max-width:1100px;margin:auto">
    <p style="margin:0 0 12px">${msgs[region] || msgs.global}</p>
    <div style="display:flex;gap:14px;flex-wrap:wrap;margin-bottom:12px;font-size:13px">
      <label><input type="checkbox" id="cmp-analytics"   ${consent?.analytics   ? "checked" : ""}> Analytics</label>
      <label><input type="checkbox" id="cmp-marketing"   ${consent?.marketing   ? "checked" : ""}> Marketing</label>
      <label><input type="checkbox" id="cmp-preferences" ${consent?.preferences ? "checked" : ""}> Preferencias</label>
    </div>
    <div style="display:flex;gap:8px;flex-wrap:wrap">
      <button id="cmp-accept"
        style="padding:9px 16px;border:0;border-radius:8px;background:#22c55e;color:white;cursor:pointer">
        Aceptar todo</button>
      <button id="cmp-reject"
        style="padding:9px 16px;border:0;border-radius:8px;background:#ef4444;color:white;cursor:pointer">
        Solo necesarias</button>
      <button id="cmp-save"
        style="padding:9px 16px;border:1px solid #475569;border-radius:8px;background:transparent;color:#94a3b8;cursor:pointer">
        Guardar</button>
      <a href="${legalHubPath}" style="padding:9px 0;color:#64748b;font-size:12px;align-self:center">
        Política de privacidad</a>
    </div>
  </div>
</div>

<script>
(function() {
  async function cmpSend(payload) {
    try {
      const res = await fetch(${JSON.stringify(endpoint)}, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) return;
      window.dispatchEvent(new CustomEvent("cmp:consent_updated", { detail: payload }));
      if (window.zaraz) {
        zaraz.set("google_consent_update", {
          ad_storage         : payload.marketing  ? "granted" : "denied",
          ad_user_data       : payload.marketing  ? "granted" : "denied",
          ad_personalization : payload.marketing  ? "granted" : "denied",
          analytics_storage  : payload.analytics  ? "granted" : "denied"
        });
      }
      setTimeout(function() { location.reload(); }, 300);
    } catch(e) {}
  }

  var $ = function(id){ return document.getElementById(id); };

  $("cmp-accept") && $("cmp-accept").addEventListener("click", function() {
    cmpSend({ necessary:true, analytics:true, marketing:true, preferences:true });
  });
  $("cmp-reject") && $("cmp-reject").addEventListener("click", function() {
    cmpSend({ necessary:true, analytics:false, marketing:false, preferences:false });
  });
  $("cmp-save") && $("cmp-save").addEventListener("click", function() {
    cmpSend({
      necessary   : true,
      analytics   : !!($("cmp-analytics")   && $("cmp-analytics").checked),
      marketing   : !!($("cmp-marketing")   && $("cmp-marketing").checked),
      preferences : !!($("cmp-preferences") && $("cmp-preferences").checked)
    });
  });
})();
</script>`
}

export async function injectBanner(response, options) {
  const html = buildBannerHTML(options)
  return new HTMLRewriter()
    .on("body", { element(el) { el.append(html, { html: true }) } })
    .transform(response)
}
